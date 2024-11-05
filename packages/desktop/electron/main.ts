import { app, BrowserWindow, shell, ipcMain, dialog } from 'electron';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import os from 'node:os';
import isDev from 'electron-is-dev';
import { promises as fs, Stats } from 'fs';
import matter from 'gray-matter';
import type { FSWatcher } from 'chokidar';
import * as chokidar from 'chokidar';

// Setup __dirname equivalent for ES modules
const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Path configurations
process.env.APP_ROOT = path.join(__dirname, '../..');
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron');
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist');
export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST;

// Windows-specific configurations
if (os.release().startsWith('6.1')) app.disableHardwareAcceleration();
if (process.platform === 'win32') app.setAppUserModelId(app.getName());

// Single instance lock
if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

// Window management
let win: BrowserWindow | null = null;
const preload = path.join(__dirname, './preload.js');

// Replace electron-store with custom store implementation
class VaultStore {
  private storePath: string;
  private cache: Record<string, any> = {};

  constructor() {
    // Store in user data directory
    const userDataPath = app.getPath('userData');
    this.storePath = path.join(userDataPath, 'vault-config.json');
    this.loadStore();
  }

  private async loadStore() {
    try {
      const data = await fs.readFile(this.storePath, 'utf8');
      this.cache = JSON.parse(data);
    } catch (error) {
      // If file doesn't exist or is invalid, start with empty cache
      this.cache = {};
    }
  }

  private async saveStore() {
    try {
      await fs.writeFile(this.storePath, JSON.stringify(this.cache, null, 2));
    } catch (error) {
      console.error('Failed to save store:', error);
    }
  }

  get(key: string) {
    return this.cache[key];
  }

  async set(key: string, value: any) {
    this.cache[key] = value;
    await this.saveStore();
  }
}

const store = new VaultStore();

async function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(process.env.VITE_PUBLIC!, 'favicon.ico'),
    webPreferences: {
      preload,
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'));
  }

  // Test actively push message to the Electron-Renderer
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString());
  });

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url);
    return { action: 'deny' };
  });
}

// App lifecycle events
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  win = null;
  if (process.platform !== 'darwin') app.quit();
});

app.on('second-instance', () => {
  if (win) {
    if (win.isMinimized()) win.restore();
    win.focus();
  }
});

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows();
  if (allWindows.length) {
    allWindows[0].focus();
  } else {
    createWindow();
  }
});

// Keep your existing IPC handlers but add this new one:
ipcMain.handle('open-win', (_, arg) => {
  const childWindow = new BrowserWindow({
    webPreferences: {
      preload,
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (VITE_DEV_SERVER_URL) {
    childWindow.loadURL(`${VITE_DEV_SERVER_URL}#${arg}`);
  } else {
    childWindow.loadFile(path.join(RENDERER_DIST, 'index.html'), { hash: arg });
  }
});

// Handle IPC events
ipcMain.handle('vault:get-config', async () => {
  return store.get('vaultConfig');
});

ipcMain.handle('vault:save-config', async (_, config) => {
  await store.set('vaultConfig', config);
  return true;
});
// Add this with your other IPC handlers
ipcMain.handle('file:get-stats', async (_, filePath: string) => {
  try {
    const stats = await fs.stat(filePath);
    return {
      birthtime: stats.birthtime.toISOString(),
      mtime: stats.mtime.toISOString(),
      atime: stats.atime.toISOString(),
    };
  } catch (error) {
    console.error('Failed to get file stats:', error);
    throw error;
  }
});

// Keep track of watchers
const watchers = new Map<string, chokidar.FSWatcher>();

// Update the file watching handlers
ipcMain.handle('file:watch', async (event, folderPath: string) => {
  debug('Setting up watcher for folder:', folderPath);

  // Clean up existing watcher if any
  if (watchers.has(folderPath)) {
    const existingWatcher = watchers.get(folderPath);
    if (existingWatcher) {
      await existingWatcher.close();
      watchers.delete(folderPath);
    }
  }

  const watcher = chokidar.watch(folderPath, {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true,
    ignoreInitial: true,
  });

  // Send file change events back to renderer
  watcher
    .on('add', path => event.sender.send('file:changed', { type: 'add', path }))
    .on('change', path => event.sender.send('file:changed', { type: 'change', path }))
    .on('unlink', path => event.sender.send('file:changed', { type: 'unlink', path }));

  watchers.set(folderPath, watcher);
  return true;
});

ipcMain.handle('file:unwatch', async (_, folderPath: string) => {
  debug('Removing watcher for folder:', folderPath);
  const watcher = watchers.get(folderPath);
  if (watcher) {
    await watcher.close();
    watchers.delete(folderPath);
  }
  return true;
});

// Clean up watchers when app quits
app.on('before-quit', () => {
  watchers.forEach(watcher => watcher.close());
  watchers.clear();
});

ipcMain.handle('folder:list-contents', async (_, folderPath) => {
  const files = await fs.readdir(folderPath, { withFileTypes: true });
  return files.map((file) => ({
    name: file.name,
    isDirectory: file.isDirectory(),
    path: path.join(folderPath, file.name),
  }));
});

ipcMain.handle('vault:select-directory', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
  });

  if (result.canceled) {
    return { success: false };
  }

  const vaultPath = result.filePaths[0];

  // Check if it's an Obsidian vault by looking for .obsidian folder
  const isObsidian = await fs
    .access(path.join(vaultPath, '.obsidian'))
    .then(() => true)
    .catch(() => false);

  return {
    success: true,
    path: vaultPath,
    isObsidian,
  };
});

ipcMain.handle('vault:create-new', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
  });

  if (result.canceled) {
    return { success: false };
  }

  const vaultPath = result.filePaths[0];

  // Create necessary directories
  await fs.mkdir(path.join(vaultPath, '.hyprsqrl'), { recursive: true });
  await fs.mkdir(path.join(vaultPath, 'Daily'), { recursive: true });
  await fs.mkdir(path.join(vaultPath, 'Tasks'), { recursive: true });
  await fs.mkdir(path.join(vaultPath, 'Notes'), { recursive: true });

  // Create initial README
  const readmePath = path.join(vaultPath, 'README.md');
  const readmeContent = `---
created: ${new Date().toISOString()}
type: root
---

# Welcome to Your HyprSqrl Vault

This vault is compatible with Obsidian and organized for optimal productivity.

## Folders

- Daily: For your daily notes
- Tasks: For task management
- Notes: For general notes and documentation
`;

  await fs.writeFile(readmePath, readmeContent);

  return {
    success: true,
    path: vaultPath,
    isObsidian: false,
  };
});

// File operations
ipcMain.handle('file:read-markdown', async (_, filePath) => {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const stats = await fs.stat(filePath);
    const { data: frontMatter, content: markdownContent } = matter(content);
    
    return { 
      content: markdownContent, 
      frontMatter,
      stats: {
        created: stats.birthtime.toISOString(),
        modified: stats.mtime.toISOString(),
        accessed: stats.atime.toISOString(),
      }
    };
  } catch (error) {
    console.error('Error reading markdown file:', error);
    throw error;
  }
});

ipcMain.handle('file:write-markdown', async (_, filePath, content) => {
  await fs.writeFile(filePath, content);
  return true;
});

// Add this debug logging function
const debug = (...args: any[]) => {
  if (isDev) {
    console.log('[Main Process]', ...args);
  }
};

ipcMain.handle('file:list', async (_, directory) => {
  debug('Listing files for directory:', directory);

  if (!directory || typeof directory !== 'string') {
    debug('Invalid directory argument:', directory);
    throw new Error(
      `Directory path is required and must be a string. Received: ${typeof directory}`
    );
  }

  try {
    const files = await fs.readdir(directory, { withFileTypes: true });
    const fileList = files.map((file) => ({
      name: file.name,
      isDirectory: file.isDirectory(),
      path: path.join(directory, file.name),
    }));
    debug('Found files:', fileList.length);
    return fileList;
  } catch (error) {
    debug('Error listing files:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to list files: ${error.message}`);
    }
    throw error;
  }
});

// Add this with your other IPC handlers
ipcMain.handle('file:reveal-in-system', async (_event, path: string) => {
  if (!path) {
    throw new Error('Path is required to reveal in file system');
  }

  try {
    // Show the given file in a file manager. If possible, select the file.
    await shell.showItemInFolder(path);
  } catch (error) {
    console.error('Failed to reveal item in file system:', error);
    throw error;
  }
});

// Add this near your other IPC handlers:
ipcMain.handle('folder:watch', async (event, folderPath: string) => {
  debug('Setting up watcher for folder:', folderPath);

  // Clean up existing watcher if any
  if (watchers.has(folderPath)) {
    watchers.get(folderPath)?.close();
    watchers.delete(folderPath);
  }

  const watcher = chokidar.watch(folderPath, {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true,
    ignoreInitial: true,
  });

  watcher.on('all', async (eventName, path) => {
    debug(`File event: ${eventName} on ${path}`);
    // Send the entire folder contents instead of just the changed path
    const files = await fs.readdir(folderPath, { withFileTypes: true });
    const fileList = files.map((file) => ({
      name: file.name,
      isDirectory: file.isDirectory(),
      // path: path.join(folderPath, file.name)
    }));
    event.sender.send('folder:changed', fileList);
  });

  watchers.set(folderPath, watcher);
  return true;
});

ipcMain.handle('folder:unwatch', async (_, folderPath: string) => {
  debug('Removing watcher for folder:', folderPath);
  const watcher = watchers.get(folderPath);
  if (watcher) {
    await watcher.close();
    watchers.delete(folderPath);
  }
  return true;
});

// Add this when the app is quitting to clean up watchers
app.on('before-quit', () => {
  watchers.forEach((watcher) => watcher.close());
  watchers.clear();
});

// Add this with your other IPC handlers
ipcMain.handle('file:list-markdown', async (_, directory) => {
  debug('Listing markdown files for directory:', directory);

  if (!directory || typeof directory !== 'string') {
    debug('Invalid directory argument:', directory);
    throw new Error(
      `Directory path is required and must be a string. Received: ${typeof directory}`
    );
  }

  try {
    const files = await fs.readdir(directory, { withFileTypes: true });
    const fileList = files
      .filter(
        (file) =>
          // Include directories and .md files
          file.isDirectory() || file.name.toLowerCase().endsWith('.md')
      )
      .map((file) => ({
        name: file.name,
        isDirectory: file.isDirectory(),
        path: path.join(directory, file.name),
      }));

    debug('Found markdown files:', fileList.length);
    return fileList;
  } catch (error) {
    debug('Error listing markdown files:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to list markdown files: ${error.message}`);
    }
    throw error;
  }
});

// Add this with your other IPC handlers
ipcMain.handle('shell:open-external', async (_, url: string) => {
  if (!url) {
    throw new Error('URL is required to open external link');
  }

  try {
    await shell.openExternal(url);
    return true;
  } catch (error) {
    console.error('Failed to open external URL:', error);
    throw error;
  }
});