"""
Template stat block parser (generic)

This file is a TIER 1 template: it contains placeholders and neutral names.
COPY THIS FILE into `system-profiles/<SystemName>/` and fill in your system's field regexes.

Do NOT include system-specific code or terminology.

Replace:
- {SYSTEM_NAME} with your system name
- {DIFFICULTY_METRIC} with the system's difficulty rating field (e.g., CR for D&D)
- {STAT_FORMAT} with the example stat block format

"""
import re
from typing import Dict, Any

# --- PLACEHOLDER: define regex patterns per target system ---
# Example patterns are intentionally generic; replace them with your system's
PATTERNS = {
    # name of the creature/actor
    "name": r"(?P<name>^[A-Za-z0-9' .,\-]+)$",
    # example difficulty metric lines; e.g., CR, CL, ST
    "difficulty": r"{DIFFICULTY_PATTERN}",
    # hit points or HP expression
    "hp": r"(?i)HP(?:\:)?\s*(?P<hp>[0-9d+\- ]+)",
    # armor class / ac
    "ac": r"(?i)AC(?:\:)?\s*(?P<ac>\d+)",
}


def parse_statblock(text: str, difficulty_pattern: str = None) -> Dict[str, Any]:
    """Parse a stat block into canonical fields.

    This function uses simple regex matching as an example. For production use
    replace the regexes and add robust normalization.

    Args:
        text: raw stat block text to parse
        difficulty_pattern: optional regex string for the difficulty metric if the default is not correct

    Returns:
        dict containing canonical fields: name, hp, ac, difficulty, raw_text
    """
    out = {"raw_text": text}

    # Name — first non-empty line
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    if lines:
        out["name"] = lines[0]

    # Optional difficulty override
    if difficulty_pattern:
        m = re.search(difficulty_pattern, text)
        if m:
            out["difficulty"] = m.group(1)

    # HP
    m = re.search(PATTERNS["hp"], text)
    if m:
        out["hp"] = m.group("hp")

    # AC
    m = re.search(PATTERNS["ac"], text)
    if m:
        out["ac"] = int(m.group("ac"))

    return out

# Example: provide a sample call
if __name__ == '__main__':
    sample = """
Name of Creature
HP: 22 (3d8 + 6)
AC: 14
"""
    print(parse_statblock(sample))
