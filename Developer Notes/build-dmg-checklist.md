# Pre-Build Checklist for Electron DMG Packaging

Before running `npm run build:electron` to create your macOS DMG installer, ensure the following:

## 1. Project Structure & Entry Points
- [ ] Electron entry file is set correctly in `package.json` (e.g., `"main": "electron/main.js"`).
- [ ] All required files (main.js, preload.js, assets, etc.) are present in the `electron/` directory.
- [ ] Your React/Next.js app is built (run `npm run build:web` if needed).

## 2. Package.json Configuration
- [ ] `electron-builder` is installed as a devDependency.
- [ ] `build` section in `package.json` includes:
  - `appId` (unique, e.g., `com.cnc.npcstatblockpa`)
  - `mac.target` set to `dmg`
  - `main` set to your Electron entry file (e.g., `electron/main.js`)
  - `files` array includes all necessary folders/files (app, electron, src, index.html, package.json)
  - Top-level `main` points to your Electron entry file

## 3. Code Compatibility
- [ ] All Electron code uses ES module imports if `type: "module"` is set in `package.json`.
- [ ] No usage of `require()` in ES modules (use `import ... from ...` instead).
- [ ] No hardcoded paths that will break in packaged builds (use `__dirname`, `path.join`, etc.).

## 4. Assets & Icons
- [ ] App icon is present (e.g., `assets/icon.png`) and referenced in `main.js`.
- [ ] Any build resources (custom icons, backgrounds) are in the `build/` directory if referenced in config.

## 5. Testing & Validation
- [ ] App runs correctly in development (`npm run electron-dev`).
- [ ] App runs correctly in production mode (`npm run electron`).
- [ ] No missing files or runtime errors in packaged builds.

## 6. Build & Output
- [ ] Run `npm run build:electron`.
- [ ] Check for `.dmg` file in the `dist/` directory.
- [ ] Test the DMG installer on a clean macOS system.

---

**Tip:** If you encounter errors, check the build logs for missing files, entry point issues, or ES module/require conflicts.
