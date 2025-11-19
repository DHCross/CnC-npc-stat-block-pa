#!/usr/bin/env bash
set -euo pipefail

echo "Ensure pyragify is installed. Try pipx or pip:"
if ! command -v python3 >/dev/null 2>&1; then
  echo "python3 is not installed. Please install Python 3.9+"
  exit 1
fi

if ! python3 -m pip show pyragify >/dev/null 2>&1; then
  echo "pyragify not found; installing into user site (python -m pip install pyragify --user)"
  python3 -m pip install pyragify --user
fi

# Parse args
SKIP_DOCS=false
SKIP_CODE=false
TEMPLATES_ONLY=false
TEMPLATES_ZIP=tmp/templates_only.zip
SKELETON_ONLY=false
SKELETON_ZIP=tmp/skeleton_only.zip
VERIFY_SKELETON=false
while [ "$#" -gt 0 ]; do
  case "$1" in
    --no-docs)
      SKIP_DOCS=true; shift;;
    --no-code)
      SKIP_CODE=true; shift;;
    --only-docs)
      SKIP_CODE=true; shift;;
    --only-code)
      SKIP_DOCS=true; shift;;
    --templates)
      TEMPLATES_ONLY=true; shift;;
    --skeleton)
      SKELETON_ONLY=true; shift;;
    --verify-skeleton)
      VERIFY_SKELETON=true; shift;;
    *) echo "Unknown arg: $1"; shift;;
  esac
done

# Run pyragify on CnC Docs
CONFIG=scripts/pyragify_config_cncdocs.yaml
OUTDIR=$(grep 'output_dir:' $CONFIG | cut -d: -f2 | tr -d '[:space:]' || echo tmp/pyragify_cncdocs)
mkdir -p "$OUTDIR"

if [ "$SKIP_DOCS" = "false" ]; then
  echo "Running pyragify with config: $CONFIG"
  python3 -m pyragify --config-file "$CONFIG" --verbose
else
  echo "--no-docs supplied: Skipping pyragify docs generation"
fi

# Template-only ZIP
if [ "$TEMPLATES_ONLY" = "true" ]; then
  echo "Creating template-only ZIP: $TEMPLATES_ZIP"
  rm -f "$TEMPLATES_ZIP"
  zip -r "$TEMPLATES_ZIP" docs/templates docs/examples/CnC_Implementation docs/examples/PF2e_Implementation
  echo "Template-only ZIP created: $TEMPLATES_ZIP"
fi

if [ "$SKELETON_ONLY" = "true" ]; then
  echo "Creating skeleton-only ZIP: $SKELETON_ZIP"
  rm -rf tmp/skeleton && mkdir -p tmp/skeleton
  # Copy core framework files but exclude system-specific rules
  rsync -av --prune-empty-dirs \
    --include='*/' \
    --include='document-analyzer.ts' \
    --include='full-document-pipeline.ts' \
    --include='stat-block-types.ts' \
    --include='stat-block-helpers.ts' \
    --include='utils.ts' \
    --exclude='name-mappings.ts' \
    --include='monster-parser.ts' \
    --include='monster-formatter.ts' \
    --exclude='classification-rules.ts' \
    --exclude='enhanced-parser.ts' \
    --exclude='name-mappings.ts' \
    --exclude='*' src/lib/ tmp/skeleton/src/lib/

  # Include scripts and template docs
  mkdir -p tmp/skeleton/scripts tmp/skeleton/docs
  rsync -av scripts/generate-code* tmp/skeleton/scripts/ || true
  rsync -av docs/templates tmp/skeleton/docs/ || true

  # Ensure forbidden C&C-specific files are not present (defensive cleanup)
  rm -f tmp/skeleton/src/lib/classification-rules.ts || true
  rm -f tmp/skeleton/src/lib/enhanced-parser.ts || true
  rm -f tmp/skeleton/src/lib/name-mappings.ts || true

  # Ensure old skeleton zip is removed so old files don't persist in the archive
  rm -f "$SKELETON_ZIP"
  zip -r "$SKELETON_ZIP" tmp/skeleton
  echo "Skeleton-only ZIP created: $SKELETON_ZIP"
fi

if [ "$VERIFY_SKELETON" = "true" ]; then
  echo "Verifying skeleton cleanliness..."
  ./scripts/verify_skeleton_clean.sh "$SKELETON_ZIP"
fi

# Zip the output for NotebookLM
ZIPNAME=tmp/pyragify_cncdocs.zip
echo "Zipping output to $ZIPNAME"
rm -f "$ZIPNAME"
zip -r "$ZIPNAME" "$OUTDIR"

echo "Done. Upload $ZIPNAME to NotebookLM. See scripts/README-notebooklm.md for tips."

# Also generate code markdown and produce combined zip
if [ "$SKIP_CODE" = "false" ]; then
  echo "Generating code markdown for NotebookLM"
  python3 scripts/generate_code_markdown.py --outdir tmp/code_markdown --max-words 3000 --dirs src,scripts,test,data --map
else
  echo "--no-code supplied: Skipping code markdown generation"
fi

COMBINED=tmp/combined_notebooklm.zip
echo "Creating combined zip: $COMBINED"
rm -f "$COMBINED"
if [ "$SKIP_DOCS" = "false" ] && [ "$SKIP_CODE" = "false" ]; then
  zip -r "$COMBINED" tmp/pyragify_cncdocs tmp/code_markdown
elif [ "$SKIP_DOCS" = "false" ]; then
  zip -r "$COMBINED" tmp/pyragify_cncdocs
elif [ "$SKIP_CODE" = "false" ]; then
  zip -r "$COMBINED" tmp/code_markdown
else
  echo "Both docs and code were skipped; no combined zip created"
fi
echo "Combined ZIP ready at $COMBINED"
echo "You can upload $COMBINED to NotebookLM or upload each zip separately."
echo "Check tmp/code_markdown/chunk_map.csv for mapping info if code generation ran."