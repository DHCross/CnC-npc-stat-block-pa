# System Profiles for Multi-system Canonicalization

This repository supports a library of *system profiles* to adapt the canonicalization pipeline to different role-playing game systems. Each profile provides:

- `profile.yaml`: mapping rules and simple flags for parsing (e.g., parse_hp: true)
- `adapter.py`: Python module with `to_canonical()` functions that convert a system's stat blocks into the repository's canonical schema
- `README.md`: Documentation for the profile and any notes on how to parse or convert unique rules

Why this matters
- NotebookLM will do far better when you add a 'system profile' folder that includes the system's rules and examples. When you upload the project + the system profile to NotebookLM, you can ask it to propose conversions and code suggestions specific to that system.

How to use
1. Create a new profile:
```
python3 scripts/create_system_profile_template.py --name 'MySystem' --outdir system-profiles
```
2. Implement `adapter.py` for the system and add mappings to `profile.yaml`.
3. Run `analyzeFullDocument` on documents that contain the game's stat blocks. Use `SystemProfile` as a parameter to the analyzer if supported.

When uploading to NotebookLM
- Upload the `system-profiles/<System>` folder along with canonical code and docs so NotebookLM can read: mapping, example stat blocks, transformation code.
- Use the NotebookLM prompts in `scripts/README-notebooklm.md` (next section) to ask NotebookLM to extract suggested code or sample mappings.

Creating a new repo from a NotebookLM-guided skeleton:
- Ask NotebookLM for a recommended canonicalization plan and sample adapter code.
- Use that explanation to seed a new repository and `adapter.py` files.
