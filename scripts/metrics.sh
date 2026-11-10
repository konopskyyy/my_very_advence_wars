#!/usr/bin/env bash

# Pomiar jakości na żądanie. Nie jest częścią CI — uruchamiany z terminala
# (`make metrics`), żeby porównać kolejne podejścia bez spowalniania pipeline'u.

set -uo pipefail

ROOT=$(cd "$(dirname "$0")/.." && pwd)
cd "$ROOT" || exit 1
CLIENT="$ROOT/client"
REPORT_DIR="$CLIENT/reports"
LOG_DIR=${TMPDIR:-/tmp}/opencode/mvaw
STAMP=$(date +%Y%m%d-%H%M%S)
LOG_FILE="$LOG_DIR/metrics-$STAMP.log"
RUN_MUTATION=0

usage() {
  cat <<'EOF'
Użycie:
  scripts/metrics.sh [--mutation]

Mierzy na żądanie: czasy typów, testów i builda, rozmiar bundla, linie
i eksporty plików, pokrycie (gdy provider jest zainstalowany), duplikaty,
naruszenia zależności oraz MSI z istniejącego raportu Strykera.

  --mutation   najpierw uruchom pełny Stryker (około 4 minut)

Wynik: gotowy wiersz markdown na ekranie i client/reports/metrics.md.
EOF
}

while [ $# -gt 0 ]; do
  case "$1" in
    --mutation)
      RUN_MUTATION=1
      shift
      ;;
    --help | -h)
      usage
      exit 0
      ;;
    *)
      echo "[metrics] nieznany argument: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

mkdir -p "$REPORT_DIR" "$LOG_DIR"

LAST_SECONDS='—'
LAST_STATUS=0

run_timed() {
  local start end
  start=$(date +%s%N)
  (cd "$CLIENT" && "$@") >>"$LOG_FILE" 2>&1
  LAST_STATUS=$?
  end=$(date +%s%N)
  LAST_SECONDS=$(awk -v ns="$((end - start))" 'BEGIN { printf "%.1f", ns / 1000000000 }')
  return 0
}

json_metric() {
  node -e '
    const fs = require("fs");
    const [file, expression] = process.argv.slice(1);
    try {
      const data = JSON.parse(fs.readFileSync(file, "utf8"));
      const value = Function("data", `return (${expression});`)(data);
      if (value === undefined || value === null || Number.isNaN(value)) {
        console.log("—");
      } else if (typeof value === "number") {
        console.log(Number.isInteger(value) ? String(value) : value.toFixed(1));
      } else {
        console.log(value);
      }
    } catch {
      console.log("—");
    }
  ' "$1" "$2"
}

echo "[metrics] log: $LOG_FILE"

pl() {
  printf '%s' "$1" | tr '.' ','
}

run_timed npx tsc --noEmit
TYPECHECK=$LAST_SECONDS
[ "$LAST_STATUS" -ne 0 ] && TYPECHECK="${TYPECHECK}!"

run_timed npx vitest run --reporter=dot
TESTS=$LAST_SECONDS
[ "$LAST_STATUS" -ne 0 ] && TESTS="${TESTS}!"

run_timed npx vite build
BUILD=$LAST_SECONDS
[ "$LAST_STATUS" -ne 0 ] && BUILD="${BUILD}!"

if [ "$RUN_MUTATION" -eq 1 ]; then
  echo "[metrics] pełny przebieg Strykera (to potrwa kilka minut)…"
  run_timed npx stryker run
fi

BUNDLE_KB=$(node -e '
  const fs = require("fs");
  const path = require("path");
  let bytes = 0;
  (function walk(dir) {
    try {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (entry.name.endsWith(".js")) bytes += fs.statSync(full).size;
      }
    } catch {}
  })("client/dist");
  console.log((bytes / 1024).toFixed(1));
')

FILE_STATS=$(node -e '
  const { execSync } = require("child_process");
  const fs = require("fs");
  const files = execSync("git ls-files \"client/src/*.ts\"", { encoding: "utf8" })
    .trim()
    .split("\n")
    .filter(Boolean);
  let total = 0;
  let maxLines = 0;
  let maxExports = 0;
  const rows = [];
  for (const file of files) {
    const text = fs.readFileSync(file, "utf8");
    const lines = text.split("\n").length - 1;
    const exports = (text.match(/^export\s/gm) || []).length;
    total += lines;
    if (lines > maxLines) maxLines = lines;
    if (exports > maxExports) maxExports = exports;
    rows.push([lines, exports, file]);
  }
  rows.sort((a, b) => b[0] - a[0]);
  const top = rows.slice(0, 5).map(([lines, , file]) => `${file} (${lines})`).join("; ");
  console.log([maxLines, maxExports, total, top].join("\t"));
')
IFS=$'\t' read -r MAX_LINES MAX_EXPORTS TOTAL_LINES TOP_FILES <<<"$FILE_STATS"

COVERAGE='—'
if [ -d "$CLIENT/node_modules/@vitest/coverage-v8" ]; then
  run_timed npx vitest run --coverage --coverage.reporter=json-summary \
    --coverage.reportsDirectory=reports/coverage --coverage.include='src/core/**/*.ts'
  COVERAGE=$(json_metric "$REPORT_DIR/coverage/coverage-summary.json" 'data.total?.lines?.pct')
fi

MUTATION='—'
if [ -f "$REPORT_DIR/mutation.json" ]; then
  MUTATION=$(json_metric "$REPORT_DIR/mutation.json" '
    ((d) => {
      let killed = 0;
      let total = 0;
      for (const file of Object.values(d.files || {})) {
        for (const mutant of file.mutants || []) {
          const status = mutant.status;
          if (["Ignored", "CompileError", "RuntimeError"].includes(status)) continue;
          total += 1;
          if (status === "Killed" || status === "Timeout") killed += 1;
        }
      }
      return total ? (100 * killed) / total : undefined;
    })(data)
  ')
fi

SERVER_MUTATION='—'
for candidate in "$ROOT/server/var/infection/infection.json" "$ROOT/server/var/infection/infection-log.json"; do
  if [ -f "$candidate" ]; then
    SERVER_MUTATION=$(json_metric "$candidate" 'data.stats?.msi')
    [ "$SERVER_MUTATION" != '—' ] && break
  fi
done

(cd "$CLIENT" && npx jscpd src tests --reporters json --output reports/jscpd --silent) >>"$LOG_FILE" 2>&1
DUPLICATION=$(json_metric "$REPORT_DIR/jscpd/jscpd-report.json" 'data.statistics?.total?.percentage')

(cd "$CLIENT" && npx depcruise --config .dependency-cruiser.cjs src --output-type json >reports/depcruise.json) >>"$LOG_FILE" 2>&1
DEP_MODULES=$(node -e '
  try {
    console.log(JSON.parse(require("fs").readFileSync(process.argv[1], "utf8")).modules?.length ?? 0);
  } catch {
    console.log(0);
  }
' "$REPORT_DIR/depcruise.json")
if [ "$DEP_MODULES" -eq 0 ]; then
  DEP_VIOLATIONS='—'
  echo "[metrics] depcruise przeanalizował 0 modułów — szczegóły w logu" >&2
  rm -f "$REPORT_DIR/depcruise.json"
else
  DEP_VIOLATIONS=$(json_metric "$REPORT_DIR/depcruise.json" 'data.summary?.violations?.length')
fi

COMMIT=$(git -C "$ROOT" rev-parse --short HEAD)
DATE=$(date +%Y-%m-%d)

TYPECHECK=$(pl "$TYPECHECK")
TESTS=$(pl "$TESTS")
BUILD=$(pl "$BUILD")
BUNDLE_KB=$(pl "$BUNDLE_KB")
COVERAGE=$(pl "$COVERAGE")
MUTATION=$(pl "$MUTATION")
SERVER_MUTATION=$(pl "$SERVER_MUTATION")
DUPLICATION=$(pl "$DUPLICATION")

ROW="| — | $DATE | $COMMIT | $TYPECHECK | $TESTS | $BUILD | $BUNDLE_KB | $COVERAGE | $MUTATION | $SERVER_MUTATION | $MAX_LINES | $MAX_EXPORTS | $DUPLICATION | $DEP_VIOLATIONS |"

cat >"$REPORT_DIR/metrics.md" <<EOF
# Pomiar jakości — $DATE ($COMMIT)

| Typy (s) | Testy (s) | Build (s) | Bundle JS (KiB) | Pokrycie core (%) | MSI klient (%) | MSI serwer (%) | Max plik (linie) | Eksporty (max) | Duplikaty (%) | Naruszenia depcruise |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| $TYPECHECK | $TESTS | $BUILD | $BUNDLE_KB | $COVERAGE | $MUTATION | $SERVER_MUTATION | $MAX_LINES | $MAX_EXPORTS | $DUPLICATION | $DEP_VIOLATIONS |

- Linie w \`client/src\`: $TOTAL_LINES
- Największe pliki: $TOP_FILES
- Pełny log: $LOG_FILE
- Wiersz do tabeli w \`specification/Jakosc-kodu.md\`:

\`\`\`
$ROW
\`\`\`
EOF

echo
echo "[metrics] $DATE ($COMMIT)"
echo "  typy: ${TYPECHECK}s | testy: ${TESTS}s | build: ${BUILD}s"
echo "  bundle JS: ${BUNDLE_KB} KiB | pokrycie core: ${COVERAGE}% | MSI klient: ${MUTATION}% | MSI serwer: ${SERVER_MUTATION}%"
echo "  max plik: ${MAX_LINES} linii | max eksportów: ${MAX_EXPORTS} | duplikaty: ${DUPLICATION}% | naruszenia depcruise: ${DEP_VIOLATIONS}"
echo "  największe pliki: $TOP_FILES"
echo "  raport: $REPORT_DIR/metrics.md"
echo
echo "[metrics] wiersz do specification/Jakosc-kodu.md:"
echo "$ROW"
