import React, { useMemo, useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import { Table, Form, Row, Col, ButtonGroup, Button } from 'react-bootstrap';
type ChartType = 'bar' | 'line' | 'area' | 'pie' | 'donut' | 'table';
interface Props {
    dynamicData: any[];
    indicatorTitulo: string;
    selectedMunicipio?: string | null;
    isMunicipal?: boolean;
}

const DynamicChart = ({ dynamicData, indicatorTitulo, selectedMunicipio, isMunicipal }: Props) => {
    const [chartType, setChartType] = useState<ChartType>('bar');
    const [selectedYear, setSelectedYear] = useState<string>('Completo');
    const [selectedRightSubCat, setSelectedRightSubCat] = useState<string | null>(null);

    // 1. Analyze keys to extract categories, years, and subcategories (Sedes, Sexo, etc.)
    const { categoryKey, uniqueYears, uniqueSubCats, parsedStructure } = useMemo(() => {
        if (!dynamicData || dynamicData.length === 0) {
            return { categoryKey: null, uniqueYears: [], uniqueSubCats: [], parsedStructure: [] };
        }

        const keys = Object.keys(dynamicData[0]);
        // The category is usually the first column that contains text (e.g. MUNICIPIO, MODALIDAD)
        // We skip auto-generated 'col_' headers.
        let categoryKey = keys.find(k => !k.startsWith('col_')) || keys[0];
        for (const key of keys) {
            if (key.startsWith('col_')) continue;
            const hasTextContent = dynamicData.some(r => {
                const rawVal = r[key];
                if (rawVal === null || rawVal === '') return false;
                const cleanVal = typeof rawVal === 'string' ? rawVal.replace(/,/g, '').trim() : rawVal;
                return isNaN(Number(cleanVal));
            });
            if (hasTextContent) {
                categoryKey = key;
                break;
            }
        }

        const years = new Set<string>();
        const subCats = new Set<string>();
        const parsedStructure: Array<{ originalKey: string, year: string, subCat: string }> = [];

        for (const key of keys) {
            // Skip the category key and any empty/auto-generated header columns
            if (key === categoryKey || key.startsWith('col_')) continue;
            
            // Expected formats: "2023-2024 - SEDE CAMPECHE" or "2025" or "2024 - MUJERES"
            let year = 'General';
            let subCat = 'General';

            if (key.includes(' - ')) {
                const parts = key.split(' - ').map(p => p.trim());
                const yearIndex = parts.findIndex(p => /(20\d{2})/.test(p));
                
                if (yearIndex !== -1) {
                    year = parts[yearIndex];
                    const subCatParts = [...parts];
                    subCatParts.splice(yearIndex, 1);
                    
                    if (subCatParts.length === 2 && subCatParts[0].toUpperCase() === 'OFICINAS REGISTRALES') {
                        subCat = subCatParts[1];
                    } else {
                        subCat = subCatParts.filter(p => p).join(' - ');
                    }
                } else {
                    year = parts[0];
                    subCat = parts.slice(1).join(' - ');
                }
            } else {
                // Try to extract year embedded anywhere in the string
                const yearMatch = key.match(/(20\d{2}(?:\s*-\s*20\d{2})?)/);
                if (/^\d{4}(\-\d{4})?$/.test(key.trim())) {
                    year = key.trim();
                } else if (yearMatch) {
                    year = yearMatch[1];
                    subCat = key.replace(yearMatch[1], '').trim() || 'General';
                } else {
                    subCat = key.trim();
                }
            }

            years.add(year);
            subCats.add(subCat);
            parsedStructure.push({ originalKey: key, year, subCat });
        }

        return {
            categoryKey,
            uniqueYears: Array.from(years).sort(),
            uniqueSubCats: Array.from(subCats),
            parsedStructure
        };
    }, [dynamicData]);

    // 2. Filter rows for municipal selection if active
    const validData = useMemo(() => {
        if (isMunicipal && selectedMunicipio && categoryKey) {
            return dynamicData.filter((r: any) => 
                String(r[categoryKey]).toUpperCase().trim() === selectedMunicipio.toUpperCase().trim()
            );
        }
        return dynamicData.filter(r => r[categoryKey] !== null && String(r[categoryKey]).trim() !== '');
    }, [dynamicData, isMunicipal, selectedMunicipio, categoryKey]);

    const categories = useMemo(() => {
        if (!categoryKey) return [];
        return validData.map((row: any) => String(row[categoryKey]));
    }, [validData, categoryKey]);

    if (!validData.length || !categoryKey) {
        return (
            <div className="alert alert-info py-1 px-2 mb-2" style={{ fontSize: '12px' }}>
                <i className="ri-information-line me-1" /> Sin datos graficables.
            </div>
        );
    }

    // Palette handling
    let PALETTE = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#3b82f6'];
    if (indicatorTitulo && indicatorTitulo.startsWith('M1-')) {
        PALETTE = ['#8D5821', '#575756', '#BE8B63', '#A86A28', '#6E6E6D', '#D1A37B', '#70461B', '#414141', '#A67956'];
    }

    // 3. Helper to render a single chart given a subCat
    const renderSingleChart = (subCat: string, title?: string) => {
        const seriesKeys = parsedStructure.filter(p => p.subCat === subCat);
        
        const filteredSeriesKeys = selectedYear === 'Completo' 
            ? seriesKeys 
            : seriesKeys.filter(p => p.year === selectedYear);

        if (filteredSeriesKeys.length === 0) return null;

        const isPie = chartType === 'pie' || chartType === 'donut';
        
        const series = filteredSeriesKeys.map(k => {
            const name = k.year === 'General' ? k.subCat : k.year;
            return {
                name: name,
                data: validData.map(row => {
                    const rawVal = row[k.originalKey];
                    const cleanVal = typeof rawVal === 'string' ? rawVal.replace(/,/g, '').trim() : rawVal;
                    const val = Number(cleanVal);
                    return isNaN(val) ? 0 : val;
                })
            };
        });

        let finalSeries: any = series;
        if (isPie) {
            finalSeries = series.length > 0 ? series[0].data : [];
        }

        const options: ApexCharts.ApexOptions = {
            chart: {
                type: chartType,
                height: 350,
                toolbar: { show: !isPie },
                zoom: { enabled: false },
                animations: { enabled: true, speed: 500 },
                fontFamily: 'Inter, system-ui, sans-serif',
            },
            colors: PALETTE,
            title: {
                text: title,
                align: 'left',
                style: { fontSize: '14px', fontWeight: 600, color: '#334155' }
            },
            plotOptions: {
                bar: {
                    horizontal: false,
                    columnWidth: '55%',
                    borderRadius: 4,
                },
            },
            fill: isPie
                ? { type: 'gradient', gradient: { shade: 'dark', type: 'diagonal2', opacityFrom: 1, opacityTo: 0.8, stops: [0, 100] } }
                : chartType === 'line'
                    ? { type: 'solid' }
                    : { type: 'gradient', gradient: { shade: 'light', type: 'vertical', opacityFrom: 0.85, opacityTo: 0.25, stops: [0, 100] } },
            dataLabels: { enabled: false },
            stroke: chartType === 'bar' ? { show: false } : { show: true, curve: 'smooth', width: 2.5 },
            ...(isPie
                ? { labels: categories }
                : {
                    xaxis: {
                        categories,
                        labels: {
                            style: { colors: '#94a3b8', fontSize: '11px', fontWeight: 500 },
                            rotate: categories.length > 6 ? -30 : 0,
                            trim: true,
                        },
                    },
                    yaxis: {
                        labels: {
                            style: { colors: '#94a3b8', fontSize: '11px' },
                            formatter: (val: number) => val >= 1000 ? `${(val / 1000).toFixed(1)}k` : String(Math.round(val)),
                        },
                    },
                }
            ),
            legend: { position: 'right', offsetY: 20, fontSize: '12px' },
            tooltip: {
                theme: 'light',
                followCursor: true,
                shared: !isPie,
                intersect: false,
                y: { formatter: (val: number) => val.toLocaleString('es-MX') },
            },
        };

        if (chartType === 'table') {
            return (
                <div className="table-responsive mt-3" key={`${chartType}-${subCat}-${selectedYear}`}>
                    {title && <h6 className="mb-3 text-muted">{title}</h6>}
                    <Table striped bordered hover size="sm" className="mb-0 text-muted" style={{ fontSize: '13px' }}>
                        <thead className="bg-light">
                            <tr>
                                <th>{categoryKey}</th>
                                {series.map((s: any) => <th key={s.name} className="text-end">{s.name}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {categories.map((cat: string, i: number) => (
                                <tr key={cat}>
                                    <td className="fw-bold">{cat}</td>
                                    {series.map((s: any) => (
                                        <td key={s.name} className="text-end">
                                            {s.data[i] ? s.data[i].toLocaleString('es-MX') : '0'}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </div>
            );
        }

        return (
            <ReactApexChart
                key={`${chartType}-${subCat}-${selectedYear}`}
                type={chartType as any}
                series={finalSeries}
                options={options}
                height={350}
                width="100%"
            />
        );
    };

    // 4. Main render layout logic
    const renderCharts = () => {
        const totalSubCat = uniqueSubCats.find(s => s.toUpperCase() === 'TOTAL');
        const otherSubCats = uniqueSubCats.filter(s => s.toUpperCase() !== 'TOTAL');

        // Split view if we have TOTAL + other subcategories
        if (totalSubCat && otherSubCats.length > 0) {
            const currentRightSubCat = selectedRightSubCat && otherSubCats.includes(selectedRightSubCat) 
                ? selectedRightSubCat 
                : otherSubCats[0];

            return (
                <Row>
                    <Col lg={6} className="mb-4">
                        <div style={{ minHeight: '38px' }} className="d-flex align-items-center mb-2">
                            <h6 className="mb-0 text-muted fw-bold">General (Total)</h6>
                        </div>
                        {renderSingleChart(totalSubCat, undefined)}
                    </Col>
                    <Col lg={6} className="mb-4">
                        <div style={{ minHeight: '38px' }} className="d-flex justify-content-between align-items-center mb-2">
                            <h6 className="mb-0 text-muted fw-bold">Desglose por Categoría</h6>
                            {otherSubCats.length > 1 && (
                                <ButtonGroup size="sm">
                                    {otherSubCats.map(sc => (
                                        <Button
                                            key={sc}
                                            variant={currentRightSubCat === sc ? 'primary' : 'outline-primary'}
                                            onClick={() => setSelectedRightSubCat(sc)}
                                        >
                                            {sc}
                                        </Button>
                                    ))}
                                </ButtonGroup>
                            )}
                        </div>
                        {renderSingleChart(currentRightSubCat, undefined)}
                    </Col>
                </Row>
            );
        }

        // View with buttons when there are multiple subcategories but no TOTAL
        if (!totalSubCat && uniqueSubCats.length > 1) {
            const currentSubCat = selectedRightSubCat && uniqueSubCats.includes(selectedRightSubCat) 
                ? selectedRightSubCat 
                : uniqueSubCats[0];

            return (
                <div className="mb-4">
                    <div style={{ minHeight: '38px' }} className="d-flex justify-content-between align-items-center mb-2">
                        <h6 className="mb-0 text-muted fw-bold">Desglose por Categoría</h6>
                        <ButtonGroup size="sm">
                            {uniqueSubCats.map(sc => (
                                <Button
                                    key={sc}
                                    variant={currentSubCat === sc ? 'primary' : 'outline-primary'}
                                    onClick={() => setSelectedRightSubCat(sc)}
                                >
                                    {sc}
                                </Button>
                            ))}
                        </ButtonGroup>
                    </div>
                    {renderSingleChart(currentSubCat, undefined)}
                </div>
            );
        }

        // Sequential fallback view
        return uniqueSubCats.map((subCat) => (
            <div key={subCat} className="mb-4">
                {renderSingleChart(subCat, subCat !== 'General' ? subCat : undefined)}
            </div>
        ));
    };

    return (
        <div className="dynamic-chart-wrapper">
            <h5 className="fw-bold mb-3" style={{ lineHeight: '1.4', color: '#9D2449' }}>
                {indicatorTitulo}
            </h5>

            <Row className="mb-4 justify-content-between align-items-center">
                <Col xs={12} md="auto" className="mb-3 mb-md-0">
                    {uniqueYears.length > 0 && uniqueYears[0] !== 'General' && (
                        <ButtonGroup size="sm" className="shadow-sm">
                            <Button 
                                variant={selectedYear === 'Completo' ? 'primary' : 'outline-primary'}
                                onClick={() => setSelectedYear('Completo')}
                            >
                                Información Completa
                            </Button>
                            {uniqueYears.map(year => (
                                <Button 
                                    key={year}
                                    variant={selectedYear === year ? 'primary' : 'outline-primary'}
                                    onClick={() => setSelectedYear(year)}
                                >
                                    {year}
                                </Button>
                            ))}
                        </ButtonGroup>
                    )}
                </Col>
                <Col xs="auto">
                    <Form.Select
                        size="sm"
                        value={chartType}
                        onChange={(e) => setChartType(e.target.value as ChartType)}
                        className="w-auto shadow-sm"
                    >
                        <option value="bar">Gráfica de Barras</option>
                        <option value="line">Gráfica de Líneas</option>
                        <option value="area">Gráfica de Área</option>
                        <option value="pie">Gráfica de Pastel</option>
                        <option value="donut">Gráfica de Dona</option>
                        <option value="table">Tabla de Datos</option>
                    </Form.Select>
                </Col>
            </Row>

            <div className="charts-container">
                {renderCharts()}
            </div>
        </div>
    );
};

export default DynamicChart;
