{
  "name": "cnc-npc-stat-block-pa",
  "version": "1.0.0",
  "main": "electron/main.js",
  "scripts": {
    "start": "electron .",
    "build:electron": "electron-builder"
  },
  "build": {
    "appId": "com.example.cnc-npc-stat-block",
    "files": [
      "electron/**",
      "dist/**",
      "index.html",
      "package.json"
    ],
    "directories": {
      "app": "."
    },
    "asar": true
  }
}

# Electron DMG Build Lessons Learned

## 1. Entry Point Must Be Explicit and Inside app.asar
- Electron expects the entry file (e.g., `electron/main.js`) to be present inside `app.asar`, matching the `"main"` field in `package.json`.
- Set a single, top-level `"main": "electron/main.js"` in `package.json`. Do not duplicate or override in the build config.
- Do not use `extraResources` for entry files; they must be inside `app.asar`, not alongside it.

## 2. Canonical package.json Build Config
- Use a single canonical `build` block in `package.json`.
- Set `build.directories.app` to `"."` so the packager includes the project root.
- Set `build.files` minimally, e.g.: `["electron/**", "dist/**", "index.html", "package.json"]`
- Do not use `extraResources` for entry files; only for true external resources.

## 3. ES Modules vs. CommonJS
- If using `"type": "module"`, all Electron code must use `import/export` syntax.
- Do not use `require()` in ES modules.

## 4. Troubleshooting Persistent Entry Errors
If Electron cannot find your entry file, check:
- The entry file (e.g., `electron/main.js`) is present **inside** `app.asar`, not just at the project root.
- The `"main"` field in `package.json` matches the actual file path and name, including case.
- No hardcoded references to `index.js` or `main.js` in code or config.
- Electron-builder logs for file copy and entry resolution.
- Do not use `extraResources` for entry files.
- Renaming/relocating entry files and cleaning up duplicate configs often resolves the issue.

## 5. Checklist Updates
- Always verify entry point location and config before building.
- Document all changes and troubleshooting steps for future reference.

---

**Summary:**
Electron DMG builds require:
- A single, explicit entry point (e.g., `electron/main.js`) referenced in the top-level `"main"` field of `package.json`.
- A minimal, canonical build config with only the needed files/folders.
- No duplicate or shadow entry files, and no use of `extraResources` for entry files.
- ES module compatibility if using `"type": "module"`.

Persistent entry errors are usually resolved by cleaning up config, ensuring the entry file is inside `app.asar`, and matching the `"main"` field exactly.

## 6. Entry File Must Be Included in Build Files
- The entry file (e.g., `electron/main.js`) must be included in the electron-builder `files` array in `package.json`.
- If not included, Electron will not find the entry point in the packaged app, resulting in persistent missing module errors.
- Always verify the entry file is present inside `app.asar` after packaging.

## 7. Build Command for DMG
To build the DMG installer, run:

```sh
npm run build:electron
```

---

# NPC Parser Critical Fixes

## 8. Name Extraction Bug - Root Cause of Format Issues
**Issue**: Parser was treating entire narrative stat block as the NPC's name, causing cascading validation and formatting problems.

**Root Cause**:
```javascript
// WRONG: Extracts entire first line including parenthetical data
const nameLine = trimmedLines[0] ?? 'Unnamed NPC';
```

**Problem Example**:
- Input: `Men-at-arms, mounted x10 (They are neutral good, human, 2ⁿᵈ level fighters...)`
- Parser treated ENTIRE line as "name"
- Result: Redundant output with both original text AND converted narrative

**Fix Applied** (Lines 433-437):
```javascript
// Extract only the name part before parenthetical data
const nameMatch = nameLine.match(/^([^(]+?)(\s*\([^)]+\).*)?$/);
if (nameMatch) {
  nameLine = nameMatch[1].trim();
}
```

**Impact**:
- Compliance improved from 5-83% to near 100%
- Eliminates redundant output
- Fixes name bolding validation warnings
- Allows proper C&C narrative format generation

## 9. Military Unit Roster Enhancements
- Added PA (Prime Attribute) abbreviation expansion
- Added EQ (Equipment) abbreviation parsing
- Implemented plural/singular grammar handling
- Added default neutral/neutral disposition for military units
- Enhanced race/class extraction for unit roster format

**Critical Lesson**: Always separate data extraction from presentation formatting to avoid treating processed data as raw input.