# Debugging Options for Next.js and Node.js

## Automatic Debug Restart with nodemon

- Start Next.js with nodemon and inspect:
  ```bash
  nodemon --inspect app/node_modules/.bin/next dev
  ```
- VS Code launch config to attach and auto-restart:
  ```json
  {
    "name": "Attach to Next.js (nodemon)",
    "type": "node",
    "request": "attach",
    "restart": true,
    "port": 9229
  }
  ```
- To launch directly from VS Code:
  ```json
  {
    "name": "Launch Next.js via nodemon",
    "type": "node",
    "request": "launch",
    "runtimeExecutable": "nodemon",
    "program": "${workspaceFolder}/app/node_modules/.bin/next",
    "args": ["dev"],
    "console": "integratedTerminal",
    "internalConsoleOptions": "neverOpen"
  }
  ```

## Chrome Debugging
- Visit `chrome://inspect` and add port 9229.
- Click your app under Remote Target and inspect.

## Firefox Debugging
- Visit `about:debugging` > This Firefox > Remote Targets.
- Click Inspect for your app.

## Tips
- Pressing Stop in VS Code only disconnects debugger; nodemon keeps running.
- To stop nodemon, kill it in the terminal.
- For syntax errors, increase VS Code timeout with a `timeout` attribute in your launch config.
