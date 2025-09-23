# Electron DMG Build Troubleshooting Notes

## Persistent Error: Entry Point Not Found

**Error:**
```
Uncaught Exception:
Error: Cannot find module '/Users/dancross/Documents/GitHub/CnC-npc-stat-block-pa/dist/mac-arm64/app.app/Contents/Resources/app.asar/index.js'
Require stack:
- ...
```

## Checklist & Attempts
- [x] Set top-level `main` in package.json to `electron/main.js`
- [x] Set `build.main` in package.json to `electron/main.js`
- [x] Included `electron/main.js` and `electron/preload.js` in `files` array
- [x] Added `extraResources` to copy entry files to root
- [x] Verified no references to `index.js` in code or config

## Analysis
- Electron is still searching for `index.js` in the packaged app, ignoring the specified entry point.
- This may be due to:
  - Electron-builder not copying or setting the entry file correctly in `app.asar`
  - Directory structure or config mismatch
  - Electron defaulting to `index.js` if entry is not at root

## Next Steps
- Try setting `main` to `main.js` (root) and copy `electron/main.js` as `main.js` in build output
- Check for hardcoded references to `index.js` in Electron or builder config
- Consider using `asarUnpack` or disabling asar for debugging
- Review electron-builder logs for file copy and entry point resolution
- Test with a minimal Electron app to isolate config issues

## Resources
- [electron-builder docs: main entry](https://www.electron.build/configuration/configuration)
- [Electron docs: main entry](https://www.electronjs.org/docs/latest/tutorial/quick-start)
- [GitHub Issue: Entry point not found](https://github.com/electron-userland/electron-builder/issues/)

---

**If you continue to see this error, try renaming `electron/main.js` to `main.js` at the project root and update all config references.**
