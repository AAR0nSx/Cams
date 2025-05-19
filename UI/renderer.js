/*
* JS für die index.html
*/
console.log("renderer.js geladen.");



window.addEventListener("DOMContentLoaded", async () => {
    const settings = await window.electronAPI.getSettings();
    updateDarkModeClass(settings.darkMode);

    const container = document.getElementById("camera-container");
    const template = document.getElementById("camera-template");

    // Kamera-UIs anzeigen
    renderCameraUIs(settings.cameraIPs || []);

    // Wenn Dark Mode sich später ändert
    window.electronAPI.onDarkModeUpdate(updateDarkModeClass);

    // Wenn Kamera-UI aktualisiert werden soll
    window.electronAPI.onUpdateCameraUIs(async () => {
        console.log("Empfange update-camera-uis Event");
        const latest = await window.electronAPI.getSettings();
        renderCameraUIs(latest.cameraIPs || []);
    });


    function updateDarkModeClass(enabled) {
        document.documentElement.classList.toggle("dark", enabled);
    }

    function renderCameraUIs(cameraIPs) {

        console.log("Render Camera UIs mit IPs (DOM loaded renderer):", cameraIPs);

        container.innerHTML = ""; // Alte UIs entfernen

        // Dynamische Grid-Klassen setzen
        const gridClassBase = "grid gap-4 px-2 max-w-screen-2xl mx-auto";
        const gridCols = Math.min(cameraIPs.length, 4); // Max. 4 Spalten
        container.className = `${gridClassBase} grid-cols-${gridCols}`;


        cameraIPs.forEach(async (ip) => {
            console.log("Baue UI für:", ip);

            const clone = template.content.cloneNode(true);
            const wrapper = clone.querySelector(".camera-ui");
            wrapper.dataset.ip = ip;

            container.appendChild(wrapper); // UI immer einfügen
            //Mit try wird die KameraUI immer gebaut, egal ob die promise bei getCamerdata() fehlschlägt
            try {
                const data = await window.electronAPI.getCameraData(ip);
                console.log(`[${ip}] Kameradaten:`, data);
                wrapper.querySelector(".camera-label").textContent = `${data?.cameraname} (${ip})` || `Kamera (${ip})`;
                //Wenn der Name nicht gefunden werden kann, heißt Sie defauult: Kamera und die IP dahinter
            } catch (error) {
                console.warn(`⚠️ Fehler beim Abrufen der Daten für ${ip}:`, error);
                wrapper.querySelector(".camera-label").textContent = `Kamera (${ip}) - Fehler`;
            }

            initCameraUI(wrapper, ip); // Wird IMMER aufgerufen, auch bei Fehlern
        });

    }
});

/*
* Fragt regelmäßig (timeout) die Kameras nach Ihren Daten
* Hat die Kamera eine bestimmte IP Adresse ist Sie online (98er Netz)
* Ist Sie im 21er Netz wird Sie gelb (online aber im falschen Netz)
* Und wenn keine IP Adresse in den Kameradaten gefunden wird, ist Sie offline
* */
setInterval(() => {
    const IPs = settings.cameraIPs;
    IPs.forEach(async (ip) => {
        try {
            const data = await window.electronAPI.getCameraData(ip);
            const cameraIP = data.netip?.trim(); //-> data.netip ? .trim (leerzeichen aus string entfernen) : data.netip = undefined

            if (cameraIP?.startsWith("172.23.97") || cameraIP?.startsWith("172.23.98" || cameraIP?.startsWith("172.23.99"))) {
                //console.log(`${cameraIP} ist: online`);
                setCameraStatus(ip, "online");
            } else if (cameraIP?.startsWith("172.23.21")) {
                //console.log(`${cameraIP} ist: falsches Netz`);
                setCameraStatus(ip, "warn");
            } else {
                //console.log(`${cameraIP} ist: offline`);
                setCameraStatus(ip, "offline");
            }
        } catch (err) {
            //console.warn(`Kamera ${ip} nicht erreichbar.`);
            setCameraStatus(ip, "offline");
        }
    });
}, 3000); //Updates alle 3 Sekunden



//Statuslampe handler
//Setzt den Punkt auf den Status der zuvor in setInterval() festgelegt wurde
function setCameraStatus(ip, status) {
    console.log(`setCameraStatus(${ip}, ${status})`);

    const wrapper = document.querySelector(`.camera-ui[data-ip="${ip}"]`);
    //console.log("Status setzen für IP:", ip, "Wrapper gefunden?", !!wrapper);
    if (!wrapper) return;

    const lampe = wrapper.querySelector(".status-lampe");
    //console.log("Lampe gefunden?", !!lampe);
    if (!lampe) return;

    const classes = {
        online: "status-lampe inline-flex h-4 w-4 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]",
        offline: "status-lampe inline-flex h-4 w-4 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]",
        warn: "status-lampe inline-flex h-4 w-4 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]",
    };

    lampe.className = `status-lampe ${classes[status] || classes.warn}`;
}


//refresh Camera UIs
/*
async function refreshCameraUIs() {
    const container = document.getElementById("camera-container");
    container.innerHTML = ""; // Alte UIs entfernen

    const settings = await window.electronAPI.getSettings();
    const cameraIPs = settings.cameraIPs || [];
    const template = document.getElementById("camera-template");

    cameraIPs.forEach((ip, index) => {
        const clone = template.content.cloneNode(true);
        const wrapper = clone.querySelector(".camera-ui");
        wrapper.dataset.ip = ip;

        //data = await electronAPI.getCameraData(ip);
        //wrapper.querySelector(".camera-label").textContent = data.cameraname;//`Kamera ${index + 1} (${ip})`;

        container.appendChild(wrapper);
        initCameraUI(wrapper, ip);
    });
}
*/


//init Camera UI
function initCameraUI(wrapper, ip) {


    console.log(`Initialisiere Kamera-UI für ${ip}`);

    console.log("Hole Kameradaten für IP (init Camera UI):", ip);


    // Kamera-Daten holen
    window.electronAPI.getCameraData(ip).then(data => {
        console.log(`[${ip}] Kameradaten:`, data);

        // Zoom
        const zoomLevelEl = wrapper.querySelector(".zoom-level");
        const zoomSlider = wrapper.querySelector(".zoom-slider");
        let currentZoom = parseFloat(data.zoomposition || 0);

        const updateZoom = (value) => {
            currentZoom = Math.max(0, Math.min(36, value));
            zoomLevelEl.textContent = `${currentZoom.toFixed(1)}x`;
            zoomSlider.value = currentZoom;

            window.electronAPI.enhanceZoom(currentZoom, ip);
        };

        zoomSlider.value = currentZoom;
        zoomLevelEl.textContent = `${currentZoom.toFixed(1)}x`;

        zoomSlider.addEventListener("input", () => updateZoom(parseFloat(zoomSlider.value)));
        wrapper.querySelector(".zoom-in").addEventListener("click", () => updateZoom(currentZoom + 1));
        wrapper.querySelector(".zoom-out").addEventListener("click", () => updateZoom(currentZoom - 1));

        // Fokus
        const focusModeEl = wrapper.querySelector(".focus-mode");
        const focusRangeEl = wrapper.querySelector(".focus-range");
        const focusValueSpan = wrapper.querySelector(".value-focus-range");

        //if (data.focusautoidx) focusModeEl.value = data.focusautoidx;
        //setzt den Wert von Fokusmdoe auf den tatsächlichen
        //Wenn Fokusmode 2 oder 3 empfangen werden (was sie werden warum auch immer), setzt er den Modus erstmal manuell
        if (data.focusautoidx == "2" || data.focusautoidx == "3") {
            focusModeEl.value = "0";
        }

        if (data.focuspositon) {
            focusRangeEl.value = data.focuspositon;
            focusValueSpan.textContent = data.focuspositon;
        }

        focusModeEl.addEventListener("change", () => {
            window.electronAPI.setFocus("focusautoidx", focusModeEl.value, ip);
        });

        focusRangeEl.addEventListener("input", () => {
            focusValueSpan.textContent = focusRangeEl.value;
            window.electronAPI.setFocus("focuspositon", focusRangeEl.value, ip);
        });

        //Fokus in Button
        wrapper.querySelector(".focus-in").addEventListener("click", () => {
            let focusValue = parseInt(focusRangeEl.value ||0);
            focusValue = Math.min(focusValue+1, 2409)

            //UI updaten
            focusRangeEl.value = focusValue;
            focusValueSpan.textContent = focusValue;

            //sende an Kamera
            console.log("Ändere Wert auf: ", focusValue);
            window.electronAPI.setFocus("focuspositon", focusValue.toString(), ip);

        });

        //Fokus out Button
        wrapper.querySelector(".focus-out").addEventListener("click", () => {
            let focusValue = parseInt(focusRangeEl.value ||0);
            focusValue = Math.min(focusValue-1, 2409)

            //UI updaten
            focusRangeEl.value = focusValue;
            focusValueSpan.textContent = focusValue;

            //sende an Kamera
            console.log("Ändere Wert auf: ", focusValue);
            window.electronAPI.setFocus("focuspositon", focusValue.toString(), ip);

        });

        // White Balance
        const wbModeEl = wrapper.querySelector(".wb-mode");
        const onePushBtn = wrapper.querySelector(".one-push-wb");
        const redSlider = wrapper.querySelector(".wb-manual-red");
        const blueSlider = wrapper.querySelector(".wb-manual-blue");
        const redValue = wrapper.querySelector(".value-manual-red");
        const blueValue = wrapper.querySelector(".value-manual-blue");

        wbModeEl.value = data.wbmodeidx || "0";
        redSlider.value = data.crgain || "0";
        blueSlider.value = data.cbgain || "0";
        redValue.textContent = redSlider.value;
        blueValue.textContent = blueSlider.value;

        wbModeEl.addEventListener("change", () => {
            window.electronAPI.setWhiteBalance("wbmodeidx", wbModeEl.value, ip);
            onePushBtn.disabled = wbModeEl.value !== "3";
        });

        redSlider.addEventListener("input", () => {
            redValue.textContent = redSlider.value;
            window.electronAPI.setWhiteBalance("crgain", redSlider.value, ip);
        });

        blueSlider.addEventListener("input", () => {
            blueValue.textContent = blueSlider.value;
            window.electronAPI.setWhiteBalance("cbgain", blueSlider.value, ip);
        });

        onePushBtn.addEventListener("click", () => {
            window.electronAPI.setWhiteBalance("wbonepushtrigger", "1", ip);
        });

        // Picture Settings
        const picSettings = [
            { key: "brightness", selector: "picture-brightness", valueSelector: "value-brightness" },
            { key: "saturation", selector: "picture-saturation", valueSelector: "value-saturation" },
            { key: "sharpness", selector: "picture-sharpness", valueSelector: "value-sharpness" }
        ];

        picSettings.forEach(({ key, selector, valueSelector }) => {
            const input = wrapper.querySelector(`.${selector}`);
            const span = wrapper.querySelector(`.${valueSelector}`);
            if (data[key]) {
                input.value = data[key];
                span.textContent = data[key];
            }

            input.addEventListener("input", () => {
                span.textContent = input.value;
                window.electronAPI.setPicture(key, input.value, ip);
            });
        });

        // Belichtung
        const exposureFields = [
            { key: "exposuremodeindex", selector: "exposure-mode" },
            { key: "shuttermanualidx", selector: "shutter" },
            { key: "gainmanualidx", selector: "gain" },
            { key: "gammanameindex", selector: "gamma" },
            { key: "exposurelevelname", selector: "value-exposure-compensation"}
        ];

        exposureFields.forEach(({ key, selector }) => {
            const el = wrapper.querySelector(`.${selector}`);
            if (data[key]) el.value = data[key];

            el.addEventListener("change", () => {
                window.electronAPI.setExposure(key, el.value, ip);
            });
        });


        //Exposure Compensation
        const ecValueEl = wrapper.querySelector(".value-exposure-compensation");

        // Initialwert aus Kamera setzen
        if (data.exposurelevelname !== undefined) {
            ecValueEl.textContent = data.exposurelevelname;
        }

        // Funktion zum Aktualisieren
        const updateExposureCompensation = (delta) => {
            let currentValue = parseInt(ecValueEl.textContent || "0", 10);
            currentValue = Math.max(0, Math.min(currentValue + delta, 10)); // Begrenzung zwischen 0–10

            // UI aktualisieren
            ecValueEl.textContent = currentValue;

            // Wert an Kamera senden
            console.log(`Ändere Exposure Compensation auf: ${currentValue}`);
            window.electronAPI.setExposure("exposurelevelname", currentValue.toString(), ip);
        };

        // Event Listener für Buttons
        wrapper.querySelector(".increase-exposure-compensation").addEventListener("click", () => {
            updateExposureCompensation(1);
        });

        wrapper.querySelector(".decrease-exposure-compensation").addEventListener("click", () => {
            updateExposureCompensation(-1);
        });





    });

    // Bewegung
    wrapper.querySelectorAll(".direction-button").forEach(button => {
        const direction = button.dataset.direction;
        button.addEventListener("mousedown", () => {
            window.electronAPI.moveCamera(direction, ip);
        });
        const stop = () => window.electronAPI.moveCamera("stop", ip);
        button.addEventListener("mouseup", stop);
        button.addEventListener("mouseleave", stop);
    });

    //presets
    // Für jeden Preset-Lade-Button einen Listener
    wrapper.querySelectorAll(".load-preset").forEach(button => {
        button.addEventListener("click", async () => {
            const presetNumber = button.dataset.preset;
            showLoader();

            try{
                // Sende Befehl an Kamera: Preset laden
                const response = await window.electronAPI.getPreset(presetNumber, ip);

                if (response.success) {
                    console.log(`Preset ${presetNumber} geladen für ${ip}, warte auf Stabilisierung...`);

                    // Warte, bis Zoom & Fokus sich nicht mehr ändern (langsamste Parameter, sollte soweit reichen wenn die fertig sind)
                    const finalData = await waitForStableCameraState(ip);

                    // Übernehme Werte in UI (nur wenn sie wirklich "fertig" sind)
                    applySettingsToUI(wrapper, finalData);

                    console.log("Preset vollständig übernommen und UI aktualisiert:", finalData);
                } else {
                    console.warn("Preset konnte nicht geladen werden:", response.message);
                }

            }catch(err){
                console.error("Fehler beim Laden des Presets", err);
            }finally{
                hideLoader();
            }


        });
    });



    /*
     * Wartet, bis die Kamera "stabil" ist – also sich z.B. Zoom oder Fokus nicht mehr ändern.
     * Dies verhindert, dass Zwischenwerte in die UI geschrieben werden.
     * ip - IP-Adresse der Kamera
     * timeout - Maximale Wartezeit in Millisekunden (Default: 5000ms)
     * checkInterval - Prüfintervall in ms (Default: 300ms)
     */
    async function waitForStableCameraState(ip, timeout = 5000, checkInterval = 300) {
        const maxAttempts = Math.ceil(timeout / checkInterval); // wie oft wir prüfen dürfen
        let lastZoom = null;
        let lastFocus = null;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const data = await window.electronAPI.getCameraData(ip); // aktuelle Kamera-Daten abrufen

            // Wenn Zoom und Fokus sich nicht verändert haben -> Kamera ist "stabil"
            if (
                data.zoomposition === lastZoom &&
                data.focuspositon === lastFocus
            ) {
                return data; // fertig, stabile Werte gefunden
            }

            // ansonsten merken wir uns die aktuellen Werte für den nächsten Vergleich
            lastZoom = data.zoomposition;
            lastFocus = data.focuspositon;

            // kurze Pause bis zur nächsten Prüfung
            await new Promise(res => setTimeout(res, checkInterval));
        }

        // Falls die Kamera innerhalb der Zeit nicht "stabil" wurde (Kameradaten haben sich nicht mehr geändert)
        //gib die letzten Daten zurück
        console.warn("Kamera wurde nicht stabil innerhalb Timeout.");
        return await window.electronAPI.getCameraData(ip);
    }


    wrapper.querySelectorAll(".store-preset").forEach(button => {
        button.addEventListener("click", async () => {
            const presetNumber = button.dataset.preset;

            // Aktuelle Werte direkt von der Kamera holen
            const current = await window.electronAPI.getCameraData(ip);
            await window.electronAPI.setPreset(presetNumber, ip);

            console.log(`Preset ${presetNumber} gespeichert:`, current);
        });
    });
}

//Preset Hilfsfunktionen:

function applySettingsToUI(wrapper, cameraData) {
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

    Object.entries(mapping).forEach(([cameraKey, className]) => {
        const el = wrapper.querySelector(`.${className}`);
        if (el && cameraData[cameraKey] !== undefined) {
            el.value = cameraData[cameraKey];

            const valueSpan = wrapper.querySelector(`.value-${className.split("-").pop()}`);
            if (valueSpan) valueSpan.textContent = cameraData[cameraKey];

            el.dispatchEvent(new Event("input", { bubbles: true }));
            el.dispatchEvent(new Event("change", { bubbles: true }));
        }
    });
}

//Loader Handling wenn Presets geladen werden
function showLoader() {
    const loader = document.getElementById("global-loader");
    if (loader) {
        loader.classList.remove("hidden");
        document.body.style.pointerEvents = "none"; // Interaktion blockieren
    }
}

function hideLoader() {
    const loader = document.getElementById("global-loader");
    if (loader) {
        loader.classList.add("hidden");
        document.body.style.pointerEvents = ""; // Interaktion erlauben
    }
}
