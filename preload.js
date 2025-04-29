/*
* Sichere Kommunikation zwischen main und renderer
* Bindet IPC-API in den renderer ein
*/

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
    enhanceZoom: (zoomLevel) => ipcRenderer.invoke("zoom-enhance", zoomLevel)
});

