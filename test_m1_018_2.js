const dynamicData = [
  { "Año": 2023, "PETICIONES": 100 },
  { "Año": 2024, "PETICIONES": 200 },
  { "Año": 2025, "PETICIONES": 300 }
];
const dataKeys = Object.keys(dynamicData[0]);
let categoryKey = 'Año';
let orderedKeys = dataKeys;

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
    if (key === categoryKey || key.startsWith('col_') || key.toLowerCase() === 'notas' || key.toLowerCase() === 'fuente' || key === 'Año') continue;
    
    let year = 'General';
    let subCat = 'General';
    
    // ... skipping complex string logic for simple PETICIONES key ...
    subCat = key.trim();
    
    if (hasPerRowYear) {
        subCat = key.trim();
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
console.log("uniqueYears:", Array.from(years));
console.log("uniqueSubCats:", Array.from(subCats));
console.log("parsedStructure:", parsedStructure);

const validData = dynamicData;
const categories = validData.map(row => String(row[categoryKey]));
console.log("categories:", categories);
