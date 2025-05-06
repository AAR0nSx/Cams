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


    window.electronAPI.getCameraData()
        .then(data => {
           console.log("Kameradaten werden abgerufen: ", data)
        });

    // Automatisch senden bei Auswahl
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


//Funktionen für Zoom Buttons

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

function moreZoomButton() {
    if (currentZoomLevel + ZOOM_STEP_BUTTON <= ZOOM_MAX) {
        currentZoomLevel += ZOOM_STEP_BUTTON;
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

function lessZoomButton() {
    if (currentZoomLevel - ZOOM_STEP_BUTTON >= ZOOM_MIN) {
        currentZoomLevel -= ZOOM_STEP_BUTTON;
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
