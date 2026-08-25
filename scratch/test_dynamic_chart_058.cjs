const fs = require('fs');

const dynamicData = JSON.parse(fs.readFileSync('C:\\Users\\DELL\\Desktop\\Campeche\\scratch\\m4_058_data.json', 'utf8'));

const keys = Object.keys(dynamicData[0]);
let categoryKey = keys.find(k => !k.startsWith('col_')) || keys[0];

for (const key of keys) {
    if (key.startsWith('col_')) continue;
    const hasTextContent = dynamicData.some(r => {
        const rawVal = r[key];
        if (rawVal === null || rawVal === '' || rawVal === undefined) return false;
        const cleanVal = typeof rawVal === 'string' ? rawVal.replace(/,/g, '').trim() : rawVal;
        if (typeof cleanVal === 'string') {
            const upper = cleanVal.toUpperCase();
            if (upper === '-' || upper === 'ND' || upper === 'N/A' || upper === 'NA') return false;
        }
        return isNaN(Number(cleanVal));
    });
    if (hasTextContent) {
        categoryKey = key;
        break;
    }
}

console.log("categoryKey:", categoryKey);

const targetRow = dynamicData.find(r => {
    if (!r[categoryKey]) return false;
    const val = String(r[categoryKey]).toUpperCase().trim();
    return /^(TOTAL|ESTADO|TOTAL ESTATAL)$/i.test(val);
});

console.log("targetRow found:", targetRow ? "YES" : "NO");

const subCats = new Set();
const years = new Set();
const parsedStructure = [];

for (const key of keys) {
    if (key === categoryKey || key.startsWith('col_')) continue;
    let year = 'General';
    let subCat = 'General';

    if (key.includes(' - ')) {
        const parts = key.split(' - ').map(p => p.trim());
        if (parts[0].match(/20\d{2}/)) {
            year = parts[0];
            subCat = parts.slice(1).join(' - ');
        } else {
            subCat = key.trim();
        }
    } else if (key.match(/^20\d{2}$/)) {
        year = key.trim();
    } else {
        subCat = key.trim();
    }
    years.add(year);
    subCats.add(subCat);
    parsedStructure.push({ originalKey: key, year, subCat });
}

const uniqueSubCats = Array.from(subCats);
const cats = uniqueSubCats;
console.log("Cats (X-axis):", cats);

if (targetRow) {
    const series = Array.from(years).map(year => {
        return {
            name: year,
            data: cats.map(subCat => {
                const p = parsedStructure.find(ps => ps.year === year && ps.subCat === subCat);
                if (!p) return null;
                const rawVal = targetRow[p.originalKey];
                return rawVal;
            })
        };
    });
    console.log("Series:", JSON.stringify(series, null, 2));
}
