const axios = require('axios');
const fs = require('fs');
const osmtogeojson = require('osmtogeojson');

async function getCampecheGeoJSON() {
    console.log("Fetching Campeche municipalities from Overpass API...");
    const query = `
        [out:json][timeout:60];
        area["name"="Campeche"]["admin_level"="4"]->.a;
        (
            relation["admin_level"="6"](area.a);
        );
        out geom;
    `;

    try {
        const response = await axios.post('https://overpass-api.de/api/interpreter', query, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        
        console.log("Converting to GeoJSON...");
        const geojson = osmtogeojson(response.data);
        
        // Clean up GeoJSON to just retain the municipality name
        geojson.features = geojson.features.map(f => {
            return {
                type: 'Feature',
                properties: {
                    name: f.properties.name || "Desconocido",
                    id: f.id
                },
                geometry: f.geometry
            };
        });

        const outputPath = './public/campeche.geojson';
        fs.writeFileSync(outputPath, JSON.stringify(geojson));
        console.log("Successfully saved GeoJSON to " + outputPath);
    } catch (error) {
        console.error("Error fetching data:", error.message);
    }
}

getCampecheGeoJSON();
