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
        const latest = await window.electronAPI.getSettings();
        renderCameraUIs(latest.cameraIPs || []);
    });

    function updateDarkModeClass(enabled) {
        document.documentElement.classList.toggle("dark", enabled);
    }

    function renderCameraUIs(cameraIPs) {
        console.log("Render Camera UIs mit IPs (DOM loaded renderer):", cameraIPs);

        container.innerHTML = ""; // Alte UIs entfernen
        cameraIPs.forEach((ip, index) => {
            const clone = template.content.cloneNode(true);
            const wrapper = clone.querySelector(".camera-ui");
            wrapper.dataset.ip = ip;
            wrapper.querySelector(".camera-label").textContent = `Kamera ${index + 1} (${ip})`;
            container.appendChild(wrapper);
            initCameraUI(wrapper, ip);
        });
    }
});


//UI neu bauen bei speichern
window.electronAPI.onUpdateCameraUIs(() => {
    console.log("Empfange update-camera-uis Event");
    refreshCameraUIs();
});

//refresh Camera UIs
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
        wrapper.querySelector(".camera-label").textContent = `Kamera ${index + 1} (${ip})`;

        container.appendChild(wrapper);
        initCameraUI(wrapper, ip);
    });
}



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

        //if (data.focusautoidx) focusModeEl.value = data.focusautoidx; //setzt den Wert von Fokusmdoe auf den tatsächlichen
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
            { key: "gammanameindex", selector: "gamma" }
        ];

        exposureFields.forEach(({ key, selector }) => {
            const el = wrapper.querySelector(`.${selector}`);
            if (data[key]) el.value = data[key];

            el.addEventListener("change", () => {
                window.electronAPI.setExposure(key, el.value, ip);
            });
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
    wrapper.querySelectorAll(".load-preset").forEach(button => {
        button.addEventListener("click", () => {
            const presetNumber = button.dataset.preset;
            window.electronAPI.getPreset(presetNumber, ip)
                .then(response => {
                    if (response.success) {
                        window.electronAPI.getCameraData(ip)
                            .then(data => applySettingsToUI(wrapper, data));
                    }
                });
        });
    });

    wrapper.querySelectorAll(".store-preset").forEach(button => {
        button.addEventListener("click", () => {
            const presetNumber = button.dataset.preset;
            const settings = collectCurrentSettings(wrapper); // Wichtig: wrapper!
            window.electronAPI.setPreset(presetNumber, settings, ip)
                .then(response => {
                    console.log(response.message);
                })
                .catch(error => console.log(error));
        });
    });


}





//Preset Hilfsfunktionen:
function collectCurrentSettings(wrapper) {
    const selectors = [
        { key: "zoomposition", className: "zoom-slider" },
        { key: "focusautoidx", className: "focus-mode" },
        { key: "focuspositon", className: "focus-range" },
        { key: "wbmodeidx", className: "wb-mode" },
        { key: "crgain", className: "wb-manual-red" },
        { key: "cbgain", className: "wb-manual-blue" },
        { key: "brightness", className: "picture-brightness" },
        { key: "saturation", className: "picture-saturation" },
        { key: "sharpness", className: "picture-sharpness" },
        { key: "exposuremodeindex", className: "exposure-mode" },
        { key: "shuttermanualidx", className: "shutter" },
        { key: "gainmanualidx", className: "gain" },
        { key: "gammanameindex", className: "gamma" }
    ];

    const settings = {};
    selectors.forEach(({ key, className }) => {
        const el = wrapper.querySelector(`.${className}`);
        if (el) settings[key] = el.value;
    });

    return settings;
}


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
