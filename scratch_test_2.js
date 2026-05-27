const dynamicData = [{"2023":"EXENCI\u00d3N ","2024":"EXENCI\u00d3N ","2025":"EXENCI\u00d3N ","col_3":"ORDINARIO","col_4":null,"col_6":"ORDINARIO ","col_7":null,"col_9":"ORDINARIO ","col_11":null,"TOTAL ACUMULADO":null,"ORGANISMO CENTRALIZADO  O ENTIDAD PARAESTATAL":null},{"2023":0,"2024":0,"2025":0,"col_3":0,"col_4":null,"col_6":1,"col_7":null,"col_9":0,"col_11":null,"TOTAL ACUMULADO":1,"ORGANISMO CENTRALIZADO  O ENTIDAD PARAESTATAL":"Administraci\u00f3n de la Beneficencia P\u00fablica "},{"2023":1,"2024":0,"2025":1,"col_3":0,"col_4":null,"col_6":0,"col_7":null,"col_9":0,"col_11":null,"TOTAL ACUMULADO":2,"ORGANISMO CENTRALIZADO  O ENTIDAD PARAESTATAL":"Administraci\u00f3n Portuaria Integral de Campeche, S.A. de C.V"}];

const firstRow = dynamicData[0];
const keys = Object.keys(firstRow);

let categoryKey = null;
let seriesKeys = [];

keys.forEach(key => {
    let hasNumber = false;
    let hasString = false;
    
    for (let i = 0; i < dynamicData.length; i++) {
        const val = dynamicData[i][key];
        if (val !== null && val !== undefined && val !== '') {
            if (!isNaN(Number(val))) {
                hasNumber = true;
            } else {
                hasString = true;
            }
        }
    }

    if (hasNumber) {
        seriesKeys.push(key);
    } else if (hasString && !categoryKey) {
        categoryKey = key;
    }
});

if (!categoryKey && keys.length > 0) {
    categoryKey = keys[0];
    seriesKeys = seriesKeys.filter(k => k !== categoryKey);
}

console.log("categoryKey:", categoryKey);
console.log("seriesKeys:", seriesKeys);

if (seriesKeys.length === 0) {
    console.log("No seriesKeys found! Returning null.");
} else {
    console.log("chartConfig generated successfully.");
}
