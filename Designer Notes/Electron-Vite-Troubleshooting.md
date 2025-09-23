# Electron + Vite Troubleshooting Guide

## Common Blank Screen Causes

1. **Dev Server Port Mismatch**
   - Electron must load the exact Vite dev server URL (e.g., `http://127.0.0.1:5173`).
   - Check `vite.config.ts` for the port and host.
   - In `electron/main.js`, ensure `mainWindow.loadURL('http://127.0.0.1:5173')` (or use `process.env.ELECTRON_START_URL`).

2. **Pending JS Modules in DevTools**
   - If all JS modules show "pending" in DevTools Network tab, Electron is not loading the Vite dev server correctly.
   - Do not use `file://` or a local file path for development mode.
   - Always use the Vite dev server address in dev mode.

3. **No UI, No Console Errors**
   - If `<div id="root"></div>` is present but nothing renders, likely a module loading or port issue.
   - Open http://127.0.0.1:5173 in your browser. If the UI appears, the problem is Electron's URL.
   - If the UI does not appear in the browser, check Vite terminal output for errors.

4. **Autofill Warnings**
   - Warnings like `Autofill.enable failed` are harmless and can be ignored for UI troubleshooting.

## Step-by-Step Debug Checklist

- [ ] Start Vite with `yarn dev` and confirm the announced port (e.g., `Local: http://127.0.0.1:5173/`).
- [ ] In `electron/main.js`, confirm `mainWindow.loadURL` matches the Vite dev server URL.
- [ ] Launch Electron with `yarn electron`.
- [ ] If blank, open DevTools and check Console and Network tabs for errors or pending requests.
- [ ] Try opening the Vite dev server URL in your browser. If it works, Electron config is the issue.
- [ ] If all else fails, restart both Vite and Electron, and check for port conflicts or typos.

## Example Working Dev Setup

- `vite.config.ts`:
  ```js
  server: {
    host: '127.0.0.1',
    port: 5173,
  }
  ```
- `electron/main.js`:
  ```js
  mainWindow.loadURL('http://127.0.0.1:5173');
  ```

## Quick Fixes
- Always match the port and host between Vite and Electron.
- Never use `file://` for dev mode.
- Use DevTools Network tab to spot pending or failed requests.
- If you see only `<div id="root"></div>`, it's almost always a module loading or port mismatch.

---
_Last updated: 2025-09-20_
