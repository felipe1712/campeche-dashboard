const fs = require('fs');

const dynamicData = [
    {
        "Notas": null,
        "TRAMPEO": 455,
        "MUNICIPIO": "CALAKMUL",
        "ACCIONES DE CONTROL": 400
    },
    {
        "Notas": null,
        "TRAMPEO": 72,
        "MUNICIPIO": "CALKINI",
        "ACCIONES DE CONTROL": 425
    },
    {
        "Notas": null,
        "TRAMPEO": 3392,
        "MUNICIPIO": "ESTADO",
        "ACCIONES DE CONTROL": 4357
    }
];

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
