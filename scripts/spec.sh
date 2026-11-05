#!/usr/bin/env bash
set -euo pipefail

if [ "${1:-}" = "--list" ] || [ "$#" -eq 0 ]; then
  grep -Hn '^## ' specification/*.md | sed 's/:## /  /'
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
