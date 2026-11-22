#!/usr/bin/env bash
# Render reports/*.md into notes/<slug>.html with pandoc.
# Usage: ./build.sh
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p notes

for src in reports/*.md; do
  [ -e "$src" ] || continue
  name=$(basename "$src" .md)
  slug=$(printf '%s' "$name" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-|-$//g')
  title=$(grep -m1 '^# ' "$src" | sed "s/^# //; s/'/’/g")
  words=$(wc -w < "$src")
  readtime=$(( (words + 229) / 230 ))
  date=$(date -r "$src" '+%B %Y')

  sed '1{/^# /d;}' "$src" | pandoc \
    --from markdown --to html5 \
    --template templates/note.html \
    --toc --toc-depth=2 \
    --metadata title="$title" \
    --metadata description="$title" \
    --metadata date="$date" \
    --metadata readtime="$readtime" \
    -o "notes/$slug.html"

  echo "notes/$slug.html  ($title, $readtime min)"
done
