# hyprsqrl

hyprsqrl is an app to eventually automate all mundane tasks away. It connects to your favorite apps including your screen and uses ai agents to automate tasks away.

<img width="1312" alt="Screenshot 2024-12-17 at 11 28 10" src="https://github.com/user-attachments/assets/b4b63992-62da-4553-b240-fcd8d0d2e54a" />

## Philosophy

hyprsqrl is built on the notion of **eventually invisible software** it is meant to be less and less present in your life if it does its job well. It will take a while to get there but we believe the best productivity app is the one you do not need spend time on.

## Agents
-  [x] Automatically create tasks in Obsidian based on screen activity
-  [x] Automatically create calendar events based on screen activity
-  [ ] Automatically create invoices via Request Network (in progress)

## Connects to data from

Every agent can be triggered based on data from the apps below

- [x] Obsidian
- [x] [Screenpipe]([https://githb](https://screenpi.pe/)) for your screen <- working on this.
- [ ] Your emails
- [ ] Github
- [ ] Linear
- [ ] Telegram
- [ ] Slack


## Features

- 📊 AI Task Insights - Get an overview of your most important tasks.
- 🤖 Automation AI agents (in progress) - Automate away recurring mundane tasks
- 🔗 Direct Obsidian integration - Works on top of your existing system


## Installing binaries

[Pick the latest release and follow the instructions](https://github.com/different-ai/hypr-v0/tags)



## Usage Instructions (fastest)

_Only works with pnpm, and instructions are for macos_

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
 
```

### Development System Requirements

- macOS (Apple Silicon or Intel)
- Node.js 18+
- pnpm


### Key Features

**Task Dashboard**
- Visual overview of all tasks
- Filtering by status, tags, and dates
- Sorting options
- Direct links to Obsidian


### Architecture

The application follows a modular architecture:

```
packages/
  desktop/           # Main Electron application
    src/
      renderer/     # Frontend React components
      electron/     # Main process code
    electron/       # Electron configuration
```

