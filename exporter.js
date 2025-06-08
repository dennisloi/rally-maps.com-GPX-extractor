// ==UserScript==
// @name         Rally Maps GPX Exporter with Button
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  Extract stages and export GPX from rally-maps.com
// @author       You
// @match        https://www.rally-maps.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    function waitForStages() {
        return new Promise(resolve => {
            const interval = setInterval(() => {
                if (window.sl?.leaflet?.data?.storage?.stages) {
                    clearInterval(interval);
                    resolve(window.sl.leaflet.data.storage.stages);
                }
            }, 500);
        });
    }

    function buildGPX(stage) {
        const coords = stage.geometries.find(g => g.type === 'SL' || g.type === 'PL').geometry.coordinates;

        let gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Tampermonkey Script" xmlns="http://www.topografix.com/GPX/1/1">
  <trk>
    <name>${stage.name}</name>
    <trkseg>\n`;

        for (const [lon, lat] of coords) {
            gpx += `      <trkpt lat="${lat}" lon="${lon}"></trkpt>\n`;
        }

        gpx += `    </trkseg>
  </trk>
</gpx>`;

        return gpx;
    }

    function download(filename, text) {
        const element = document.createElement('a');
        element.setAttribute('href', 'data:text/xml;charset=utf-8,' + encodeURIComponent(text));
        element.setAttribute('download', filename);

        element.style.display = 'none';
        document.body.appendChild(element);

        element.click();

        document.body.removeChild(element);
    }

    async function exportSingleStage(stages) {
        const names = stages.map((s, i) => `${i}: ${s.fullName}`);
        const choice = prompt(`Pick a stage to export GPX:\n${names.join('\n')}\nOr type "all" to download all stages`, "0");

        if (!choice) return;

        if (choice.toLowerCase() === "all") {
            for (const stage of stages) {
                const gpx = buildGPX(stage);
                const filename = `${stage.name.replace(/\s+/g,'_')}.gpx`;
                download(filename, gpx);
                // tiny delay so downloads trigger properly
                await new Promise(r => setTimeout(r, 500));
            }
            alert("All GPX files downloaded!");
            return;
        }

        const index = parseInt(choice, 10);

        if (isNaN(index) || index < 0 || index >= stages.length) {
            alert("Invalid choice!");
            return;
        }

        const gpx = buildGPX(stages[index]);
        const filename = `${stages[index].name.replace(/\s+/g,'_')}.gpx`;
        download(filename, gpx);
        alert(`${filename} downloaded!`);
    }

    async function onButtonClick() {
        const stages = await waitForStages();
        await exportSingleStage(stages);
    }

    // Add a button on the page
    function addButton() {
        const btn = document.createElement('button');
        btn.textContent = 'Export Rally GPX';
        btn.style.position = 'fixed';
        btn.style.top = '10px';
        btn.style.right = '10px';
        btn.style.zIndex = 9999;
        btn.style.padding = '8px 12px';
        btn.style.backgroundColor = '#007bff';
        btn.style.color = 'white';
        btn.style.border = 'none';
        btn.style.borderRadius = '4px';
        btn.style.cursor = 'pointer';

        btn.onclick = onButtonClick;

        document.body.appendChild(btn);
    }

    // Only add button, no auto-run
    addButton();

})();
