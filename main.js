
const electronApp = require("electron").app;
const electronBrowserWindow = require("electron").BrowserWindow;
var needle = require("needle");
const nodePath = require("path");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

let window;

console.log('electronApp:', electronApp);


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
    .loadFile("index.html")
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
