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
//const { JSDOM } = jsdom;

let window;
let cameraIPAdress = "172.23.98.93";
//console.log('electronApp:', electronApp);

function createWindow() {
 const window = new electronBrowserWindow({
    x: 0,
    y: 0,
    width: 1820,
    height: 1440,
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
      window.focus();
    });

  return window;
}

electronApp.on("ready", () => {
  window = createWindow();
  window.webContents.openDevTools();
  //sendSettings(settings);
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


//zieht sich alle Kameradaten

function getCameraData() {
  return new Promise((resolve, reject) => {
    needle.get("http://172.23.98.93/cgi-bin/lums_ndisetinfo.cgi", (error, response) => {
      if (!error && response.statusCode === 200) {
        let ptzObject_temp = {};
        let ptz_settings = response.body.split("<br>").map(line => line.replace(/(\r\n|\n|\r)/gm, "").replace(/"/g, ""));

        ptz_settings.forEach(line => {
          const [key, value] = line.split("=");
          if (key && value) ptzObject_temp[key] = value;
        });

        resolve(ptzObject_temp);
      } else {
        reject(error || new Error("Fehler beim Abrufen der Kameradaten."));
      }
    });
  });
}

//IPC Handler

//Kameradaten zum renderer schicken
ipcMain.handle("get-camera-data", async() => {
  console.log("Sending camera data to renderer...");
  try{
    const data = await getCameraData();
    return data;
  }catch(error){
    console.error(error);
    console.log("Fehler beim Senden der Kameradaten. ", error);
    return null;
  }
});


//setFocus
ipcMain.handle("set-focus", async(event, key, value) => {
  const payload = {
    focusautoidx:"",
    focuspositon:"",
    afsensitivityidx:"",
    afframenameidx:""
  };

  payload[key] = value;

  try {
    const response = await fetch("http://172.23.98.93/cgi-bin/lums_ndisetfocus.cgi", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    console.log("Antwort der Kamera: ", data);
    return {success: true, message: "Fokus angepasst: ", data};

  }catch(error){
    console.error(error);
    console.log("Fehler beim setzen des Fokus. ", error);
  }

});



//setWB
ipcMain.handle("set-white-balance", async(event, key, value) => {
    const payload = {
      wbmodeidx:"",
      crgain:"",
      cbgain:"",
      wbonepushtrigger:""
    };

    payload[key] = value;

    try {
      const response = await fetch("http://172.23.98.93/cgi-bin/lums_ndisetwb.cgi", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      console.log("Antwort der Kamera: ", data);
      return {success: true, message: "Red/Blue angepasst: ", data};

    }catch(error){
      console.error(error);
      console.log("Fehler beim setzen des Rot/Blau Werts. ", error);
    }

});



//setPicture
ipcMain.handle("set-picture", async (event, key, value) => {
  const payload = {
    brightness: "",
    saturation: "",
    sharpness: "",
    img2dnrnameindex: "",
    img3dnrnameindex: "",
    mirrornameidx: ""
  };

  payload[key] = value;

  console.log("Sende Bildwert:", payload);

  try {
    const response = await fetch("http://172.23.98.93/cgi-bin/lums_ndisetpicture.cgi", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log("Antwort von Kamera (Picture):", data);
    return { success: true, message: `${key} gesetzt auf ${value}` };
  } catch (error) {
    console.error("Fehler beim Setzen des Bildwerts:", error);
    return { success: false, message: `Fehler bei ${key}` };
  }
});



//set Exposure
ipcMain.handle("set-exposure", async (event, key, value) => {
  const payload = {"exposuremodeindex":"","exposurelevelname":"","gainmanualidx":"","irispriidx":"","shuttermanualidx":"","gammanameindex":""};
  //shuttermanualindex 0-21 für 1/1000 - 1/1
  const keyMap = {
    shutter: "shuttermanualidx",
    gain: "gainmanualidx",
    gamma: "gammanameindex",
    exposuremode: "exposuremodeindex"
  };

  const mappedKey = keyMap[key] || key;
  payload[mappedKey] = value;

  console.log("Sende Einzelwert:", payload);

  try{
    const response = await fetch("http://172.23.98.93/cgi-bin/lums_ndisetexposure.cgi", {
    method: "POST",
      headers: {
      "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    console.log("Antwort von Kamera: ", data);
    return {success: true, message: `${key} gesetzt auf ${value}` };
  }catch(error){
    console.error("Fehler beim Setzen:", error);
    return { success: false, message: `Fehler bei ${key}` };
  }
})

//Zoom enhance fetch
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
    console.log("Sende Zoom Update an Renderer: ", zoomLevel);
    return { success: true, message: "Zoom erfolgreich angepasst auf " + zoomLevel.toString() };
  } catch (error) {
    console.error("Fehler beim Zoom:", error);
    return { success: false, message: "Fehler beim Zoom" };
  }
});

//Zoom decrease
ipcMain.handle("zoom-decrease", async (event, zoomLevel) => {
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
    console.log("Sende Zoom Update an Renderer: ", zoomLevel);
    return { success: true, message: "Zoom erfolgreich angepasst auf " + zoomLevel.toString() };
  } catch (error) {
    console.error("Fehler beim Zoom:", error);
    return { success: false, message: "Fehler beim Zoom" };
  }
});


//move-camera behandelt alle Bewegungsbefehle

ipcMain.on('move-camera', (event, direction) => {
  console.log("Nachricht empfangen im main Prozess.");


  switch (direction) {
    case "left":
      if (direction === 'left') {
        const postData = JSON.stringify({
          cmd: "PT_MOTOR_LEFT"
        });

        const options = {
          headers: {
            "Content-Type": "application/json"
          }
        };

        needle.post('http://172.23.98.93/cgi-bin/lums_ndipantilt.cgi', postData, options, function (error, response) {
          if (!error && response.statusCode == 200) {
            console.log("Success:", response.body);
          } else {
            console.error("Request failed:", error);
          }
        });
      }
      break;

    case "right":
      if (direction === 'right') {
        const postData = JSON.stringify({
          cmd: "PT_MOTOR_RIGHT"
        });

        const options = {
          headers: {
            "Content-Type": "application/json"
          }
        };

        needle.post('http://172.23.98.93/cgi-bin/lums_ndipantilt.cgi', postData, options, function (error, response) {
          if (!error && response.statusCode == 200) {
            console.log("Success:", response.body);
          } else {
            console.error("Request failed:", error);
          }
        });
      }
      break;

    case "up":
      if (direction === 'up') {
        const postData = JSON.stringify({
          cmd: "PT_MOTOR_UP"
        });

        const options = {
          headers: {
            "Content-Type": "application/json"
          }
        };

        needle.post('http://172.23.98.93/cgi-bin/lums_ndipantilt.cgi', postData, options, function (error, response) {
          if (!error && response.statusCode == 200) {
            console.log("Success:", response.body);
          } else {
            console.error("Request failed:", error);
          }
        });
      }
      break;

    case "down":
      if (direction === 'down') {
        const postData = JSON.stringify({
          cmd: "PT_MOTOR_DOWN"
        });

        const options = {
          headers: {
            "Content-Type": "application/json"
          }
        };

        needle.post('http://172.23.98.93/cgi-bin/lums_ndipantilt.cgi', postData, options, function (error, response) {
          if (!error && response.statusCode == 200) {
            console.log("Success:", response.body);
          } else {
            console.error("Request failed:", error);
          }
        });
      }
      break;

    case "up_left":
      if (direction === 'up_left') {
        const postData = JSON.stringify({
          cmd: "PT_UP_LEFT"
        });

        const options = {
          headers: {
            "Content-Type": "application/json"
          }
        };

        needle.post('http://172.23.98.93/cgi-bin/lums_ndipantilt.cgi', postData, options, function (error, response) {
          if (!error && response.statusCode == 200) {
            console.log("Success:", response.body);
          } else {
            console.error("Request failed:", error);
          }
        });
      }
      break;

    case "up_right":
      if (direction === 'up_right') {
        const postData = JSON.stringify({
          cmd: "PT_UP_RIGHT"
        });

        const options = {
          headers: {
            "Content-Type": "application/json"
          }
        };

        needle.post('http://172.23.98.93/cgi-bin/lums_ndipantilt.cgi', postData, options, function (error, response) {
          if (!error && response.statusCode == 200) {
            console.log("Success:", response.body);
          } else {
            console.error("Request failed:", error);
          }
        });
      }
      break;

    case "down_left":
      if (direction === 'down_left') {
        const postData = JSON.stringify({
          cmd: "PT_DOWN_LEFT"
        });

        const options = {
          headers: {
            "Content-Type": "application/json",
          }
        };

        needle.post('http://172.23.98.93/cgi-bin/lums_ndipantilt.cgi', postData, options, function (error, response) {
          if (!error && response.statusCode == 200) {
            console.log("Success:", response.body);
          } else {
            console.error("Request failed:", error);
          }
        });
      }
      break;

    case "down_right":
      if (direction === 'down_right') {
        const postData = JSON.stringify({
          cmd: "PT_DOWN_RIGHT"
        });

        const options = {
          headers: {
            "Content-Type": "application/json"
          }
        };

        needle.post('http://172.23.98.93/cgi-bin/lums_ndipantilt.cgi', postData, options, function (error, response) {
          if (!error && response.statusCode == 200) {
            console.log("Success:", response.body);
          } else {
            console.error("Request failed:", error);
          }
        });
      }
      break;

    case "stop":
      if (direction === 'stop') {
        const postData = JSON.stringify({
          cmd: "PT_MOTOR_STOP"
        });

        const options = {
          headers: {
            "Content-Type": "application/json"
          }
        };

        needle.post('http://172.23.98.93/cgi-bin/lums_ndipantilt.cgi', postData, options, function (error, response) {
          if (!error && response.statusCode == 200) {
            console.log("Success:", response.body);
          } else {
            console.error("Request failed:", error);
          }
        });
      }
      break;

    default:
      console.log("Fehler beim Erkennen des Bewegungsbefehls.")
      break;
  }

});
