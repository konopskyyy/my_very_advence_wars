#!/usr/bin/env bash
set -euo pipefail

if [ "${1:-}" = "--list" ] || [ "$#" -eq 0 ]; then
  grep -Hn '^## ' specification/*.md | sed 's/:## /  /'
  exit 0
fi

if [ "${1:-}" = "--find" ]; then
  pattern="${2:-}"
  if [ -z "$pattern" ]; then
    echo "Użycie: scripts/spec.sh --find FRAZA" >&2
    exit 2
  fi

  matches="$(awk -v pat="$pattern" '
    FNR == 1 { section = "" }
    /^## / { section = $0 }
    section != "" && index(tolower($0), tolower(pat)) > 0 {
      key = FILENAME SUBSEP section
      if (!(key in seen)) {
        seen[key] = 1
        printf "%s  %s\n", FILENAME, section
      }
    }
  ' specification/*.md | sort -u)"

  if [ -z "$matches" ]; then
    echo "Brak sekcji z frazą: $pattern" >&2
    exit 1
  fi

  count=$(printf '%s\n' "$matches" | wc -l | tr -d ' ')
  printf '%s\n' "$matches" | awk 'NR <= 40'
  if [ "$count" -gt 40 ]; then
    echo "[spec] $count trafień, pokazano 40 — zawęź frazę" >&2
  fi
  exit 0
fi

id="$1"
file="${2:-}"

if [ -z "$file" ]; then
  file="$(grep -l "^## ${id}[:(]" specification/*.md | head -n 1 || true)"
fi

if [ -z "$file" ] || [ ! -f "$file" ]; then
  echo "Nie znaleziono sekcji ${id} w specification/*.md" >&2
  exit 1
fi

printf '# %s\n' "$file"

awk -v prefix="## $id" '
  index($0, prefix) == 1 {
    rest = substr($0, length(prefix) + 1)
    if (rest == "" || substr(rest, 1, 1) == ":" || substr(rest, 1, 1) == "(") {
      found = 1
    }
  }
  found && seen && /^## / { exit }
  found { print; seen = 1 }
' "$file"
