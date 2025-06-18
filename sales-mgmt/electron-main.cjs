const { app, BrowserWindow } = require("electron");
const path = require("path");

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      allowRunningInsecureContent: true,
    },
  });

  win.setMenuBarVisibility(false);
  win.removeMenu();

  // Debug: Open DevTools to see any loading errors
  win.webContents.openDevTools({ mode: "detach" });

  // Load from dist folder
  win.loadURL(`file://${path.join(__dirname, "dist/index.html")}`);
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
