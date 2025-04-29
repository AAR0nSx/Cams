/*
* JS für die index.html
*/

var main = require("../main.js");
const electronApp = require("electron").app;
const electronBrowserWindow = require("electron").BrowserWindow;
var needle = require("needle");
const nodePath = require("path");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

//let zoom = 0;

function changeZoom() {
    let zoomLevel = 20;
    window.electronAPI.enhanceZoom(zoomLevel)
        .then(response => {
            console.log(response.message);
        })
        .catch(error => {
            console.error("Zoom-Fehler:", error);
        });
}




function changePan(){
    console.log("changing Pan...");
}

function getData(){
    console.log("current Data:");
    main.getCameraData();
}