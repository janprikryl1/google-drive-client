import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import fs from 'fs';

let mainWindow: BrowserWindow | null = null;
let watcher: fs.FSWatcher | null = null;
let currentWatchPath: string = path.join(app.getPath('home'), 'google-drive-sync');
const changeDebounceMap = new Map<string, NodeJS.Timeout>();

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  switch (ext) {
    case '.pdf':
      return 'application/pdf';
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.gif':
      return 'image/gif';
    case '.svg':
      return 'image/svg+xml';
    case '.txt':
      return 'text/plain';
    case '.csv':
      return 'text/csv';
    case '.json':
      return 'application/json';
    case '.xlsx':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case '.docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case '.pptx':
      return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    default:
      return 'application/octet-stream';
  }
}

const internalModifications = new Set<string>();

function markInternalModification(filePath: string, durationMs = 3000) {
  internalModifications.add(filePath);
  setTimeout(() => {
    internalModifications.delete(filePath);
  }, durationMs);
}

function startWatchingFolder(folderPath: string): { success: boolean; folderPath: string } {
  try {
    if (watcher) {
      watcher.close();
      watcher = null;
    }

    currentWatchPath = folderPath;
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    watcher = fs.watch(folderPath, { recursive: true }, (_eventType, filename) => {
      if (!filename || filename.startsWith('.') || filename.endsWith('.tmp') || filename.includes('.DS_Store')) {
        return;
      }

      const fullPath = path.join(folderPath, filename);
      if (internalModifications.has(fullPath)) {
        return;
      }

      if (changeDebounceMap.has(fullPath)) {
        clearTimeout(changeDebounceMap.get(fullPath)!);
      }

      const timer = setTimeout(() => {
        changeDebounceMap.delete(fullPath);
        if (internalModifications.has(fullPath)) {
          return;
        }

        if (fs.existsSync(fullPath)) {
          try {
            const stat = fs.statSync(fullPath);
            if (stat.isFile()) {
              const buffer = fs.readFileSync(fullPath);
              const base64Data = buffer.toString('base64');

              if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('local-file-change', {
                  filename: path.basename(filename),
                  base64Data,
                  mimeType: getMimeType(filename),
                });
              }
            }
          } catch (err) {
            console.warn('Error reading watched file:', err);
          }
        } else {
          // File was removed locally in watched folder
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('local-file-delete', {
              filename: path.basename(filename),
            });
          }
        }
      }, 1000);

      changeDebounceMap.set(fullPath, timer);
    });

    return { success: true, folderPath };
  } catch (err) {
    console.error('Failed to start folder watcher:', err);
    return { success: false, folderPath };
  }
}

function stopWatchingFolder(): boolean {
  if (watcher) {
    watcher.close();
    watcher = null;
    return true;
  }
  return false;
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 750,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
    title: 'Google Drive Client',
  });

  if (isDev) {
    mainWindow.loadURL('http://127.0.0.1:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
    stopWatchingFolder();
  });

  // Automatically start watching default sync folder
  startWatchingFolder(currentWatchPath);
}

// IPC Handlers
ipcMain.handle('ping', () => 'pong from Electron main process');

ipcMain.handle('start-watcher', (_event, folderPath?: string) => {
  const target = folderPath || currentWatchPath;
  return startWatchingFolder(target);
});

ipcMain.handle('stop-watcher', () => {
  return stopWatchingFolder();
});

ipcMain.handle('get-watch-status', () => {
  return {
    isWatching: Boolean(watcher),
    folderPath: currentWatchPath,
  };
});

ipcMain.handle('select-watch-folder', async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory', 'createDirectory'],
    title: 'Vyberte lokální složku pro sledování změn',
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  const selected = result.filePaths[0];
  startWatchingFolder(selected);
  return selected;
});

ipcMain.handle('save-file-to-sync', (_event, { filename, arrayBuffer }: { filename: string; arrayBuffer: ArrayBuffer }) => {
  try {
    if (!fs.existsSync(currentWatchPath)) {
      fs.mkdirSync(currentWatchPath, { recursive: true });
    }
    const targetPath = path.join(currentWatchPath, filename);
    markInternalModification(targetPath, 3000);
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(targetPath, buffer);
    return { success: true, path: targetPath };
  } catch (err: any) {
    console.error('Failed to save file to sync folder:', err);
    return { success: false, path: '' };
  }
});

ipcMain.handle('delete-file-from-sync', (_event, filename: string) => {
  try {
    const targetPath = path.join(currentWatchPath, filename);
    markInternalModification(targetPath, 3000);
    if (fs.existsSync(targetPath)) {
      fs.unlinkSync(targetPath);
    }
    return { success: true };
  } catch (err: any) {
    console.error('Failed to delete file from sync folder:', err);
    return { success: false };
  }
});

ipcMain.handle('rename-file-in-sync', (_event, { oldFilename, newFilename }: { oldFilename: string; newFilename: string }) => {
  try {
    const oldPath = path.join(currentWatchPath, oldFilename);
    const newPath = path.join(currentWatchPath, newFilename);
    markInternalModification(oldPath, 3000);
    markInternalModification(newPath, 3000);
    if (fs.existsSync(oldPath)) {
      fs.renameSync(oldPath, newPath);
    }
    return { success: true };
  } catch (err: any) {
    console.error('Failed to rename file in sync folder:', err);
    return { success: false };
  }
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  stopWatchingFolder();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
