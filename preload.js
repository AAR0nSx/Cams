/*
* Eine Art Adapter zwischen main.js und preload.js
* Sichere Kommunikation zwischen main und renderer
* Bindet IPC-API in den renderer ein, damit die API der Kamera über z.B. Buttons nutzbar gemacht werden kann
*/

const { contextBridge, ipcRenderer } = require("electron");

//Bridge zu Main
contextBridge.exposeInMainWorld("electronAPI", {

    enhanceZoom: (zoomLevel, ip) => ipcRenderer.invoke("zoom-enhance", zoomLevel, ip),
    decreaseZoom: (zoomLevel, ip) => ipcRenderer.invoke("zoom-decrease", zoomLevel, ip),

    moveCamera: (dir, ip) => ipcRenderer.send('move-camera', dir, ip),

    setExposure: (key, value, ip) => ipcRenderer.invoke("set-exposure", key, value, ip),

    setPicture: (key, value, ip) => ipcRenderer.invoke("set-picture", key, value, ip),

    setWhiteBalance: (key, value, ip) => ipcRenderer.invoke("set-white-balance", key, value, ip),

    setFocus: (key, value, ip) => ipcRenderer.invoke("set-focus", key, value, ip),

    setPreset: (presetNumber, ip) => ipcRenderer.invoke("set-preset", presetNumber, ip),
    getPreset: (presetNumber, ip) => ipcRenderer.invoke("get-preset", presetNumber, ip),

    getCameraData: (ip) => ipcRenderer.invoke("get-camera-data", ip),

    onUpdateCameraUIs: (callback) => ipcRenderer.on("update-camera-uis", () => callback()),

    //settingspage oeffnen
    openSettings: () => ipcRenderer.send("open-settings"),

    //Zugriff für settings
    getSettings: () => ipcRenderer.invoke("get-settings"),
    setSettings: (settings) => ipcRenderer.invoke("set-settings", settings),

    //sofortiges Updaten des Darkmode
    onDarkModeUpdate: (callback) => ipcRenderer.on("update-dark-mode", (event, value) => callback(value)),
});



