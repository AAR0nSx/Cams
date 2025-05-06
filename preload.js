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
    getCameraData: () => ipcRenderer.invoke("get-camera-data")

    //getCurrentZoom: (zoomLevel) => ipcRenderer.invoke("get-current-zoom"),
    //resetZoom: (zoomLevel) => ipcRenderer.invoke("reset-zoom"),

});



