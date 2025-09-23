The required steps to launch the Next.js Electron application involve running two separate commands simultaneously [Query]. To stop the process, particularly on **Mac OS**, command-line utilities are often used to address stuck processes or port conflicts (EADDRINUSE).

The table below provides the commands for starting the application and various methods for stopping the running Node/Electron processes specifically for Mac OS environments.

| Category | Command | Mac OS Context and Function | Source |
| :--- | :--- | :--- | :--- |
| **Start Next.js Dev Server** | `npm run dev:web` | Starts the Next.js development server, typically running on **Port 3000** [Query, 392, 410]. This must be run first [Query]. | [Query, 392, 410] |
| **Start Electron App** | `npm run electron-dev` | Launches the Electron application in a separate terminal and connects it to the running Next.js server [Query]. | [Query] |
| **Stop Graceful (Preferred)** | `Ctrl+C` or `Cmd+C` | Gracefully stops the server process running in the currently active terminal window. | |
| **Stop Graceful (VS Code UI)** | *(Click the trash can icon)* | Terminates the running process associated with the VS Code integrated terminal panel. | |
| **Stop Force (All Node Processes)** | `killall node` | Forcefully terminates (kills) all Node.js server instances currently running on the operating system. | |
| **Stop Force (By Port 3000)** | `kill -9 $(lsof -ti:3000)` | A robust, one-liner command for Mac OS/Linux that finds the Process ID (PID) occupying Port 3000 and force-terminates it using the `kill -9` signal. | |
| **Stop Force (Utility)** | `npx kill-port 3000 3001` | A convenient, cross-platform utility (requires Node.js/npm) to forcefully kill processes on one or more specified ports (e.g., 3000 and 3001). | |

***

### Context on Development Workflow

*   **Prerequisite:** Both the Next.js server and the Electron app processes **must be running** concurrently for the application to function correctly [Query].
*   **Next.js Architecture:** This setup requires the Next.js server to start first (`npm run dev:web`) because Electron acts as a local browser wrapper that connects to the content dynamically served by that development server [Query].
*   **Troubleshooting Port Conflicts:** When running Next.js applications, the most frequent error is **EADDRINUSE** (address already in use), which occurs because a previous server instance did not shut down completely and is still holding the port (e.g., 3000). Commands like `killall node` or `lsof` combined with `kill -9` are used to resolve these conflicts on macOS.