/*
* Sichere Kommunikation zwischen main und renderer
* Bindet IPC-API in den renderer ein
*/

const { contextBridge, ipcRenderer } = require("electron");

//Bridge zu Main
contextBridge.exposeInMainWorld("electronAPI", {
    enhanceZoom: (zoomLevel) => ipcRenderer.invoke("zoom-enhance", zoomLevel),
    decreaseZoom: (zoomLevel) => ipcRenderer.invoke("zoom-decrease", zoomLevel),
    getCurrentZoom: (zoomLevel) => ipcRenderer.invoke("get-current-zoom"),
    moveCamera: (dir) => ipcRenderer.send('move-camera', dir)
    //resetZoom: (zoomLevel) => ipcRenderer.invoke("reset-zoom"),
});



