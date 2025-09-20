# Changelog

## 2025-09-19

### Major Fixes
- Fixed Git repository corruption caused by invalid ref file (`main 2`) in `.git/refs/remotes/origin/`.
- Updated `findEquipment` to handle both raw equipment lists and full stat blocks for robust test and production compatibility.
- Enhanced `normalizeDisposition` to immediately return correct noun form for common alignment patterns (e.g., `lawful good` → `law/good`).
- Improved test regex patterns to support names with titles and commas.
- Fixed stat block content extraction regex to handle multiline and non-greedy matches.

### Test Suite
- All 19 comprehensive parser tests now pass, validating Jeremy Farkas's editorial requirements for C&C stat blocks.
- Added edge case coverage for shield normalization, PHB item renames, magic item italicization, and disposition parsing.

### Build & Validation
- Build and test workflows confirmed healthy after repository repair.
- No data loss; all code and history preserved and restored from remote.

---

# Lessons Learned

- **Git Hygiene**: Invalid or corrupted ref files can break local repositories. Always diagnose with `git fsck --full` and clean up with targeted file removal and remote fetch.
- **Test-Driven Development**: Comprehensive test suites catch subtle formatting bugs and edge cases that manual review misses.
- **Parser Flexibility**: Functions like `findEquipment` should support both raw and formatted input for robust testing and production use.
- **Regex Robustness**: Regex patterns must account for multiline, greedy/non-greedy, and special character cases to reliably extract content.
- **Immediate Returns for Common Patterns**: In normalization functions, handle common cases with explicit returns for clarity and reliability.
- **Validation Coverage**: Automated validation and correction systems are essential for enforcing editorial standards and maintaining output quality.
- **Safe Recovery**: When repairing Git corruption, always ensure remote data is intact before deleting local files.
