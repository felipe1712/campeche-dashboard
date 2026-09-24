const dynamicData = [
  { "PODER Y/U ORGANISMO": 2023, "PETICIONES": 100 },
  { "PODER Y/U ORGANISMO": 2024, "PETICIONES": 200 },
  { "PODER Y/U ORGANISMO": 2025, "PETICIONES": 300 }
];
const metadataTabla = [
  { headers: ["PODER Y/U ORGANISMO", "PETICIONES"] }
];

const dataKeys = Object.keys(dynamicData[0]);
let orderedKeys = dataKeys;
if (metadataTabla && metadataTabla.length > 0 && metadataTabla[0].headers) {
    orderedKeys = metadataTabla[0].headers.filter(h => dataKeys.includes(h));
    for (const dk of dataKeys) {
        if (!orderedKeys.includes(dk)) orderedKeys.push(dk);
    }
}
let categoryKey = orderedKeys[0];
for (const key of orderedKeys) {
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

const years = new Set();
const hasPerRowYear = dataKeys.includes('Año') && categoryKey !== 'Año';
if (hasPerRowYear) {
    dynamicData.forEach(row => {
        if (row['Año']) years.add(String(row['Año']));
    });
    if (years.size > 1 && years.has('General')) years.delete('General');
}

const subCats = new Set();
const parsedStructure = [];
for (const key of orderedKeys) {
    if (key === categoryKey || key === 'Año') continue;
    let year = 'General';
    let subCat = key.trim();
    if (hasPerRowYear) {
        Array.from(years).forEach(y => {
            parsedStructure.push({ originalKey: key, year: y, subCat });
        });
        subCats.add(subCat);
    } else {
        years.add(year);
        subCats.add(subCat);
        parsedStructure.push({ originalKey: key, year, subCat });
    }
}

const uniqueYears = Array.from(years).sort();
const uniqueSubCats = Array.from(subCats);
let validData = dynamicData.filter(r => r[categoryKey] !== null && String(r[categoryKey]).trim() !== '');

const renderSingleChart = (subCat) => {
    const seriesKeys = parsedStructure.filter(p => p.subCat === subCat);
    const filteredSeriesKeys = seriesKeys;
    if (filteredSeriesKeys.length === 0) return null;
    const series = filteredSeriesKeys.map(k => {
        const name = k.year === 'General' ? k.subCat : k.year;
        return {
            name: name,
            data: validData.map(row => {
                const rawVal = row[k.originalKey];
                if (rawVal === null || rawVal === '' || rawVal === undefined) return null;
                const val = typeof rawVal === 'string' ? rawVal.replace(/,/g, '').trim() : rawVal;
                const num = Number(val);
                return isNaN(num) ? null : num;
            })
        };
    });
    return series;
}

console.log("categoryKey:", categoryKey);
console.log("validData length:", validData.length);
console.log("parsedStructure:", parsedStructure);
console.log("uniqueSubCats:", uniqueSubCats);

let result = null;
if (uniqueSubCats.length <= 1) {
    const currentSubCat = uniqueSubCats[0] || 'General';
    result = renderSingleChart(currentSubCat);
}
console.log("Chart Series:", JSON.stringify(result));
