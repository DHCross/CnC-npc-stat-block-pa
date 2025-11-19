"""
Template Module Validator

This is an abstract module validator for an RPG workbench. Replace the schema
and validation rules for your target system. Keep this file generic — do not
use system-specific terms.
"""
import json
from typing import Dict, Any

SAMPLE_SCHEMA = {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "RPG Module",
    "type": "object",
    "properties": {
        "title": {"type": "string"},
        "entries": {
            "type": "array",
            "items": {"type": "object"}
        }
    },
    "required": ["title", "entries"]
}


def validate_module(module_data: Dict[str, Any], schema: Dict[str, Any] = None) -> Dict[str, Any]:
    """Validate basic module shape.

    This validator is intentionally simple. For full validation, use JSON
    schema and a library like `jsonschema`.
    """
    schema = schema or SAMPLE_SCHEMA

    # very light validation for demonstration
    result = {"is_valid": True, "errors": []}

    if not isinstance(module_data, dict):
        result["is_valid"] = False
        result["errors"].append("module must be an object")
        return result

    for key in schema.get("required", []):
        if key not in module_data:
            result["is_valid"] = False
            result["errors"].append(f"missing required property: {key}")

    # more rules can be added here
    return result

if __name__ == '__main__':
    print(json.dumps(validate_module({}), indent=2))
