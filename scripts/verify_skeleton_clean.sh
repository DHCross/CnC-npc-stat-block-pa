#!/usr/bin/env bash
set -euo pipefail

# Verify that skeleton_only.zip does not contain C&C-specific files
ZIP=${1:-tmp/skeleton_only.zip}

if [ ! -f "$ZIP" ]; then
  echo "ERROR: $ZIP not found. Run --skeleton first to generate skeleton." >&2
  exit 2
fi

# Exclusions list (pattern names in zip)
EXCLUDES=(
  "classification-rules.ts"
  "enhanced-parser.ts"
  "name-mappings.ts"
)

FAILED=0
for f in "${EXCLUDES[@]}"; do
  if unzip -l "$ZIP" 2>/dev/null | grep -q "$f"; then
    echo "Forbidden file found in skeleton: $f" >&2
    FAILED=1
  else
    echo "OK: $f not found in skeleton"
  fi
done

if [ "$FAILED" -eq 1 ]; then
  echo "Skeleton verification failed: remove forbidden C&C-specific files from the skeleton export." >&2
  exit 1
fi

# Extra check: ensure at least one core skeleton file is present
if unzip -l "$ZIP" 2>/dev/null | grep -q "full-document-pipeline.ts"; then
  echo "Skeleton contains core framework file: full-document-pipeline.ts"
else
  echo "ERROR: full-document-pipeline.ts not found in skeleton; check skeleton creation." >&2
  exit 2
fi

# success
echo "Skeleton verification passed — no forbidden C&C-specific files found."
exit 0
