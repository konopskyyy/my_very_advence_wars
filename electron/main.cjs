'use strict';

const path = require('node:path');
const os = require('node:os');
const { app, BrowserWindow, Menu, ipcMain } = require('electron');

// WSL2 nie ma GPU (/dev/dri), więc Chromium blocklistuje WebGL i spamuje konsolę.
// Phaser i tak spada na Canvas, więc wyłączamy GPU tylko w WSL.
function isWsl() {
  if (process.platform !== 'linux') return false;
  if (process.env.WSL_DISTRO_NAME || process.env.WSL_INTEROP) return true;
  return /microsoft/i.test(os.release());
}

if (isWsl()) {
  app.commandLine.appendSwitch('disable-gpu');
  app.commandLine.appendSwitch('disable-gpu-compositing');
}

// Port zgodny z CLIENT_PORT w .env.
const DEV_URL = process.env.VITE_DEV_SERVER_URL || 'http://localhost:18573';
// Puste VITE_DEV_SERVER_URL (np. `make run`) oznacza statyczny build z dist,
// a nie dev-serwer — wtedy nie ma dokąd się łączyć.
const useDevServer = !!process.env.VITE_DEV_SERVER_URL;

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    backgroundColor: '#0b0b0b',
    title: 'My Very Advance Wars',
    fullscreen: true,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  if (useDevServer) {
    void win.loadURL(DEV_URL);
    if (!process.env.ELECTRON_NO_DEVTOOLS) {
      win.webContents.openDevTools({ mode: 'detach' });
    }
  } else {
    void win.loadFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'));
  }

  ipcMain.on('window:close', () => win.close());

  // Bez menu F11/Alt+Enter to jedyny sposób wyjścia z pełnego ekranu.
  win.webContents.on('before-input-event', (_event, input) => {
    if (input.type !== 'keyDown') return;
    const isF11 = input.key === 'F11';
    const isAltEnter = input.key === 'Enter' && input.alt;
    if (isF11 || isAltEnter) {
      win.setFullScreen(!win.isFullScreen());
    }
  });
  return win;
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
