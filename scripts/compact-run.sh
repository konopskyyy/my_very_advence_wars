#!/usr/bin/env bash

# Uruchamia polecenie i zostawia pełny log w TMPDIR, a na ekran wypisuje tylko
# status i końcówkę. Dzięki temu output testów i builda nie trafia w całości
# do kontekstu modela.

set -uo pipefail

LOG_DIR=${COMPACT_LOG_DIR:-${TMPDIR:-/tmp}/opencode/mvaw}
RETENTION_MINUTES=${COMPACT_RETENTION_MINUTES:-1440}
TAIL_LINES=${COMPACT_TAIL_LINES:-20}
FAIL_TAIL_LINES=${COMPACT_FAIL_TAIL_LINES:-40}

usage() {
  cat <<'EOF'
Użycie:
  scripts/compact-run.sh [--label NAZWA] [--] POLECENIE [ARG...]
  scripts/compact-run.sh --last

Zmienne:
  COMPACT_LOG_DIR           katalog logów (domyślnie $TMPDIR/opencode/mvaw)
  COMPACT_RETENTION_MINUTES ile minut trzymać logi (domyślnie 1440)
  COMPACT_TAIL_LINES        linie końcówki przy sukcesie (domyślnie 20)
  COMPACT_FAIL_TAIL_LINES   linie końcówki przy błędzie (domyślnie 40)
EOF
}

latest_log() {
  if [ ! -d "$LOG_DIR" ]; then
    return 1
  fi

  ls -1t "$LOG_DIR"/*.log 2>/dev/null | head -n 1
}

print_last() {
  local log

  log=$(latest_log) || {
    echo "[compact-run] brak logów w $LOG_DIR" >&2
    return 1
  }

  if [ -z "$log" ]; then
    echo "[compact-run] brak logów w $LOG_DIR" >&2
    return 1
  fi

  echo "[compact-run] ostatni log: $log"
  tail -n "$FAIL_TAIL_LINES" "$log"
}

LABEL=''
COMMAND=()

while [ $# -gt 0 ]; do
  case "$1" in
    --last)
      print_last
      exit $?
      ;;
    --label)
      if [ $# -lt 2 ]; then
        echo "[compact-run] --label wymaga nazwy" >&2
        exit 2
      fi
      LABEL=$2
      shift 2
      ;;
    --help | -h)
      usage
      exit 0
      ;;
    --)
      shift
      COMMAND=("$@")
      break
      ;;
    *)
      COMMAND=("$@")
      break
      ;;
  esac
done

if [ ${#COMMAND[@]} -eq 0 ]; then
  usage >&2
  exit 2
fi

mkdir -p "$LOG_DIR"
find "$LOG_DIR" -type f -name '*.log' -mmin "+$RETENTION_MINUTES" -delete 2>/dev/null

if [ -z "$LABEL" ]; then
  LABEL=$(basename -- "${COMMAND[0]}")
fi

SAFE_LABEL=$(printf '%s' "$LABEL" | tr -cs 'A-Za-z0-9._-' '-' | sed 's/^-//; s/-$//')
if [ -z "$SAFE_LABEL" ]; then
  SAFE_LABEL='run'
fi

STAMP=$(date +%Y%m%d-%H%M%S)
LOG_FILE="$LOG_DIR/${STAMP}-$$-${SAFE_LABEL}.log"

"${COMMAND[@]}" >"$LOG_FILE" 2>&1
STATUS=$?

LINES=$(wc -l <"$LOG_FILE" | tr -d ' ')
BYTES=$(wc -c <"$LOG_FILE" | tr -d ' ')

if [ "$STATUS" -eq 0 ]; then
  RESULT='OK'
  TAIL=$TAIL_LINES
else
  RESULT="BŁĄD (kod $STATUS)"
  TAIL=$FAIL_TAIL_LINES
fi

echo "[compact-run] $SAFE_LABEL: $RESULT | ${LINES} linii | ${BYTES} B"
echo "[compact-run] pełny log: $LOG_FILE"

if [ "$BYTES" -eq 0 ]; then
  echo "(brak wyjścia)"
else
  tail -n "$TAIL" "$LOG_FILE"
fi

exit "$STATUS"
