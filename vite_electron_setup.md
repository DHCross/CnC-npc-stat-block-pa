# Easy Setup Guide: Vite + React + Electron

This guide walks you through turning your existing Vite + React + TypeScript project into a working desktop app with Electron. It’s written to be simple and direct, no fluff.

---

## 1. Prerequisites
- **Node.js 20+** (install via [nvm](https://github.com/nvm-sh/nvm) if needed)
- **npm** (comes with Node)
- **GitHub repo** (optional, for version control)

Check your versions:
```bash
node -v
npm -v
```

---

## 2. Current Project Commands
```bash
# Start Vite dev server
npm run dev

# Build production output
npm run build
npm run preview
```

Your dev server runs at:
http://localhost:5173

---

## 3. Install Electron
```bash
# Add Electron + build tools
npm install --save-dev electron electron-builder concurrently wait-on
```

---

## 4. Update `package.json`
Add scripts:
```json
"scripts": {
  "electron": "electron .",
  "electron-dev": "concurrently \"npm run dev\" \"wait-on http://localhost:5173 && electron .\"",
  "build-electron": "npm run build && electron-builder",
  "dist": "npm run build && electron-builder --publish=never"
},
"main": "electron/main.js"
```

---

## 5. Create Electron Files

### `electron/main.js`
```javascript
const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const isDev = !app.isPackaged;

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true
    },
    icon: path.join(__dirname, '../assets/icon.png')
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
```

### `electron/preload.js`
```javascript
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  sendMenuAction: (action) => ipcRenderer.send(action),
});
```

---

## 6. Update `vite.config.ts`
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') }
  },
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
});
```

---

## 7. Add Electron Builder Config
In `package.json`:
```json
"build": {
  "appId": "com.yourname.npcparser",
  "productName": "C&C NPC Parser",
  "directories": { "output": "release" },
  "files": ["dist/**/*", "electron/**/*"],
  "mac": { "target": "dmg" },
  "win": { "target": "nsis" },
  "linux": { "target": "AppImage" }
}
```

---

## 8. Run and Build

### Development
```bash
npm run electron-dev
```
(This runs Vite + Electron together.)

### Production Build
```bash
npm run dist
```
The installer will be in the `release/` folder.

---

## 9. File Structure
```
your-project/
├── electron/
│   ├── main.js
│   └── preload.js
├── src/
│   └── (React code)
├── dist/       (Vite build)
├── release/    (Installers)
├── vite.config.ts
└── package.json
```

---

## 10. Done!
You now have a working Electron desktop app powered by your Vite + React project.

