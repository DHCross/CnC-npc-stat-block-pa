#!/usr/bin/env python3
"""
Generate Markdown files containing code blocks for later upload to NotebookLM.

Script behavior:
 - Walk selected directories (default: `src`, `scripts`, `test`, `data` optional)
 - Collect files with certain extensions (e.g., .py, .ts, .js, .tsx, .jsx, .md)
 - Group them into Markdown files that contain headings and fenced code blocks
 - Chunk output when a `max_words` threshold is reached (NotebookLM-friendly)
 - Write results to `tmp/code_markdown/` and zip them

Usage:
    python3 scripts/generate_code_markdown.py --outdir tmp/code_markdown --max-words 3000

"""
from __future__ import annotations
import argparse
from collections import defaultdict
from pathlib import Path
import re
import json
import os
import zipfile

# Detect words roughly: split by whitespace
WORD_RE = re.compile(r"\w+")

DEFAULT_EXTENSIONS = [
    ".py", ".ts", ".js", ".jsx", ".tsx", ".java", ".c", ".cpp", ".h", ".cs",
    ".go", ".rb", ".php", ".sh", ".bash", ".zsh", ".yml", ".yaml", ".json", ".css", ".scss", ".html", ".md"
]

DEFAULT_DIRS = ["src", "scripts", "test", "test/e2e", "data"]

META_FILENAME = "metadata.json"


def count_words(text: str) -> int:
    return len(WORD_RE.findall(text))


def highlight_language_from_ext(path: Path) -> str:
    ext = path.suffix.lower()
    if ext == ".py":
        return "python"
    if ext in [".ts"]:
        return "typescript"
    if ext == ".js":
        return "javascript"
    if ext in [".jsx"]:
        return "jsx"
    if ext in [".tsx"]:
        return "tsx"
    if ext in [".md"]:
        return "markdown"
    if ext in [".css"]:
        return "css"
    if ext in [".html"]:
        return "html"
    if ext in [".sh", ".bash", ".zsh"]:
        return "bash"
    if ext in [".yml", ".yaml"]:
        return "yaml"
    return ext.replace(".", "") or "text"


class Collector:
    def __init__(self, outdir: Path, max_words: int = 3000, extensions: list[str] | None = None):
        self.outdir = outdir
        self.max_words = max_words
        self.extensions = set((extensions or DEFAULT_EXTENSIONS))
        self.chunks: list[Path] = []
        self.metadata = {"chunks": []}

    def add_file(self, src_path: Path, relative_path: str) -> None:
        try:
            text = src_path.read_text(encoding='utf-8')
        except Exception:
            text = src_path.read_text(encoding='latin-1', errors='ignore')
        # Prepare markdown block for this file
        lang = highlight_language_from_ext(src_path)
        header = f"### {relative_path}\n\n"
        code_block = f"```{lang}\n" + text + "\n```\n\n"

        # Now add to the current chunk or open a new chunk if near max words
        self._ensure_chunk()
        cur_chunk_path = self.chunks[-1]
        cur_text_words = count_words(cur_chunk_path.read_text(encoding='utf-8'))
        add_words = count_words(header) + count_words(code_block)
        if cur_text_words + add_words > self.max_words and cur_text_words > 0:
            # start a new chunk
            self._new_chunk()
            cur_chunk_path = self.chunks[-1]

        with cur_chunk_path.open('a', encoding='utf-8') as fh:
            fh.write(header)
            fh.write(code_block)

        # Add to metadata
        self.metadata["chunks"][-1]["files"].append(relative_path)

    def _ensure_chunk(self) -> None:
        if not self.chunks:
            self._new_chunk()

    def _new_chunk(self) -> None:
        index = len(self.chunks)
        p = self.outdir / f"chunk_{index}.md"
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(f"# Chunk {index}\n\n", encoding='utf-8')
        self.chunks.append(p)
        self.metadata.setdefault("chunks", []).append({"file": str(p), "files": []})

    def save_metadata(self) -> None:
        p = self.outdir / META_FILENAME
        p.write_text(json.dumps(self.metadata, indent=2), encoding='utf-8')


def walk_and_collect(paths: list[str], collector: Collector, ignore_patterns: list[str] | None = None) -> None:
    ignore_patterns = ignore_patterns or []
    for base in paths:
        base_path = Path(base)
        if not base_path.exists():
            continue
        for p in base_path.rglob('*'):
            if p.is_dir():
                continue
            if p.suffix.lower() not in collector.extensions:
                continue
            skip = False
            for pat in ignore_patterns:
                if p.match(pat):
                    skip = True
                    break
            if skip:
                continue
            # use os.path.relpath to avoid ValueError when p is not under Path.cwd() as a Path
            rel = os.path.relpath(p, Path.cwd())
            collector.add_file(p, rel)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--outdir", default="tmp/code_markdown", help="Output directory")
    parser.add_argument("--max-words", type=int, default=3000, help="Max words per chunk")
    parser.add_argument("--dirs", nargs="*", default=DEFAULT_DIRS, help="Dirs to scan (space or comma separated)")
    parser.add_argument("--ext", nargs="*", help="Extensions to include (override) --space or comma separated")
    parser.add_argument("--map", action="store_true", help="Write a CSV mapping of chunks->source files and word counts")
    args = parser.parse_args()

    outdir = Path(args.outdir)
    if outdir.exists():
        # optional remove old
        pass
    outdir.mkdir(parents=True, exist_ok=True)

    # Support comma-separated args for convenience
    dirs = []
    for d in args.dirs:
        if isinstance(d, str) and "," in d:
            dirs.extend([x.strip() for x in d.split(",") if x.strip()])
        else:
            dirs.append(d)

    exts = args.ext
    if exts:
        newexts = []
        for e in exts:
            if "," in e:
                newexts.extend([x.strip() for x in e.split(",") if x.strip()])
            else:
                newexts.append(e)
        exts = newexts

    collector = Collector(outdir, max_words=args.max_words, extensions=exts)
    walk_and_collect(args.dirs, collector, ignore_patterns=["node_modules/*", "**/__pycache__/*"])
    collector.save_metadata()
    # Write map csv for debugging and chunk/source mapping
    if args.map:
        import csv

        map_csv = outdir / "chunk_map.csv"
        with map_csv.open("w", newline='', encoding='utf-8') as fh:
            writer = csv.writer(fh)
            writer.writerow(["chunk_file", "word_count", "source_files"])
            for c in collector.metadata.get("chunks", []):
                chunk_file = Path(c["file"]).name
                try:
                    text = (outdir / chunk_file).read_text(encoding='utf-8')
                except Exception:
                    text = ""
                words = count_words(text)
                sources = ";".join(c.get("files", []))
                writer.writerow([chunk_file, words, sources])
        print("Map CSV written to", map_csv)

    # zip
    zip_path = Path("tmp/code_markdown.zip")
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for chunk in collector.chunks:
            zf.write(chunk, arcname=chunk.name)
        zf.write(outdir / META_FILENAME, arcname=META_FILENAME)

    print("Wrote chunks to", outdir)
    print("ZIP created at", zip_path)


if __name__ == '__main__':
    main()
