const axios = require('axios');
const osmtogeojson = require('osmtogeojson');
const fs = require('fs');
const path = require('path');

const query = `
[out:json][timeout:250];
area["name"="Campeche"]["admin_level"="4"]->.campeche;
relation["admin_level"="6"](area.campeche);
out body;
>;
out skel qt;
`;

async function fetchMap() {
    console.log("Fetching Campeche municipalities from Overpass API...");
    try {
        const response = await axios.post('https://overpass-api.de/api/interpreter', query, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            responseType: 'json'
        });
        
        console.log("Converting OSM data to GeoJSON...");
        const geojson = osmtogeojson(response.data);
        
        // Filter out non-polygon features and ensure names exist
        const features = geojson.features.filter(f => f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon')
            .map(f => {
                if (f.properties && f.properties.name) {
                    return f;
                }
                return null;
            }).filter(f => f !== null);
            
        const finalGeojson = {
            type: "FeatureCollection",
            features: features
        };
        
        const outputPath = path.join(__dirname, 'public', 'maps', 'campeche.geojson');
        fs.writeFileSync(outputPath, JSON.stringify(finalGeojson, null, 2));
        console.log(`Saved ${features.length} municipalities to ${outputPath}`);
    } catch (e) {
        console.error("Error fetching or processing map data:", e.message);
    }
}

fetchMap();
