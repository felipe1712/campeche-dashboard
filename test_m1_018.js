const dynamicData = [
  { "Año": 2023, "PETICIONES": 100 },
  { "Año": 2024, "PETICIONES": 200 },
  { "Año": 2025, "PETICIONES": 300 }
];
const dataKeys = Object.keys(dynamicData[0]);
let orderedKeys = dataKeys;
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
console.log("categoryKey:", categoryKey);
