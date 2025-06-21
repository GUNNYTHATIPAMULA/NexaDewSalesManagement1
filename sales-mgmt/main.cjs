const { app, BrowserWindow, shell, protocol } = require('electron');
const path = require('path');
const { readFile } = require('fs');
const { URL } = require('url');

let mainWindow;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: false, // Temporarily disable for local files
      allowRunningInsecureContent: true
    },
    show: false,
    titleBarStyle: 'default'
  });

  // Load the built React app
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  console.log('Loading from:', indexPath);
  
  mainWindow.loadFile(indexPath).catch(err => {
    console.error('Failed to load file:', err);
  });

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open DevTools for debugging
  mainWindow.webContents.openDevTools();

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Log any console errors
  mainWindow.webContents.on('console-message', (event, level, message) => {
    console.log('Renderer console:', message);
  });
}

// Register file protocol before app is ready
app.whenReady().then(() => {
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
