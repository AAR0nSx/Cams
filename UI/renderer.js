/*
* JS für die index.html
*/
console.log("renderer.js geladen.");


let currentZoomLevel = 5; // Platzhalter
const ZOOM_MIN = 0;
const ZOOM_MAX = 36;
const ZOOM_STEP = 0.2;
const ZOOM_STEP_BUTTON = 1;

let activeKey; //= null; // Damit nicht mehrfach dieselbe Bewegung ausgelöst wird (ist erstmal aus aber falls benötigt)


const pressedKeys = new Set();
let lastDirection = null;
let stopTimeout = null;
let zoomInterval = null;



window.addEventListener("DOMContentLoaded", () => {
    document.body.tabIndex = 0;
    document.body.focus();

    // Direkt beim Start initialen Zustand setzen
    window.electronAPI.getSettings().then(settings => {
        updateDarkModeClass(settings.darkMode);
    });

    // Live-Toggle beim Event
    window.electronAPI.onDarkModeUpdate((isDarkMode) => {
        console.log("DARK MODE EVENT EMPFANGEN:", isDarkMode);
        updateDarkModeClass(isDarkMode);
    });

    // Funktion zum Hinzufügen/Entfernen
    function updateDarkModeClass(enabled) {
        const root = document.documentElement; // <html>
        if (enabled) {
            root.classList.add("dark");
        } else {
            root.classList.remove("dark");
        }
    }






    //aktualisieren der Werte in DOM mit den Werten aus getCameraData
    window.electronAPI.getCameraData().then(data => {
        console.log("Kameradaten:", data);

        // Zoom Level anzeigen
        if (data.zoomposition) {
            currentZoomLevel = parseFloat(data.zoomposition);
            document.getElementById("zoom-level").innerText = `${currentZoomLevel.toFixed(1)}x`;
            document.getElementById("zoom-slider").value = currentZoomLevel.toFixed(1);
            console.log(document.getElementById("zoom-slider").value);
        }



        //Fokus - Wichtig: Fokus wird default bei jedem connect auf die cam zurückgesetzt!
        //Fokus Mode aktualisieren
        //Ja du liest richtig: positon statt position.
        //Die Kamera cgi Skripte haben einen Schreibfehler und ich dachte ich habe einen Schlaganfall
        if(data.focusautoidx && data.focuspositon) {
            console.log('Der Wert von data.focusautoidx: ', data.focusautoidx);
            console.log(`Focus Mode als ${data.focusautoidx} ausgelesen.`);
            document.getElementById("focus-mode").value = "1";
            console.log(`Focus Mode manuell auf ${document.getElementById("focus-mode").value} gesetzt.`);


            console.log('Der Wert von data.focusposition: ', data.focuspositon);
            document.getElementById("focus-range").value = data.focuspositon;
            console.log(`Focus Range als ${data.focuspositon} ausgelesen.`);
        }

        //Fokusmode
        //Fokus Automatisch senden bei Auswahl
        const focusElements = [
            { id: "focus-mode", key: "focusautoidx" }
        ];


        focusElements.forEach(({ id, key }) => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener("change", () => {
                    const value = el.value;
                    console.log(`Sende ${key}: ${value}`);
                    window.electronAPI.setFocus(key, value)
                        .then(response => {
                            console.log("Antwort:", response.message);
                        })
                        .catch(err => {
                            console.error("Fehler:", err);
                        });
                });
            }
        });

        //Fokus Slider handling
        const focusMapping = [
            { id: "focus-range",  key: "focuspositon",   valueId: "value-focus-range"}
        ];

        focusMapping.forEach(({ id, key, valueId }) => {
            const el = document.getElementById(id);
            const valueDisplay = document.getElementById(valueId);

            //Wenn es eine id von dem Attribut in index gibt und
            //Wenn es eine valueId vom Attribut in index gibt und
            //Wenn der key in data (Ergebnisse aus getCameraData) existiert
            if (el && valueDisplay && data[key] !== undefined) {
                // Initialwert aus Kamera setzen
                el.value = data[key]; //Wert aktualisieren
                console.log(`Der Wert ${el.value} wird auf ${data[key]} initialisiert.`);
                valueDisplay.textContent = data[key]; //Anzeigetext aktualisieren
                console.log(`Der Text ${valueDisplay.textContent} wird auf ${data[key]} initialisiert.`);

                // Anzeige bei Bewegung sofort aktualisieren
                // Wert senden
                el.addEventListener("input", () => { //change -> input, für direktes Feedback
                    valueDisplay.textContent = el.value;
                    window.electronAPI.setFocus(key, el.value)
                        .then(response => {
                            console.log(`WB-Wert ${key} gesetzt:`, response.message);
                        })
                        .catch(err => {
                            console.error(`Fehler beim Setzen von ${key}:`, err);
                        });
                });
            }
        });





        //WB Mode aktualisieren
        if(data.wbmodeidx) {
            document.getElementById("wb-mode").value = data.wbmodeidx;
            console.log(`WB Mode auf ${data.wbmodeidx} initialisiert.`);
        }
        //mode setzen
        //mode Automatisch senden bei Auswahl
        const whitebalanceElements = [
            { id: "wb-mode", key: "wbmodeidx" },
        ];

        data.wbmodeidx === "3" ? console.log("true") : document.getElementById("onePushWBButton").disabled = true;

        whitebalanceElements.forEach(({ id, key }) => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener("change", () => {
                    const value = el.value;
                    console.log(`Sende ${key}: ${value}`);
                    //console.log(typeof document.getElementById("wb-mode").value); -> die values sind wohl strings...
                    if(document.getElementById("wb-mode").value === "3") { //frag also nach string
                        document.getElementById("onePushWBButton").disabled = false;
                        console.log("Button aktiv");
                    }else{
                        document.getElementById("onePushWBButton").disabled = true;
                        console.log("Button wurde disabled");
                    }


                    window.electronAPI.setWhiteBalance(key, value)
                        .then(response => {
                            console.log("Antwort:", response.message);
                        })
                        .catch(err => {
                            console.error("Fehler:", err);
                        });
                });
            }
        });

        //WB Slider handling
        const whitebalanceMapping = [
            { id: "wb-manual-red",  key: "crgain",      valueId: "value-manual-red"},
            { id: "wb-manual-blue", key: "cbgain",      valueId: "value-manual-blue"}
        ];

        whitebalanceMapping.forEach(({ id, key, valueId }) => {
            const el = document.getElementById(id);
            const valueDisplay = document.getElementById(valueId);

            //Wenn es eine id von dem Attribut in index gibt und
            //Wenn es eine valueId vom Attribut in index gibt und
            //Wenn der key in data (Ergebnisse aus getCameraData) existiert
            if (el && valueDisplay && data[key] !== undefined) {
                // Initialwert aus Kamera setzen
                el.value = data[key]; //Wert aktualisieren
                console.log(`Der Wert ${el.value} wird auf ${data[key]} initialisiert.`);
                valueDisplay.textContent = data[key]; //Anzeigetext aktualisieren
                console.log(`Der Text ${valueDisplay.textContent} wird auf ${data[key]} initialisiert.`);

                // Anzeige bei Bewegung sofort aktualisieren
                // Wert senden
                el.addEventListener("input", () => { //change -> input, für direktes Feedback
                    valueDisplay.textContent = el.value;
                    window.electronAPI.setWhiteBalance(key, el.value)
                        .then(response => {
                            console.log(`WB-Wert ${key} gesetzt:`, response.message);
                        })
                        .catch(err => {
                            console.error(`Fehler beim Setzen von ${key}:`, err);
                        });
                });
            }
        });





        //Picture
        // Picture-Werte (Slider initialisieren und anzeigen)
        const pictureMapping = [
            { id: "picture-brightness", key: "brightness", valueId: "value-brightness"},
            { id: "picture-saturation", key: "saturation", valueId: "value-saturation" },
            { id: "picture-sharpness", key: "sharpness", valueId: "value-sharpness" }
        ];

        pictureMapping.forEach(({ id, key, valueId }) => {
            const el = document.getElementById(id);
            const valueDisplay = document.getElementById(valueId);

            //Wenn es eine id von dem Attribut in index gibt und
            //Wenn es eine valueId vom Attribut in index gibt und
            //Wenn der key in data (Ergebnisse aus getCameraData) existiert
            if (el && valueDisplay && data[key] !== undefined) {
                // Initialwert aus Kamera setzen
                el.value = data[key];
                valueDisplay.textContent = data[key];

                // Anzeige bei Bewegung sofort aktualisieren
                // Wert bei Loslassen senden
                el.addEventListener("input", () => { //change -> input, für direktes Feedback
                    valueDisplay.textContent = el.value;
                    window.electronAPI.setPicture(key, el.value)
                        .then(response => {
                            console.log(`Bildwert ${key} gesetzt:`, response.message);
                        })
                        .catch(err => {
                            console.error(`Fehler beim Setzen von ${key}:`, err);
                        });
                });
            }
        });


        // Belichtungseinstellungen
        const mapping = {
            "exposure-mode": "exposuremodeindex",
            "shutter": "shuttermanualidx",
            "gain": "gainmanualidx",
            "gamma": "gammanameindex"
        };

        Object.entries(mapping).forEach(([elementId, dataKey]) => {
            const el = document.getElementById(elementId);
            if (el && data[dataKey] !== undefined) {
                el.value = data[dataKey];
            }
        });
    });


    // Exposure Automatisch senden bei Auswahl
    const exposureElements = [
        { id: "exposure-mode", key: "exposuremodeindex" },
        { id: "shutter", key: "shuttermanualidx" },
        { id: "gain", key: "gainmanualidx" },
        { id: "gamma", key: "gammanameindex" }
    ];


    exposureElements.forEach(({ id, key }) => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener("change", () => {
                const value = el.value;
                console.log(`Sende ${key}: ${value}`);
                window.electronAPI.setExposure(key, value)
                    .then(response => {
                        console.log("Antwort:", response.message);
                    })
                    .catch(err => {
                        console.error("Fehler:", err);
                    });
            });
        }
    });


    //BUTTONS
    const buttons = document.querySelectorAll(".direction-button");

    buttons.forEach(button => {
        const direction = button.dataset.direction;

        button.addEventListener("mousedown", () => {
            window.electronAPI.moveCamera(direction);
            console.log("Kamera bewegt sich:", direction);
        });

        const stopMovement = () => {
            window.electronAPI.moveCamera("stop");
            console.log("Kamera gestoppt");
        };

        button.addEventListener("mouseup", stopMovement);
        button.addEventListener("mouseleave", stopMovement);
    });

    //KEYS
    document.addEventListener("keydown", (event) => {
        if (!event.repeat) {
            // ZOOM IN (+)
            if (event.code === "BracketRight") {
                if (!zoomInterval) {
                    zoomInterval = setInterval(() => {
                        moreZoom();
                        console.log("Zooming in...");
                    }, 0);
                }
                return;
            }

            // ZOOM OUT (-)
            if (event.code === "Slash") {
                if (!zoomInterval) {
                    zoomInterval = setInterval(() => {
                        lessZoom();
                        console.log("Zooming out...");
                    }, 0);
                }
                return;
            }

            pressedKeys.add(event.code);
            handleCombinedDirection();
        }
    });

    document.addEventListener("keyup", (event) => {
        // Zoom beenden
        if (
            event.code === "BracketRight" ||
            event.code === "Slash"
        ) {
            if (zoomInterval) {
                clearInterval(zoomInterval);
                zoomInterval = null;
                console.log("Zoom gestoppt");
            }
            return;
        }

        pressedKeys.delete(event.code);

        if (pressedKeys.size === 0) {
            if (stopTimeout) clearTimeout(stopTimeout);
            stopTimeout = setTimeout(() => {
                window.electronAPI.moveCamera("stop");
                lastDirection = null;
                console.log("Kamera gestoppt");
            }, 400);
        } else {
            handleCombinedDirection();
        }
    });

    function handleCombinedDirection() {
        const direction = getCombinedDirection(Array.from(pressedKeys));
        if (direction && direction !== lastDirection) {
            window.electronAPI.moveCamera(direction);
            lastDirection = direction;
            console.log("Bewege Kamera:", direction);
        }
    }

    function getCombinedDirection(codes) {
        const keys = new Set(codes);
        const up = keys.has("ArrowUp");
        const down = keys.has("ArrowDown");
        const left = keys.has("ArrowLeft");
        const right = keys.has("ArrowRight");

        if (up && left) return "up_left";
        if (up && right) return "up_right";
        if (down && left) return "down_left";
        if (down && right) return "down_right";
        if (up) return "up";
        if (down) return "down";
        if (left) return "left";
        if (right) return "right";
        return null;
    }
});


// Preset speichern
document.getElementById("store-preset-1").addEventListener("click", () => {
    const settings = collectCurrentSettings();
    window.electronAPI.setPreset("1", settings).then(response => {
        console.log(response.message);
    });
});


document.getElementById("store-preset-2").addEventListener("click", () => {
    const settings = collectCurrentSettings();
    window.electronAPI.setPreset("2", settings).then(response => {
        console.log(response.message);
    });
});

document.getElementById("store-preset-3").addEventListener("click", () => {
    const settings = collectCurrentSettings();
    window.electronAPI.setPreset("3", settings).then(response => {
        console.log(response.message);
    });
});

document.getElementById("store-preset-4").addEventListener("click", () => {
    const settings = collectCurrentSettings();
    window.electronAPI.setPreset("4", settings).then(response => {
        console.log(response.message);
    });
});


// Preset laden
document.getElementById("load-preset-1").addEventListener("click", () => {
    window.electronAPI.getPreset("1").then(response => {
        if (response.success) {
            console.log("Preset 1 wurde geladen:", response.message);
            // Jetzt neue Werte von der Kamera holen und anwenden
            window.electronAPI.getCameraData().then(data => {
                applySettingsToUI(data);
                console.log("Kamera-Einstellungen übernommen:", data);
            });

        } else {
            console.error(response.message);
        }
    });
});


document.getElementById("load-preset-2").addEventListener("click", () => {
    window.electronAPI.getPreset("2").then(response => {
        if (response.success) {
            console.log("Preset 1 wurde geladen:", response.message);
            // Jetzt neue Werte von der Kamera holen und anwenden
            window.electronAPI.getCameraData().then(data => {
                applySettingsToUI(data);
                console.log("Kamera-Einstellungen übernommen:", data);
            });

        } else {
            console.error(response.message);
        }
    });
});

document.getElementById("load-preset-3").addEventListener("click", () => {
    window.electronAPI.getPreset("3").then(response => {
        if (response.success) {
            console.log("Preset 3 wurde geladen:", response.message);
            // Jetzt neue Werte von der Kamera holen und anwenden
            window.electronAPI.getCameraData().then(data => {
                applySettingsToUI(data);
                console.log("Kamera-Einstellungen übernommen:", data);
            });

        } else {
            console.error(response.message);
        }
    });
});

document.getElementById("load-preset-4").addEventListener("click", () => {
    window.electronAPI.getPreset("4").then(response => {
        if (response.success) {
            console.log("Preset 1 wurde geladen:", response.message);
            // Jetzt neue Werte von der Kamera holen und anwenden
            window.electronAPI.getCameraData().then(data => {
                applySettingsToUI(data);
                console.log("Kamera-Einstellungen übernommen:", data);
            });

        } else {
            console.error(response.message);
        }
    });
});


//Preset Hilfsfunktionen:
function collectCurrentSettings() {
    const ids = [
        "zoom-slider", "focus-mode", "focus-range",
        "wb-mode", "wb-manual-red", "wb-manual-blue",
        "picture-brightness", "picture-saturation", "picture-sharpness",
        "exposure-mode", "shutter", "gain", "gamma"
    ];
    const settings = {};
    ids.forEach(id => {
        const el = document.getElementById(id); //Für jedes Element in der Liste, speichere die id aus DOM
        if (el) settings[id] = el.value; //Wenn das Element aus der Liste im DOM existiert, speichere den Wert
    });
    return settings;
}

function applySettingsToUI(cameraData) {

    //mapping von Camera Key auf ID im UI/DOM
    // , weil die indexe im data Objekt nicht so heißen wie die ID der DOM Elemente und sie deshalb ohne das
    // mapping nicht gefunden und aktualisiert werden können
    const mapping = {
        "zoomposition": "zoom-slider",
        "focusautoidx": "focus-mode",
        "focuspositon": "focus-range",
        "wbmodeidx": "wb-mode",
        "crgain": "wb-manual-red",
        "cbgain": "wb-manual-blue",
        "brightness": "picture-brightness",
        "saturation": "picture-saturation",
        "sharpness": "picture-sharpness",
        "exposuremodeindex": "exposure-mode",
        "shuttermanualidx": "shutter",
        "gainmanualidx": "gain",
        "gammanameindex": "gamma"
    };

    Object.entries(mapping).forEach(([cameraKey, uiId]) => {
        const el = document.getElementById(uiId);
        if (el && cameraData[cameraKey] !== undefined) {
            el.value = cameraData[cameraKey];

            // für visuelle Anzeigen neben Slidern
            const spanId = `value-${uiId.split("-").pop()}`;
            const valueSpan = document.getElementById(spanId);
            if (valueSpan) valueSpan.textContent = cameraData[cameraKey];

            el.dispatchEvent(new Event("input", { bubbles: true }));
            el.dispatchEvent(new Event("change", { bubbles: true }));

            console.log(`Setze ${uiId} auf ${cameraData[cameraKey]}`);
        } else {
            console.warn(`Kein Element oder Wert für: ${cameraKey} → ${uiId}`);
        }
    });
}





//One Push White balance Funktion (One Push WB Button)
function onePushWB(){
    const key = "wbonepushtrigger";
    const value = "[object Event]";
    console.log("onePushWB Funktion ausgeführt");
    window.electronAPI.setWhiteBalance(`${key}`, `${value}`)
        .then(response => {
           console.log(`White Balance Wert auf ${key} gesetzt`);
        });
}


//Funktionen für Zoom

//einheitliche Zoom Funktion -> von slider genutzt

function setZoomLevel(level) {
    if (level < ZOOM_MIN) level = ZOOM_MIN;
    if (level > ZOOM_MAX) level = ZOOM_MAX;

    currentZoomLevel = level;
    document.getElementById("zoom-level").innerText = `${level.toFixed(1)}x`;
    document.getElementById("zoom-slider").value = level;

    window.electronAPI.enhanceZoom(level)
        .then(response => console.log(response.message))
        .catch(error => console.error("Zoom-Fehler:", error));
}


//slider Event Listener für Zoom
document.getElementById("zoom-slider").addEventListener("input", (event) => {
    const newZoom = parseFloat(event.target.value);
    setZoomLevel(newZoom);
});


//einzelne handler Funktionen für Button und Tastendruck des Zooms
function moreZoom() {
    if (currentZoomLevel + ZOOM_STEP <= ZOOM_MAX) {
        setZoomLevel(currentZoomLevel + ZOOM_STEP);
    } else {
        console.log("Maximaler Zoom erreicht.");
    }
}

function lessZoom() {
    if (currentZoomLevel - ZOOM_STEP >= ZOOM_MIN) {
        setZoomLevel(currentZoomLevel - ZOOM_STEP);
    } else {
        console.log("Minimaler Zoom erreicht.");
    }
}

function moreZoomButton() {
    if (currentZoomLevel + ZOOM_STEP_BUTTON <= ZOOM_MAX) {
        setZoomLevel(currentZoomLevel + ZOOM_STEP_BUTTON);
    } else {
        console.log("Maximaler Zoom erreicht.");
    }
}

function lessZoomButton() {
    if (currentZoomLevel - ZOOM_STEP_BUTTON >= ZOOM_MIN) {
        setZoomLevel(currentZoomLevel - ZOOM_STEP_BUTTON);
    } else {
        console.log("Minimaler Zoom erreicht.");
    }
}
