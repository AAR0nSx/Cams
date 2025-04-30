/*
* JS für die index.html
*/

let currentZoomLevel = 5; // Platzhalter
const ZOOM_MIN = 0;
const ZOOM_MAX = 36;
const ZOOM_STEP = 1;

const axios = require('axios');
const main = require("../main.js");
const electronApp = require("electron").app;
const electronBrowserWindow = require("electron").BrowserWindow;
var needle = require("needle");
const nodePath = require("path");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');



//Event-Listener
//Wert abfragen
window.addEventListener("DOMContentLoaded", () => {
    window.electronAPI.getCurrentZoom()
        .then(response => {
            if (response.success && typeof response.zoomLevel === "number") {
                currentZoomLevel = response.zoomLevel;
                console.log("Initialer Zoom-Level:", currentZoomLevel);
                // Optional: UI aktualisieren
            } else {
                console.warn("Konnte Zoom-Level nicht abrufen, Standardwert wird verwendet.");
            }
        })
        .catch(error => {
            console.error("Fehler beim Initial-Zoom:", error);
        });
});


//window.addEventListener("offline")

// Vor dem Schließen des Fensters Zoom zurücksetzen
/*
window.addEventListener("beforeunload", () => {
    window.electronAPI.resetZoom()
        .then(response => {
            console.log(response.message); //Fehler oder Erfolg
        })
        .catch(error => {
            console.error("Fehler beim Zurücksetzen des Zooms:", error);
        });
});
*/




//Funktionen
function moreZoom() {
    if (currentZoomLevel + ZOOM_STEP <= ZOOM_MAX) {
        currentZoomLevel += ZOOM_STEP;
        window.electronAPI.enhanceZoom(currentZoomLevel)
            .then(response => {
                console.log(response.message);
            })
            .catch(error => {
                console.error("Zoom-Fehler:", error);
            });
    } else {
        console.log("Maximaler Zoom erreicht.");
    }

}

function lessZoom() {
    if (currentZoomLevel - ZOOM_STEP >= ZOOM_MIN) {
        currentZoomLevel -= ZOOM_STEP;
        window.electronAPI.decreaseZoom(currentZoomLevel)
            .then(response => {
                console.log(response.message);
            })
            .catch(error => {
                console.error("Zoom-Fehler:", error);
            });
    } else {
        console.log("Minimaler Zoom erreicht.");
    }
}
/*
function moveDirection(){
    window.electronAPI.moveDirection()
        .then(response => {
            console.log(response.message);
        })
    .catch(error => {
        console.error("Bewegungs-Fehler:", error);
    });
}
*/

// !!! <paper-icon-button icon="arrow:arrow-upward-left" dir="PT_MOTOR_LEFT" noink="" role="button" tabindex="0" aria-disabled="true"></paper-icon-button> !!!




function moveCamera(direction) {
    switch (direction) {
        case "left":
            window.electronAPI.moveCamera('left');
            break;
        case "right":
            window.electronAPI.moveCamera('right');
            break;
        case "up":
            window.electronAPI.moveCamera('up');
            break;
        case "down":
            window.electronAPI.moveCamera('down');
            break;
        default:
            console.log("unable to move camera.");
            break;
    }

}

function getData(){
    console.log("current Data:");
    main.getCameraData();
}


