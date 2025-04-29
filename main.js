/*
* Hauptprozess
* Steuert Eletron
*/

const { app, BrowserWindow, ipcMain } = require("electron");
const electronApp = require("electron").app;
const electronBrowserWindow = require("electron").BrowserWindow;
var needle = require("needle");
const nodePath = require("path");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

let window;

//console.log('electronApp:', electronApp);


// Settings object
let settings = {
  renderer: {
    cameraname: "Totale Cam",
    gainmanualidx: "0",
    shuttermanualidx: "",
  },
};

function createWindow() {
  const window = new electronBrowserWindow({
    x: 0,
    y: 0,
    width: 1280,
    height: 900,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: nodePath.join(__dirname, "preload.js"),
    },
  });

  window
    .loadFile("./UI/index.html")
    //.then(() => { window.webContents.send('sendSettings', settings.renderer); })
    .then(() => {
      window.show();
    });

  return window;
}

electronApp.on("ready", () => {
  window = createWindow();
  window.webContents.openDevTools();
  //getCameraData();
  sendSettings(settings);
});

electronApp.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electronApp.quit();
  }
});

electronApp.on("activate", () => {
  if (electronBrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

//IPC Handler
ipcMain.handle("zoom-enhance", async (event, zoomLevel) => {
  console.log("Zoom anpassen auf:", zoomLevel);

  // Anfrage an Kamera senden
  try {
    const response = await fetch("http://172.23.98.93/cgi-bin/lums_ndisetzoom.cgi", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ zoompositionfromindex: zoomLevel.toString() }),
    });

    const data = await response.json();
    console.log("Antwort von Kamera:", data);
    return { success: true, message: "Zoom erfolgreich angepasst." };
  } catch (error) {
    console.error("Fehler beim Zoom:", error);
    return { success: false, message: "Fehler beim Zoom" };
  }
});

function getCameraData() {
  needle.get(
    "http://172.23.98.93/cgi-bin/lums_ndisetinfo.cgi",
    function (error, response) {
      if (!error && response.statusCode == 200) var ptzObject_temp = {};

      var dom = new JSDOM(response.body);
      var ptz_settings = response.body.split("<br>");

      ptz_settings = ptz_settings.filter(function (e) {
        return e.replace(/(\r\n|\n|\r)/gm, "");
      });

      ptz_settings.forEach(function (item, index) {
        ptz_settings[index] = ptz_settings[index].replace(/"/g, "");
        let temp = ptz_settings[index].split("=");
        let tempobj = {};
        let key = temp[0];
        let value = temp[1];
        tempobj[key] = value;
        Object.assign(ptzObject_temp, tempobj);
      });

      return ptzObject_temp;
    }
  );
}

function sendSettings(settings) {
  window.webContents.send("sendSettings", settings.renderer);
  console.log("send");
}


function enhanceZoom() {
  // IPC-HANDLER
  ipcMain.handle('zoom-enhance', async (event, level) => {
    console.log('Zoom-Level empfangen im main process:', level);

    console.log("Zoom wird verändert");
    fetch('http://172.23.98.93/cgi-bin/lums_ndisetzoom.cgi', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        zoompositionfromindex: "20" // oder andere Zoom-Stufe
      })
    })
        .then(response => response.json())
        .then(data => console.log('set zoom:', data))
        .catch(error => console.error('Error while setting zoom:', error));

    return { success: true, message: `Zoom gesetzt auf ${level}` };
  });
}






//Exports for renderer
module.exports = {

  getCameraData: function() {
    needle.get(
        "http://172.23.98.93/cgi-bin/lums_ndisetinfo.cgi",
        function (error, response) {
          if (!error && response.statusCode == 200) var ptzObject_temp = {};

          var dom = new JSDOM(response.body);
          var ptz_settings = response.body.split("<br>");

          ptz_settings = ptz_settings.filter(function (e) {
            return e.replace(/(\r\n|\n|\r)/gm, "");
          });

          ptz_settings.forEach(function (item, index) {
            ptz_settings[index] = ptz_settings[index].replace(/"/g, "");
            let temp = ptz_settings[index].split("=");
            let tempobj = {};
            let key = temp[0];
            let value = temp[1];
            tempobj[key] = value;
            Object.assign(ptzObject_temp, tempobj);
          });

          return ptzObject_temp;
        }
    );
  }
  ,
  enchanceZoom: function() {
    fetch('http://172.23.98.93/cgi-bin/lums_ndisetzoom.cgi', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        zoompositionfromindex: "3" // oder andere Zoom-Stufe
      })
    })
        .then(response => response.json())
        .then(data => console.log('set zoom:', data))
        .catch(error => console.error('Error while setting zoom:', error));

  }

}