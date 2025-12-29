System profile: GenericGame

Add system-specific mapping rules and adapter logic here.

Files:
 - profile.yaml: YAML-based mapping and transformation flags
 - adapter.py: Python functions to parse and convert system-specific stat blocks into the canonical format
 - README.md: This file

How to use:
 - Implement mappings and adapter
 - Add your adapter import to the full-document pipeline as a selectable system profile
 - Re-run the pipeline on your example docs
