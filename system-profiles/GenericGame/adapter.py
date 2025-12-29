# Sample adapter for GenericGame
# Implement functions that parse an input string or structure and return canonical dict.
import re

def parse_hp(hp_string: str) -> int:
    # simple parse to extract the numeric part or the average of a die formula
    if 'd' in hp_string:
        m = re.match(r"(\d+)d(\d+)([+-]\d+)?", hp_string)
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
