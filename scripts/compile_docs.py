#!/usr/bin/env python3
"""
Compile repository documentation into a single Markdown / text file, and optionally export to PDF

Usage:
  python3 scripts/compile_docs.py --dirs "CnC Docs" docs "Sample Docs" 
  python3 scripts/compile_docs.py --all  # walk entire repo (excludes node_modules, .git)

Output files created in `tmp/`: `compiled_docs.md`, `compiled_docs.txt`, and if pandoc is available `compiled_docs.pdf`.

Notes:
  - The script skips binary files and large directories like node_modules and .git by default.
  - Markdown sections include a file heading with relative path for traceability.
"""

import argparse
import os
import shutil
import subprocess
from pathlib import Path
from typing import List

# Defaults
ROOT = Path.cwd()
TMP_DIR = ROOT / 'tmp'
DEFAULT_DOC_DIRS = ["CnC Docs", "docs", "Designer Notes", "Developer Notes", "Sample Docs"]
INCLUDE_EXTS = ['.md', '.mdx', '.txt', '.markdown']
EXCLUDE_DIRS = ['.git', 'node_modules', '.next', 'dist', 'build']


def find_files(dirs: List[str], all_walk: bool=False):
    files = []
    if all_walk:
        for root, dirnames, filenames in os.walk(ROOT):
            # prune
            dirnames[:] = [d for d in dirnames if d not in EXCLUDE_DIRS]
            for f in filenames:
                if Path(f).suffix.lower() in INCLUDE_EXTS:
                    files.append(Path(root) / f)
        return sorted(files)

    for d in dirs:
        path = ROOT / d
        if not path.exists():
            continue
        for root, _, filenames in os.walk(path):
            # skip common exclusions
            if any(part in EXCLUDE_DIRS for part in Path(root).parts):
                continue
            for f in filenames:
                if Path(f).suffix.lower() in INCLUDE_EXTS:
                    files.append(Path(root) / f)
    return sorted(files)


def write_compiled_md(file_list: List[Path], dest: Path):
    lines = []
    for p in file_list:
        lines.append(f"\n\n<!-- BEGIN_FILE: {p.relative_to(ROOT)} -->\n\n")
        lines.append(f"# Source: {p.relative_to(ROOT)}\n\n")
        try:
            text = p.read_text(encoding='utf8')
        except Exception as e:
            text = f"(Could not read file: {e})"
        lines.append(text)
        lines.append("\n\n<!-- END_FILE -->\n")
    dest.write_text('\n'.join(lines), encoding='utf8')
    print('Wrote', dest)


def compile_to_pdf(md_file: Path, pdf_file: Path):
    # Prefer pandoc if installed
    # pypandoc may not be present; call pandoc CLI if available
    try:
        subprocess.run(['pandoc', str(md_file), '-o', str(pdf_file)], check=True)
        print('Wrote', pdf_file)
        return True
    except (FileNotFoundError, subprocess.CalledProcessError):
        print('Pandoc not available or failed; skipping PDF generation')
        return False


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--dirs', nargs='+', default=DEFAULT_DOC_DIRS,
                        help='List of directories to include (relative to repo root)')
    parser.add_argument('--all', action='store_true', help='Walk entire repo (excludes node_modules/.git)')
    parser.add_argument('--out', default=str(TMP_DIR/'compiled_docs'), help='Output base path (no suffix)')
    args = parser.parse_args()

    TMP_DIR.mkdir(parents=True, exist_ok=True)

    files = find_files(args.dirs, all_walk=args.all)
    print('Found', len(files), 'files')

    md_out = Path(args.out + '.md')
    txt_out = Path(args.out + '.txt')
    pdf_out = Path(args.out + '.pdf')

    write_compiled_md(files, md_out)

    # also write a plain text version, stripping markdown
    try:
        import markdown
        html = markdown.markdown(md_out.read_text(encoding='utf8'))
        # strip tags simply
        import re
        text = re.sub('<[^<]+?>', '', html)
        txt_out.write_text(text, encoding='utf8')
        print('Wrote', txt_out)
    except Exception:
        # fallback: copy md to txt
        shutil.copy2(md_out, txt_out)
        print('Wrote', txt_out, '(copied markdown since markdown package unavailable)')

    # Try to compile PDF with pandoc
    compile_to_pdf(md_out, pdf_out)

    print('Done. Next step: upload', pdf_out if pdf_out.exists() else txt_out, 'to NotebookLM or other LLM tools')
