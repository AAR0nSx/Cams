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
      window.focus();
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


//set Exposure
ipcMain.handle("set-exposure", async (event, key, value) => {
  const payload = {};
  payload[key] = value;

  console.log("Sende Einzelwert:", payload);

  try {
    const response = await needle("post", "http://172.23.98.93/cgi-bin/lums_ndisetexposure.cgi", JSON.stringify(payload), {
      headers: {
        "Content-Type": "application/json",
        "username": "admin",
        "password": "admin"
      }
    });

    return { success: true, message: `${key} gesetzt auf ${value}` };
  } catch (error) {
    console.error("Fehler beim Setzen:", error);
    return { success: false, message: `Fehler bei ${key}` };
  }
});




//Zoom enhance
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
    return { success: true, message: "Zoom erfolgreich angepasst auf " + zoomLevel.toString() };
  } catch (error) {
    console.error("Fehler beim Zoom:", error);
    return { success: false, message: "Fehler beim Zoom" };
  }
});

///cgi-bin/lums_ndipantilt.cgi

//dir = PT_MOTOR_RIGHT
//dir = PT_UP_LEFT etc

/*
ipcMain.handle("move-direction", async (event, direction) => {
  console.log("Bewege Kamera in Richtung: ", direction);

  try{
    const response = await fetch('http://172.23.98.93/cgi-bin/lums_ndipantilt.cgi', {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ direction: direction.toString() }),
    });
    const data = await response.json();
    console.log("Antwort von Kamera:", data);
    return {success: true, direction: direction.toString()};

  }catch(e){
    console.error("Fehler beim Bewegen:", e)
    return {success: false, message: "Fehler beim Bewegen" };
  }
});
*/

ipcMain.on('move-camera', (event, direction) => {

  console.log("Nachricht empfangen im main Prozess.");

  //turn left
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
  //turn right
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
  //turn up
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
  //turn down
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
  //STOP
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

//Schräge bewegungen

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



//Exports for renderer
/*
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
}
*/
