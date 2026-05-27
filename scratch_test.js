const dynamicData = [
  {
    "col_3": null,
    "col_4": null,
    "col_5": null,
    "col_6": null,
    "col_7": null,
    "col_8": null,
    "col_9": null,
    "col_10": null,
    "col_11": null,
    "IMPORTE (PESOS)": 12183900819,
    "CONCEPTO/SUBCONCEPTO": "Gasto programable"
  },
  {
    "col_3": null,
    "col_4": null,
    "col_5": null,
    "col_6": null,
    "col_7": null,
    "col_8": null,
    "col_9": null,
    "col_10": null,
    "col_11": null,
    "IMPORTE (PESOS)": 1448557428,
    "CONCEPTO/SUBCONCEPTO": "1 Gobierno Honesto y Transparente"
  }
];

const firstRow = dynamicData[0];
const keys = Object.keys(firstRow);

let categoryKey = null;
let seriesKeys = [];

keys.forEach(key => {
    const val = firstRow[key];
    if (typeof val === 'string' && isNaN(Number(val)) && !categoryKey) {
        categoryKey = key;
    } else if (val !== null && val !== undefined) {
        if (!isNaN(Number(val))) {
            seriesKeys.push(key);
        }
    }
});

if (!categoryKey && keys.length > 0) {
    categoryKey = keys[0];
    seriesKeys = seriesKeys.filter(k => k !== categoryKey);
}

console.log("categoryKey:", categoryKey);
console.log("seriesKeys:", seriesKeys);

const categories = dynamicData.map((row, i) => categoryKey ? (row[categoryKey] || `Fila ${i+1}`) : `Fila ${i+1}`);
console.log("categories:", categories);

const series = seriesKeys.map(key => ({
    name: key.replace('col_', 'Columna '),
    data: dynamicData.map(row => Number(row[key]) || 0)
}));
console.log("series:", JSON.stringify(series, null, 2));
