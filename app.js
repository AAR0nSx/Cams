var needle = require('needle');
const jsdom = require("jsdom");
const path = require('node:path')
const { JSDOM } = jsdom;
const {app, BrowserWindow} = require('electron');
const {ipcMain} = require('electron');
const { event } = require('jquery');



var ptzObject = {};

var postObject = {"exposuremodeindex":"","exposurelevelname":"","gainmanualidx":"","irispriidx":"18","shuttermanualidx":"","gammanameindex":""};
var irisIndex = ["18","16","13","11","9","7.8","6.3","5.4","4.5","3.8","3.2","2.7","2.2","2.0","1.6"];
var shutterIndex = ["1/10000","1/5000","1/3000","1/2500","1/1750","1/1250","1/1000","1/600","1/425","1/300","1/215","1/150","1/120","1/100","1/75","1/50","1/25","1/12","1/6","1/3","1/2","1/1"];
var gainIndex = ["0","3","6","9","12","15","18","21","24","27","30","33","36","39","42","45"];
var modeIndex = ["Full Auto","Shutter Priority","Iris Priority","Manual"];


const dom = new JSDOM(``);

var ptz_settings = dom.window.document.querySelector("body").textContent.split(/\r?\n/);

ptz_settings = ptz_settings.filter(function(e){ return e.replace(/(\r\n|\n|\r)/gm,"")});

ptz_settings.forEach(function (item, index) {
  ptz_settings[index]=ptz_settings[index].replace(/"/g, '');
  let temp = ptz_settings[index].split("=");
  let tempobj = {};
  let key =  temp[0];
  let value = temp[1];
  tempobj[key]=value;  
  Object.assign(ptzObject, tempobj)

});

// Function to create the main window
function createMainWindow() {
  // Create a new browser window
  const mainWindow = new BrowserWindow();

  // Load an HTML file into the window
  mainWindow.loadFile('../UI/index.html');

  mainWindow.webContents.send('message', 'Hello from main process!');
}

// Event handler for when Electron has finished initialization
app.whenReady().then(createMainWindow);



function createMainwindow() {
  const mainWindow = new BrowserWindow({ width: 1280,
    height: 960,webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      preload: path.join(__dirname, 'preload.js')
    }});
  mainWindow.loadFile('index.html');

  // Send a message to the renderer process
 
}

//mainWindow.webContents.send('message', 'Hello from main process!');




var postData =  "{\"exposuremodeindex\":\"\",\"exposurelevelname\":\"\",\"gainmanualidx\":\"\",\"irispriidx\":\"14\",\"shuttermanualidx\":\"\",\"gammanameindex\":\"\"}";

var postData= JSON.stringify(postObject);
var options = {
    headers: {  'Content-Type': 'application/javascript',
      'username':'admin',
        'password':'admin'        
        }
  };
  
  needle.post('http://172.23.98.91/cgi-bin/lums_ndisetexposure.cgi', postData, options, function(error, response) {
    if (!error && response.statusCode == 200) {
        console.log(response.body);
    } else {
        console.log(error);
        console.log(response);
    }
        
  });



