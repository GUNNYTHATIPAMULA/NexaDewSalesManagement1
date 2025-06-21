const { contextBridge, ipcRenderer } = require("electron")

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electronAPI", {
  // Example secure API
  getVersion: () => process.versions.electron,
  platform: process.platform,

  // App specific APIs
  openExternal: (url) => ipcRenderer.invoke("open-external", url),

  // Example IPC communication
  sendMessage: (message) => ipcRenderer.invoke("send-message", message),
  onMessage: (callback) => ipcRenderer.on("message", callback),

  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
})
