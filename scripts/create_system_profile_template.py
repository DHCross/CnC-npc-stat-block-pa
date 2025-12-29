#!/usr/bin/env python3
"""
Create a new system-profile template folder with a README, sample YAML profile, and a Python adapter.

Usage:
  python3 scripts/create_system_profile_template.py --name 'Pathfinder2' --outdir system-profiles

This creates `system-profiles/Pathfinder2/` with:
 - profile.yaml -> mappings for canonical fields
 - adapter.py -> sample function to convert an input stat block to canonical format
 - README.md -> instructions for how to populate and test
"""

from pathlib import Path
import argparse

def main():
    p = argparse.ArgumentParser()
    p.add_argument('--name', required=True)
    p.add_argument('--outdir', default='system-profiles')
    args = p.parse_args()

    name = args.name
    outdir = Path(args.outdir)
    dest = outdir / name
    dest.mkdir(parents=True, exist_ok=True)

    yaml = dest / 'profile.yaml'
    yaml.write_text('''# System profile for: {name}
# Use this YAML to map system fields to canonical fields.
# Example mapping: system attribute -> canonical attribute
mappings:
  STR: strength
  DEX: dexterity
  CON: constitution
  INT: intelligence
  WIS: wisdom
  CHA: charisma

# Example transformations:
# - convert_hit dice to integer
# - convert_hp_string: "2d8+3" -> approximate or exact numeric parse
transformations:
  parse_hp: true
  armor_value: 'AC'
'''.replace('{name}', name))

    adapter = dest / 'adapter.py'
    adapter.write_text('''# Sample adapter for {name}
# Implement functions that parse an input string or structure and return canonical dict.
import re

def parse_hp(hp_string: str) -> int:
    # simple parse to extract the numeric part or the average of a die formula
    if 'd' in hp_string:
        m = re.match(r"(\\d+)d(\\d+)([+-]\\d+)?", hp_string)
        if m:
            n, faces, bonus = m.groups()
            n, faces = int(n), int(faces)
            avg = n * (faces + 1) // 2
            if bonus:
                avg += int(bonus)
            return avg
    try:
        return int(hp_string)
    except Exception:
        return 0


def to_canonical(input_block: dict) -> dict:
    # Map input block keys to canonical keys (replace or transform as required)
    out = {}
    out['name'] = input_block.get('name')
    out['hp'] = parse_hp(str(input_block.get('HP', '0')))
    out['ac'] = int(input_block.get('AC', 10))
    # More mappings...
    return out

# Add test cases here or integrate with your pipeline to sanity check outputs
'''.replace('{name}', name))

    readme = dest / 'README.md'
    readme.write_text(f"""System profile: {name}

Add system-specific mapping rules and adapter logic here.

Files:
 - profile.yaml: YAML-based mapping and transformation flags
 - adapter.py: Python functions to parse and convert system-specific stat blocks into the canonical format
 - README.md: This file

How to use:
 - Implement mappings and adapter
 - Add your adapter import to the full-document pipeline as a selectable system profile
 - Re-run the pipeline on your example docs
""")

    print('Created system profile template at', dest)

if __name__ == '__main__':
    main()
