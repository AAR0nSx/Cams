/*
* Sichere Kommunikation zwischen main und renderer
* Bindet IPC-API in den renderer ein
*/

const { contextBridge, ipcRenderer } = require("electron");

//Bridge zu Main
contextBridge.exposeInMainWorld("electronAPI", {
    enhanceZoom: (zoomLevel) => ipcRenderer.invoke("zoom-enhance", zoomLevel),
    decreaseZoom: (zoomLevel) => ipcRenderer.invoke("zoom-decrease", zoomLevel),
    moveCamera: (dir) => ipcRenderer.send('move-camera', dir),
    setExposure: (key, value) => ipcRenderer.invoke("set-exposure", key, value),
    setPicture: (key, value) => ipcRenderer.invoke("set-picture", key, value),
    setWhiteBalance: (key, value) => ipcRenderer.invoke("set-white-balance", key, value),
    setFocus: (key, value) => ipcRenderer.invoke("set-focus", key, value),
    setPreset: (key, value) => ipcRenderer.invoke("set-preset", key, value),
    getPreset: (key, value) => ipcRenderer.invoke("get-preset", key, value),
    getCameraData: () => ipcRenderer.invoke("get-camera-data"),

    //settingspage oeffnen
    openSettings: () => ipcRenderer.send("open-settings"),


    //Zugriff für settings
    getSettings: () => ipcRenderer.invoke("get-settings"),
    setSettings: (settings) => ipcRenderer.invoke("set-settings", settings),

    //sofortiges Updaten des Darkmode
    onDarkModeUpdate: (callback) => ipcRenderer.on("update-dark-mode", (event, value) => callback(value)),


});



