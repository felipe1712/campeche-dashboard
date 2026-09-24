import React, { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';

interface HeatmapData {
    name: string;
    value: number | null;
}

interface CampecheHeatmapProps {
    data: HeatmapData[];
    selectedMunicipio?: string | null;
    onMunicipioSelect?: (name: string | null) => void;
}

const CampecheHeatmap: React.FC<CampecheHeatmapProps> = ({ data, selectedMunicipio, onMunicipioSelect }) => {
    const [mapLoaded, setMapLoaded] = useState(false);

    useEffect(() => {
        Promise.all([
            fetch('/maps/campeche.geojson').then((res) => res.json()),
            fetch('/maps/vecinos.geojson').then((res) => res.json())
        ]).then(([campecheGeo, vecinosGeo]) => {
            vecinosGeo.features.forEach((f: any) => {
                f.properties.NOMGEO = f.properties.name;
                f.properties.isNeighbor = true;
            });
            
            const combinedGeo = {
                type: 'FeatureCollection',
                features: [...campecheGeo.features, ...vecinosGeo.features]
            };

            echarts.registerMap('campeche_region', combinedGeo as any);
            setMapLoaded(true);
        }).catch((err) => console.error("Error loading maps:", err));
    }, []);

    if (!mapLoaded) return <div className="text-center p-5">Cargando mapa de Campeche...</div>;

    const validValues = data.filter(d => d.value !== null).map(d => d.value as number);
    const maxVal = validValues.length > 0 ? Math.max(...validValues) : 100;
    const minVal = validValues.length > 0 ? Math.min(...validValues) : 0;

    const options = {
        tooltip: {
            trigger: 'item',
            formatter: (params: any) => {
                if (!params.name) return '';
                if (['Yucatǭn', 'Quintana Roo', 'Tabasco', 'Chiapas', 'Golfo de MǸxico'].includes(params.name)) return params.name;
                const val = params.value;
                if (val === null || val === undefined || isNaN(val)) {
                    return `<strong>${params.name}</strong><br/>Sin datos`;
                }
                return `<strong>${params.name}</strong><br/>${val.toLocaleString('es-MX')}`;
            }
        },
        visualMap: {
            left: 'right',
            top: 'bottom',
            min: minVal,
            max: maxVal === minVal ? maxVal + 1 : maxVal,
            inRange: {
                color: ['#ffeda0', '#fed976', '#feb24c', '#fd8d3c', '#fc4e2a', '#e31a1c', '#b10026']
            },
            text: ['Alto', 'Bajo'],
            calculable: true,
            show: validValues.length > 0
        },
        series: [
            {
                name: 'Municipios',
                type: 'map',
                map: 'campeche_region',
                nameProperty: 'NOMGEO',
                roam: true,
                center: [-90.4, 19.3], // Approximate geographic center of Campeche
                zoom: 3.5,
                selectedMode: 'single',
                itemStyle: {
                    borderColor: '#adb5bd',
                    borderWidth: 1
                },
                emphasis: {
                    itemStyle: {
                        shadowOffsetX: 0,
                        shadowOffsetY: 0,
                        shadowBlur: 10,
                        borderWidth: 0,
                        shadowColor: 'rgba(0, 0, 0, 0.5)'
                    },
                    label: {
                        show: true,
                        color: '#000',
                        fontWeight: 'bold'
                    }
                },
                select: {
                    itemStyle: {
                        borderColor: '#212529',
                        borderWidth: 3,
                        shadowColor: 'rgba(0,0,0,0.5)',
                        shadowBlur: 10
                    },
                    label: {
                        show: true,
                        color: '#000',
                        fontWeight: 'bold'
                    }
                },
                label: {
                    show: false,
                    color: '#495057',
                    fontSize: 10,
                    formatter: '{b}'
                },
                data: [
                    ...['Yucatǭn', 'Quintana Roo', 'Tabasco', 'Chiapas'].map(name => ({
                        name,
                        value: null,
                        itemStyle: { areaColor: '#f8fafc', borderColor: '#e2e8f0', borderWidth: 1 },
                        emphasis: { itemStyle: { areaColor: '#f8fafc', shadowBlur: 0 } },
                        select: { disabled: true },
                        label: { show: true, color: '#94a3b8', fontSize: 12, fontWeight: 'bold' }
                    })),
                    ...data.map(d => ({
                        name: d.name,
                        value: d.value,
                        selected: selectedMunicipio === d.name,
                        itemStyle: d.value === null || isNaN(d.value) ? { areaColor: '#e9ecef' } : undefined
                    }))
                ],
                markPoint: {
                    symbol: 'none',
                    data: [
                        {
                            coord: [-91.3, 20.0],
                            name: 'Golfo de MǸxico',
                            label: {
                                show: true,
                                formatter: '{b}',
                                color: '#60a5fa',
                                fontSize: 16,
                                fontStyle: 'italic',
                                fontWeight: 'bold'
                            }
                        }
                    ]
                }
            }
        ]
    };

    const onEvents = {
        click: (params: any) => {
            if (!onMunicipioSelect) return;
            if (['Yucatǭn', 'Quintana Roo', 'Tabasco', 'Chiapas', 'Golfo de MǸxico'].includes(params.name)) return;
            if (params.name) {
                if (selectedMunicipio === params.name) {
                    onMunicipioSelect(null);
                } else {
                    onMunicipioSelect(params.name);
                }
            }
        }
    };

    return (
        <div style={{ width: '100%', height: '500px', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <ReactECharts 
                option={options} 
                style={{ height: '100%', width: '100%' }} 
                onEvents={onEvents}
            />
        </div>
    );
};

export default CampecheHeatmap;
