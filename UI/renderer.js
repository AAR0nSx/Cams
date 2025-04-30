/*
* JS für die index.html
*/
console.log("renderer.js geladen.");


let currentZoomLevel = 5; // Platzhalter
const ZOOM_MIN = 0;
const ZOOM_MAX = 36;
const ZOOM_STEP = 1;

let activeKey; //= null; // Damit nicht mehrfach dieselbe Bewegung ausgelöst wird (ist erstmal aus aber falls benötigt)
let stopTimeout = null;



//Event-Listener
//On DOM Load Fokus für Button setzen
window.addEventListener("DOMContentLoaded", () => {
    document.body.tabIndex = 0;
    // Fokus explizit setzen – das ist entscheidend
    document.body.setAttribute("tabindex", "0");
    document.body.focus();
    console.log("Fokus auf Body gesetzt.");

    // Kontrollausgabe ob Element aktiv ist
    console.log("Ist document.activeElement === body?", document.activeElement === document.body);


    console.log("DOM geladen und Fokus gesetzt!");


    document.addEventListener('keydown', (event) => {
        console.log("Keydown detected.");
        const direction = getDirectionFromKey(event.code);
        if (direction && activeKey !== direction) {
            activeKey = direction;
            window.electronAPI.moveCamera(direction);
            console.log("Bewege Kamera:", direction);
        }
    });

    document.addEventListener('keyup', (event) => {
        console.log("Keyup detected.");
        const direction = getDirectionFromKey(event.code);
        if (direction && activeKey === direction) {
            activeKey = null;

            // Sanftes Stoppen nach Verzögerung
            if (stopTimeout) clearTimeout(stopTimeout);
            stopTimeout = setTimeout(() => {
                window.electronAPI.moveCamera('stop');
                console.log("Kamera gestoppt");
            }, 0); // z. B. 100ms sanfte Verzögerung
        }
    });

    //Übersetzung der keyCodes in directions für moveCamera(direction)
    function getDirectionFromKey(code) {
        switch (code) {
            case 'ArrowLeft': return 'left';
            case 'ArrowRight': return 'right';
            case 'ArrowUp': return 'up';
            case 'ArrowDown': return 'down';
            default: return null;
        }
    }
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


//BUTTONS
function moveCamera(direction) {
    switch (direction) {
        case "left":
            window.electronAPI.moveCamera('left');
            console.log("Bewege Kamera nach links...");
            break;
        case "right":
            window.electronAPI.moveCamera('right');
            console.log("Bewege Kamera nach rechts...");
            break;
        case "up":
            window.electronAPI.moveCamera('up');
            console.log("Bewege Kamera nach oben...");
            break;
        case "down":
            window.electronAPI.moveCamera('down');
            console.log("Bewege Kamera nach unten...");
            break;
        case "stop":
            window.electronAPI.moveCamera('stop');
            break;
        default:
            console.log("unable to move camera.");
            break;
    }
}
