
/*
* Hauptprozess
* Steuert Electron
*/

//172.23.98.93 -> TestIP

const { app, BrowserWindow, ipcMain, shell } = require("electron");
var needle = require("needle");
const nodePath = require("path");



//settings
const Store = require("electron-store").default;
const store = new Store();


let window;

//console.log('electronApp:', electronApp);

//Erstellt das main Window
function createWindow() {
  window = new BrowserWindow({
    x: 0,
    y: 0,
    width: 1920,
    height: 1080,
    show: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: nodePath.join(__dirname, "preload.js"),
    },
  });



  const path = require('path');
  const indexPath = path.join(__dirname, 'UI', 'index.html');

  window.loadFile(indexPath)
      .then(() => {
        window.show();
        window.focus();
      })

  return window;
}

app.on("ready", () => {
  window = createWindow();
  //window.webContents.openDevTools(); //nur für debugging benötigt
  //sendSettings(settings);
});



app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electronApp.quit(); //eigl müsste es app.quit() heißen, aber ich will es erstmal im ganzen testen bevor ich
                        //das ändere, falls Komplikationen auftreten
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

/* IPC HANDLER
* Die IPC Handler kümmern sich um den Aufruf des POST Befehls auf der Kamera
* Jede Funktion hat eine URL unter der man sie mittels eines http POST Befehls ansprechen kann um die entsprechende
* Funktion auszulösen.
*/

//neues fenster bei IP adressen klick für das Webinterface
ipcMain.on("open-browser-window", (event, url) => {
  console.log("MAIN: ÖFFNE IM BROWSER: ", url);
  shell.openExternal(url); // öffnet im Standardbrowser
});


//Settingspage oeffnen
ipcMain.on("open-settings", () => {
  const settingsWindow = new BrowserWindow({
    width: 720,
    height: 480,
    show: true,
    resizable: false,
    modal: true, //Child window das parent window disabled solange es offen ist
    parent: window, // das Hauptfenster ist der Parent
    webPreferences: {
      contextIsolation: true,
      preload: nodePath.join(__dirname, "./preload.js")
    }
  });

  settingsWindow.loadFile("./UI/settings.html");
});


//settingsHandler
ipcMain.handle("get-settings", async () => {
  return store.get("settings", { darkMode: false });
});

ipcMain.handle("set-settings", async (event, newSettings) => {
  store.set("settings", newSettings);
  console.log("SENDE UPDATE AN FENSTER:", newSettings.darkMode); // <-- wichtig

  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send("update-dark-mode", newSettings.darkMode);
    window.webContents.send("update-camera-uis");
  }
});



//Kameradaten zum renderer schicken
ipcMain.handle("get-camera-data", async (event, ip) => {
  const url = `http://${ip}/cgi-bin/lums_ndisetinfo.cgi`;
  console.log("Frage Kamera ab (Main):", ip);
  try {
    const response = await needle("get", url);
    if (response.statusCode === 200) {
      const ptzObject = {};
      response.body.split("<br>").forEach(line => {
        const [key, value] = line.split("=");
        if (key && value) ptzObject[key.replace(/"/g, "")] = value.replace(/"/g, "");
      });
      return ptzObject;
    } else {
      throw new Error(`Status ${response.statusCode}`);
    }
  } catch (err) {
    console.error("Fehler für Kamera", ip, err);
    return null;
  }
});


//setPreset
ipcMain.handle("set-preset", async (event, presetNumber, ip) => {
  //payload enthält die cgi Schnittpunkte, wie sie auch in der Kamera heißen
  const payload = {
    savepreset: presetNumber,
    loadpreset: ""
    //settings: settings // wird später nicht direkt verarbeitet, aber mitgeschickt
  };

  try {

    const response = await fetch(`http://${ip}/cgi-bin/lums_ndisetpreset.cgi`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    return { success: true, message: `Preset ${presetNumber} gespeichert`, data };
  } catch (error) {
    console.error("Fehler beim Speichern:", ip,  error);
    return { success: false, message: "Fehler beim Speichern", error };
  }
});

//getPreset
ipcMain.handle("get-preset", async (event, presetNumber, ip) => {
  //payload enthält die cgi Schnittpunkte, wie sie auch in der Kamera heißen
  const payload = {
    savepreset: "",
    loadpreset: presetNumber
  };

  try {
    const response = await fetch(`http://${ip}/cgi-bin/lums_ndisetpreset.cgi`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    return { success: true, message: `Preset ${presetNumber} geladen`, data};
  } catch (error) {
    console.error("Fehler beim Laden:", ip, error);
    return { success: false, message: "Fehler beim Laden", error };
  }
});



//setFocus
ipcMain.handle("set-focus", async(event, key, value, ip) => {
  //payload enthält die cgi Schnittpunkte, wie sie auch in der Kamera heißen
  const payload = {
    focusautoidx:"",
    focuspositon:"",
    afsensitivityidx:"",
    afframenameidx:""
  };

  payload[key] = value;

  console.log("Payload vor try Block:", payload);

  try {
    const response = await fetch(`http://${ip}/cgi-bin/lums_ndisetfocus.cgi`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload)
    });
    console.log("gesendete Fokus Payload an Kamera:", payload);

    const data = await response.json();
    console.log("Antwort der Kamera: ", data);
    console.log("Focus angepasst auf: ", data.focuspositon);

    return {success: true, message: "Fokus angepasst: ", data};

  }catch(error){
    console.error(error);
    console.log("Fehler beim setzen des Fokus. ", ip,  error);
  }

});



//setWB
ipcMain.handle("set-white-balance", async(event, key, value, ip) => {
  //payload enthält die cgi Schnittpunkte, wie sie auch in der Kamera heißen
  const payload = {
    wbmodeidx:"",
    crgain:"",
    cbgain:"",
    wbonepushtrigger:""
  };

  payload[key] = value;

  try {
    const response = await fetch(`http://${ip}/cgi-bin/lums_ndisetwb.cgi`, {
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
    console.log("Fehler beim setzen des Rot/Blau Werts. ", ip, error);
  }

});



//setPicture
ipcMain.handle("set-picture", async (event, key, value, ip) => {
  //payload enthält die cgi Schnittpunkte, wie sie auch in der Kamera heißen
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
    const response = await fetch(`http://${ip}/cgi-bin/lums_ndisetpicture.cgi`, {
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
    console.error("Fehler beim Setzen des Bildwerts:", ip, error);
    return { success: false, message: `Fehler bei ${key}` };
  }
});



//set Exposure
ipcMain.handle("set-exposure", async (event, key, value, ip) => {
  //payload enthält die cgi Schnittpunkte, wie sie auch in der Kamera heißen
  const payload = {"exposuremodeindex":"","exposurelevelname":"","gainmanualidx":"","irispriidx":"","shuttermanualidx":"","gammanameindex":""};
  //shuttermanualindex 0-21 für 1/1000 - 1/1
  const keyMap = {
    shutter: "shuttermanualidx",
    exposurecompensation: "exposurelevelname",
    gain: "gainmanualidx",
    gamma: "gammanameindex",
    exposuremode: "exposuremodeindex",
    iris : "irispriidx"
  };

  const mappedKey = keyMap[key] || key;
  payload[mappedKey] = value;

  console.log("Sende Einzelwert:", payload);

  try{
    const response = await fetch(`http://${ip}/cgi-bin/lums_ndisetexposure.cgi`, {
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
    console.error("Fehler beim Setzen:", ip, error);
    return { success: false, message: `Fehler bei ${key}` };
  }
})

//Zoom enhance fetch
ipcMain.handle("zoom-enhance", async (event, zoomLevel, ip) => {
  console.log("Zoom anpassen auf:", zoomLevel);

  // Anfrage an Kamera senden
  try {
    const response = await fetch(`http://${ip}/cgi-bin/lums_ndisetzoom.cgi`, {
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
    console.error("Fehler beim Zoom:", ip, error);
    return { success: false, message: "Fehler beim Zoom" };
  }
});

//Zoom decrease
ipcMain.handle("zoom-decrease", async (event, zoomLevel, ip) => {
  console.log("Zoom anpassen auf:", zoomLevel);

  // Anfrage an Kamera senden
  try {
    const response = await fetch(`http://${ip}/cgi-bin/lums_ndisetzoom.cgi`, {
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
    console.error("Fehler beim Zoom:", ip, error);
    return { success: false, message: "Fehler beim Zoom" };
  }
});


//move-camera behandelt alle Bewegungsbefehle

ipcMain.on('move-camera', (event, direction, ip) => {
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

        needle.post(`http://${ip}/cgi-bin/lums_ndipantilt.cgi`, postData, options, function (error, response) {
          if (!error && response.statusCode == 200) {
            console.log("Success:", response.body);
          } else {
            console.error("Request failed:", ip, error);
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

        needle.post(`http://${ip}/cgi-bin/lums_ndipantilt.cgi`, postData, options, function (error, response) {
          if (!error && response.statusCode == 200) {
            console.log("Success:", response.body);
          } else {
            console.error("Request failed:", ip, error);
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

        needle.post(`http://${ip}/cgi-bin/lums_ndipantilt.cgi`, postData, options, function (error, response) {
          if (!error && response.statusCode == 200) {
            console.log("Success:", response.body);
          } else {
            console.error("Request failed:", ip, error);
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

        needle.post(`http://${ip}/cgi-bin/lums_ndipantilt.cgi`, postData, options, function (error, response) {
          if (!error && response.statusCode == 200) {
            console.log("Success:", response.body);
          } else {
            console.error("Request failed:", ip, error);
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

        needle.post(`http://${ip}/cgi-bin/lums_ndipantilt.cgi`, postData, options, function (error, response) {
          if (!error && response.statusCode == 200) {
            console.log("Success:", response.body);
          } else {
            console.error("Request failed:", ip, error);
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

        needle.post(`http://${ip}/cgi-bin/lums_ndipantilt.cgi`, postData, options, function (error, response) {
          if (!error && response.statusCode == 200) {
            console.log("Success:", response.body);
          } else {
            console.error("Request failed:", ip, error);
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

        needle.post(`http://${ip}/cgi-bin/lums_ndipantilt.cgi`, postData, options, function (error, response) {
          if (!error && response.statusCode == 200) {
            console.log("Success:", response.body);
          } else {
            console.error("Request failed:", ip, error);
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

        needle.post(`http://${ip}/cgi-bin/lums_ndipantilt.cgi`, postData, options, function (error, response) {
          if (!error && response.statusCode == 200) {
            console.log("Success:", response.body);
          } else {
            console.error("Request failed:", ip, error);
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

        needle.post(`http://${ip}/cgi-bin/lums_ndipantilt.cgi`, postData, options, function (error, response) {
          if (!error && response.statusCode == 200) {
            console.log("Success:", response.body);
          } else {
            console.error("Request failed:", ip, error);
          }
        });
      }
      break;

    default:
      console.log("Fehler beim Erkennen des Bewegungsbefehls.")
      break;
  }

});
