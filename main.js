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
let cameraIPAdress = "172.23.98.93";
//console.log('electronApp:', electronApp);


// Settings object
//Die Daten aus getCameraData irgendwie extrahieren und in einzelnen Variablen speichern oder
//jeweils eine Funktion für jede Funktionalität und benötigte Attribute?
// --> Zoom usw. on Electron Load abfragen und einsetzen
//let settings = getCameraData()


/*
let settings = {
  renderer: {
    cameraname: "Totale Cam",
    gainmanualidx: "0",
    shuttermanualidx: "",
  },
};
*/


function createWindow() {
 const window = new electronBrowserWindow({
    //let window statt const. damit es global auch in ipcMain genutzt werden kann (Hauptsächlich für die Status Updates)
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


/*
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

        console.log("Das ausgegebene Objekt: \n", ptzObject_temp);
        return ptzObject_temp;
      }
  );
}

*/



//IPC Handler

//getCameraData -> führt getCameraData aus wenn das DOM geladen ist
//ipcMain.handle("get-camera-data", getCameraData);
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
      body: JSON.stringify(payload),
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
        //"username": "admin",
        //"password": "admin"
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
            "Content-Type": "application/json",
            "username": "admin",
            "password": "admin"
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
            "Content-Type": "application/json",
            "username": "admin",
            "password": "admin"
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
            "Content-Type": "application/json",
            "username": "admin",
            "password": "admin"
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
            "Content-Type": "application/json",
            "username": "admin",
            "password": "admin"
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
            "Content-Type": "application/json",
            "username": "admin",
            "password": "admin"
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
            "Content-Type": "application/json",
            "username": "admin",
            "password": "admin"
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
            "username": "admin",
            "password": "admin"
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
            "Content-Type": "application/json",
            "username": "admin",
            "password": "admin"
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
            "Content-Type": "application/json",
            "username": "admin",
            "password": "admin"
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

/*
function sendSettings(settings) {
  window.webContents.send("sendSettings", settings.renderer);
  console.log("send");
}
*/