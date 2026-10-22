'use strict';

const path = require('node:path');
const { app, BrowserWindow, Menu } = require('electron');

// Port zgodny z CLIENT_PORT w .env.
const DEV_URL = process.env.VITE_DEV_SERVER_URL || 'http://localhost:18573';
const isDev = !!process.env.VITE_DEV_SERVER_URL || !app.isPackaged;

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

  if (isDev) {
    void win.loadURL(DEV_URL);

    // DevTools na życzenie: ELECTRON_DEVTOOLS=1 make electron
    if (process.env.ELECTRON_DEVTOOLS === '1') {
      win.webContents.openDevTools({ mode: 'detach' });
    }
  } else {
    void win.loadFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'));
  }

  return win;
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  const win = createWindow();

  // Bez menu F11/Alt+Enter to jedyny sposób wyjścia z pełnego ekranu.
  win.webContents.on('before-input-event', (_event, input) => {
    if (input.type !== 'keyDown') return;
    const isF11 = input.key === 'F11';
    const isAltEnter = input.key === 'Enter' && input.alt;
    if (isF11 || isAltEnter) {
      win.setFullScreen(!win.isFullScreen());
    }
  });

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
