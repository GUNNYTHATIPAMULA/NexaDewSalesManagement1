// Optional: Preload script for secure communication between main and renderer
const { contextBridge, ipcRenderer } = require("electron")

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electronAPI", {
  // Example secure API
  getVersion: () => process.versions.electron,
  platform: process.platform,

  // Example IPC communication
  sendMessage: (message) => ipcRenderer.invoke("send-message", message),
  onMessage: (callback) => ipcRenderer.on("message", callback),
})
