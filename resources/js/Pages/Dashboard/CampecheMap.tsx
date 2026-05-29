import React, { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';

interface CampecheMapProps {
    onMunicipioSelect: (nombre: string | null) => void;
    selectedMunicipio: string | null;
}

const CampecheMap: React.FC<CampecheMapProps> = ({ onMunicipioSelect, selectedMunicipio }) => {
    const [mapLoaded, setMapLoaded] = useState(false);

    useEffect(() => {
        fetch('/maps/campeche.geojson')
            .then((res) => res.json())
            .then((geoJson) => {
                echarts.registerMap('campeche', geoJson as any);
                setMapLoaded(true);
            })
            .catch((err) => console.error("Error loading Campeche GeoJSON:", err));
    }, []);

    if (!mapLoaded) return <div className="text-center p-5">Cargando mapa de Campeche...</div>;

    const options = {
        tooltip: {
            trigger: 'item',
            formatter: '{b}'
        },
        series: [
            {
                name: 'Municipios',
                type: 'map',
                map: 'campeche',
                nameProperty: 'NOMGEO',
                roam: true,
                zoom: 1.2,
                itemStyle: {
                    areaColor: '#e9ecef',
                    borderColor: '#adb5bd',
                    borderWidth: 1
                },
                emphasis: {
                    itemStyle: {
                        areaColor: '#9D2449', // Campeche institutional color
                        shadowOffsetX: 0,
                        shadowOffsetY: 0,
                        shadowBlur: 10,
                        borderWidth: 0,
                        shadowColor: 'rgba(0, 0, 0, 0.5)'
                    },
                    label: {
                        show: true,
                        color: '#fff',
                        fontWeight: 'bold'
                    }
                },
                select: {
                    itemStyle: {
                        areaColor: '#5D5D5D',
                    },
                    label: {
                        show: true,
                        color: '#fff'
                    }
                },
                label: {
                    show: false,
                    color: '#495057',
                    fontSize: 10,
                    formatter: '{b}'
                },
                data: selectedMunicipio ? [{ name: selectedMunicipio, selected: true }] : []
            }
        ]
    };

    const onEvents = {
        click: (params: any) => {
            if (params.name) {
                // Toggle logic: if clicked the same, deselect
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

export default CampecheMap;
