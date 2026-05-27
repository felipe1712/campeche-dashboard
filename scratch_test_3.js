const categories = ["Administración de la Beneficencia Pública", "Colegio de Bachilleres"];
const seriesKeys = ["2023", "2024"];
const dynamicData = [
    { "2023": 10, "2024": 20, "Cat": "Administración de la Beneficencia Pública" },
    { "2023": 15, "2024": 25, "Cat": "Colegio de Bachilleres" }
];

const isHorizontal = true;
const categoryKey = "Cat";

const series = seriesKeys.map(key => ({
    name: key.replace('col_', 'Columna '),
    data: dynamicData.map((row, i) => {
        let catName = categoryKey ? String(row[categoryKey] || `Fila ${i+1}`) : `Fila ${i+1}`;
        if (!isHorizontal && catName.length > 30) {
            catName = catName.substring(0, 30) + '...';
        }
        return {
            x: catName,
            y: Number(row[key]) || 0
        };
    })
}));

console.log(JSON.stringify(series, null, 2));
