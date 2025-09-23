
# How to Launch the Next.js Electron App

This guide explains how to launch the Next.js Electron application, enable auto-reload for development, and troubleshoot common issues.

## 1. Install Dependencies

Run the following command in your project root:

```sh
npm install
```

## 2. Launch the Next.js Dev Server

Start the Next.js frontend (web) server:

```sh
npm run dev:web
```

## 3. Launch the Electron App

In a separate terminal, start the Electron app:

```sh
npm run electron-dev
```

This will open the Electron desktop window and connect to the Next.js server.

## 4. Enable Auto-Reload for Electron

For instant feedback during development, the Electron main and preload processes will auto-restart when you change their source files. The renderer (Next.js) hot-reloads automatically.

If you want to customize auto-reload, see `electron/main.js` for the watcher logic (using `chokidar` or `electronmon`).

## 5. Troubleshooting

- **Blank window or connection error:** Make sure the Next.js dev server is running before launching Electron.
- **Changes to Electron main/preload not reflected:** Save the file and Electron will auto-restart. If it doesn't, restart `npm run electron-dev`.
- **Renderer changes not hot-reloading:** Confirm you are editing files in the Next.js `src/app` or `src/components` folders.
- **Port conflicts:** By default, Next.js runs on port 3000. If you change this, update the Electron `main.js` URL accordingly.

## 6. Advanced: Customizing Electron/Next.js Integration

- You can modify the Electron preload script to expose custom APIs to the renderer.
- For production builds, use `npm run build:web` and package with Electron Forge or similar tools.

## References

- [Electron Documentation](https://www.electronjs.org/docs)
- [Next.js Documentation](https://nextjs.org/docs)

---

For more details, see `Developer Notes/Electron-Vite-Troubleshooting.md`.