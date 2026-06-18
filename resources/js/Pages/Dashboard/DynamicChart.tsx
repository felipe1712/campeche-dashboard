import React, { useMemo, useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import { Table, Form, Row, Col, ButtonGroup, Button, Modal } from 'react-bootstrap';
type ChartType = 'bar' | 'line' | 'area' | 'pie' | 'donut' | 'table';
interface Props {
    dynamicData: any[];
    metadataTabla?: any[];
    indicatorTitulo: string;
    selectedMunicipio?: string | null;
    isMunicipal?: boolean;
}

const DynamicChart = ({ dynamicData, metadataTabla, indicatorTitulo, selectedMunicipio, isMunicipal }: Props) => {
    const [chartType, setChartType] = useState<ChartType>('bar');
    const [selectedYear, setSelectedYear] = useState<string>('Completo');
    const [selectedRightSubCat, setSelectedRightSubCat] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [activeTable, setActiveTable] = useState<any>(null);

    const isInvestment = useMemo(() => {
        const lowerIndicator = indicatorTitulo?.toLowerCase() || '';
        const lowerTable = activeTable?.title?.toLowerCase() || '';
        return lowerIndicator.includes('inversión') || lowerIndicator.includes('inversion') || 
               lowerTable.includes('inversión') || lowerTable.includes('inversion');
    }, [indicatorTitulo, activeTable]);

    const formatCurrency = (val: any) => {
        if (!isInvestment || val === null || val === undefined || val === '') return val;
        const num = Number(val);
        if (!isNaN(num) && val.toString().trim() !== '') {
            return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(num);
        }
        return val;
    };

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
    const { validData, chartNotes } = useMemo(() => {
        const notes: string[] = [];
        const isNote = (val: string) => /^(?:[a-zA-Z]\/|Nota:|Fuente:|\*)/i.test(val.trim());

        let filtered = dynamicData.filter(r => r[categoryKey] !== null && String(r[categoryKey]).trim() !== '');

        if (isMunicipal && selectedMunicipio && categoryKey) {
            filtered = filtered.filter((r: any) => 
                String(r[categoryKey]).toUpperCase().trim() === selectedMunicipio.toUpperCase().trim()
            );
        }

        const finalData = [];
        for (const r of filtered) {
            const catVal = String(r[categoryKey]);
            if (isNote(catVal)) {
                notes.push(catVal);
            } else {
                finalData.push(r);
            }
        }
        
        return { validData: finalData, chartNotes: notes };
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
                    if (rawVal === null || rawVal === '' || rawVal === undefined) return null;
                    const val = typeof rawVal === 'string' ? rawVal.replace(/,/g, '').trim() : rawVal;
                    if (typeof val === 'string') {
                        const upper = val.toUpperCase();
                        if (upper === '-' || upper === 'ND' || upper === 'N/A' || upper === 'NA') return null;
                    }
                    const num = Number(val);
                    return isNaN(num) ? null : num;
                })
            };
        });

        let finalSeries: any = series;
        if (isPie) {
            finalSeries = series.length > 0 ? series[0].data : [];
        }

        const getChartOptions = (chartTitle: string, cats: string[], isPieChart: boolean): ApexCharts.ApexOptions => ({
            chart: {
                type: chartType,
                height: 350,
                toolbar: { show: !isPieChart },
                zoom: { enabled: false },
                animations: { enabled: true, speed: 500 },
                fontFamily: 'Inter, system-ui, sans-serif',
            },
            colors: PALETTE,
            title: {
                text: chartTitle,
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
            fill: isPieChart
                ? { type: 'gradient', gradient: { shade: 'dark', type: 'diagonal2', opacityFrom: 1, opacityTo: 0.8, stops: [0, 100] } }
                : chartType === 'line'
                    ? { type: 'solid' }
                    : { type: 'gradient', gradient: { shade: 'light', type: 'vertical', opacityFrom: 0.85, opacityTo: 0.25, stops: [0, 100] } },
            dataLabels: { enabled: false },
            stroke: chartType === 'bar' ? { show: false } : { show: true, curve: 'smooth', width: 2.5 },
            ...(isPieChart
                ? { labels: cats }
                : {
                    xaxis: {
                        categories: cats,
                        labels: {
                            style: { colors: '#94a3b8', fontSize: '11px', fontWeight: 500 },
                            rotate: cats.length > 6 ? -30 : 0,
                            trim: true,
                        },
                    },
                    yaxis: {
                        labels: {
                            style: { colors: '#94a3b8', fontSize: '11px' },
                            formatter: (val: number) => {
                                if (isInvestment) {
                                    if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
                                    if (val >= 1000) return `$${(val / 1000).toFixed(0)}k`;
                                    return `$${val}`;
                                }
                                if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
                                if (val >= 1000) return (val / 1000).toFixed(0) + 'k';
                                return val.toString();
                            },
                        },
                    },
                }
            ),
            legend: { position: 'right', offsetY: 20, fontSize: '12px' },
            tooltip: {
                theme: 'light',
                followCursor: true,
                shared: !isPieChart,
                intersect: false,
                y: { 
                    formatter: (val: number) => val !== null && val !== undefined ? (isInvestment ? `$${val.toLocaleString('es-MX')}` : val.toLocaleString('es-MX')) : 'N/A' 
                },
            },
        });

        const options = getChartOptions(title || '', categories, isPie);

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
                                            {s.data[i] !== null && s.data[i] !== undefined ? (isInvestment ? `$${s.data[i].toLocaleString('es-MX')}` : s.data[i].toLocaleString('es-MX')) : '-'}
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
            />
        );
    };

    const renderMunicipalTransposed = () => {
        const target = selectedMunicipio ? selectedMunicipio.toUpperCase().trim() : 'ESTADO';
        const totalRowRegex = /^(TOTAL|ESTADO|TOTAL ESTATAL)$/i;
        
        const targetRow = dynamicData.find(r => {
            if (!r[categoryKey]) return false;
            const val = String(r[categoryKey]).toUpperCase().trim();
            return selectedMunicipio ? val === target : totalRowRegex.test(val);
        });

        if (!targetRow) {
            return (
                <div className="alert alert-warning py-1 px-2 mb-2" style={{ fontSize: '12px' }}>
                    <i className="ri-alert-line me-1" /> No se encontró la fila {target}.
                </div>
            );
        }

        const cats = Array.from(uniqueSubCats);
        const filteredYears = selectedYear === 'Completo' ? Array.from(uniqueYears) : [selectedYear];
        
        const series = filteredYears.map(year => {
            const name = year === 'General' ? (selectedMunicipio || 'TOTAL ESTATAL') : year;
            return {
                name,
                data: cats.map(subCat => {
                    const p = parsedStructure.find(ps => ps.year === year && ps.subCat === subCat);
                    if (!p) return null;
                    const rawVal = targetRow[p.originalKey];
                    if (rawVal === null || rawVal === '' || rawVal === undefined) return null;
                    const val = typeof rawVal === 'string' ? rawVal.replace(/,/g, '').trim() : rawVal;
                    if (typeof val === 'string') {
                        const upper = val.toUpperCase();
                        if (upper === '-' || upper === 'ND' || upper === 'N/A' || upper === 'NA') return null;
                    }
                    const num = Number(val);
                    return isNaN(num) ? null : num;
                })
            };
        });

        const isPie = chartType === 'pie' || chartType === 'donut';
        let finalSeries: any = series;
        if (isPie) {
            finalSeries = series.length > 0 ? series[0].data : [];
        }

        const chartTitle = selectedMunicipio || 'TOTAL ESTATAL';
        const options = getChartOptions(chartTitle, cats, isPie);

        if (chartType === 'table') {
            return (
                <div className="table-responsive mt-3">
                    <h6 className="mb-3 text-muted">{chartTitle}</h6>
                    <Table striped bordered hover size="sm" className="mb-0 text-muted" style={{ fontSize: '13px' }}>
                        <thead className="bg-light">
                            <tr>
                                <th>Concepto</th>
                                {series.map((s: any) => <th key={s.name} className="text-end">{s.name}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {cats.map((cat: string, i: number) => (
                                <tr key={cat}>
                                    <td className="fw-bold">{cat}</td>
                                    {series.map((s: any) => (
                                        <td key={s.name} className="text-end">
                                            {s.data[i] !== null && s.data[i] !== undefined ? (isInvestment ? `$${s.data[i].toLocaleString('es-MX')}` : s.data[i].toLocaleString('es-MX')) : '-'}
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
            <div className="bg-white rounded border border-slate-100 p-4 shadow-sm mb-4">
                <ReactApexChart
                    key={`municipal-transposed-${selectedMunicipio || 'total'}-${selectedYear}`}
                    type={chartType as any}
                    series={finalSeries}
                    options={options}
                    height={350}
                />
            </div>
        );
    };

    const renderComplexHeaders = (headers: string[]) => {
        const hasFofisp = headers.some(h => h.includes('FOFISP'));
        if (!hasFofisp) {
            return (
                <tr>
                    {headers.map((h: string, i: number) => <th key={i}>{h}</th>)}
                </tr>
            );
        }

        let topRow = [];
        let bottomRow = [];
        
        for (let i = 0; i < headers.length; i++) {
            let h = headers[i];
            
            if (h.includes('FASP')) {
                const match = h.match(/\d{4}-\d{4}/);
                const year = match ? match[0] : 'Inversión';
                let colSpan = 1;
                if (i + 1 < headers.length && headers[i+1].includes('FOFISP')) {
                    colSpan = 2;
                }
                topRow.push(<th key={`top-${i}`} colSpan={colSpan} className="text-center bg-light border-bottom-0">{year}</th>);
                bottomRow.push(<th key={`bot-${i}`} className="text-center bg-light text-muted" style={{fontSize: '0.85em'}}>FASP</th>);
            } else if (h.includes('FOFISP')) {
                bottomRow.push(<th key={`bot-${i}`} className="text-center bg-light text-muted" style={{fontSize: '0.85em'}}>FOFISP</th>);
            } else {
                topRow.push(<th key={`top-${i}`} rowSpan={2} className="align-middle text-center bg-light">{h}</th>);
            }
        }

        return (
            <>
                <tr>{topRow}</tr>
                {bottomRow.length > 0 && <tr>{bottomRow}</tr>}
            </>
        );
    };

    const renderTableModal = () => {
        if (!activeTable) return null;
        return (
            <Modal show={showModal} onHide={() => setShowModal(false)} size="xl" centered>
                <Modal.Header closeButton className="bg-light">
                    <Modal.Title className="fs-5 text-primary">
                        <i className="ri-table-line me-2 align-middle"></i>
                        {indicatorTitulo} - {activeTable.year !== 'Todos' ? activeTable.year : ''}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-0">
                    <div className="table-responsive">
                        <Table striped bordered hover className="mb-0" style={{ fontSize: '13px' }}>
                            <thead className="bg-light">
                                {renderComplexHeaders(activeTable.headers || [])}
                            </thead>
                            <tbody>
                                {activeTable.rows?.map((row: any[], i: number) => (
                                    <tr key={i}>
                                        {row.map((cell: any, j: number) => (
                                            <td key={j}>{j > 0 ? formatCurrency(cell) : cell}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>Cerrar</Button>
                </Modal.Footer>
            </Modal>
        );
    };

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

        if (uniqueSubCats.length <= 1) {
            const currentSubCat = uniqueSubCats[0] || 'General';
            return (
                <div>
                    {renderSingleChart(currentSubCat, undefined)}
                </div>
            );
        }

        // Sequential fallback view
        return isMunicipal ? (
                renderMunicipalTransposed()
            ) : (
                uniqueSubCats.map(subCat => (
                    <div key={subCat} className="bg-white rounded border border-slate-100 p-4 shadow-sm mb-4">
                        {renderSingleChart(subCat, indicatorTitulo ? undefined : subCat)}
                    </div>
                ))
            );
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
            {chartNotes.length > 0 && (
                <div className="mt-3 text-start">
                    {chartNotes.map((note, idx) => (
                        <p key={idx} className="text-muted mb-1" style={{ fontSize: '0.85rem' }}>
                            {note}
                        </p>
                    ))}
                </div>
            )}

            {metadataTabla && metadataTabla.length > 0 && (
                <div className={`mt-4 ${validData.length > 0 && categoryKey ? 'pt-3 border-top' : ''} text-center`}>
                    {validData.length > 0 && categoryKey ? (
                        <>
                            <div className="d-flex flex-wrap justify-content-center gap-2 mb-3">
                                {metadataTabla.map((table: any, idx: number) => (
                                    <Button 
                                        key={idx} 
                                        variant="outline-primary"
                                        onClick={() => {
                                            setActiveTable(table);
                                            setShowModal(true);
                                        }}
                                    >
                                        Ver Detalle {table.year !== 'Todos' ? table.year : ''}
                                    </Button>
                                ))}
                            </div>
                            {renderTableModal()}
                        </>
                    ) : (
                        <div className="text-start">
                            <div className="text-muted fs-13 mb-3">
                                <i className="ri-information-line align-middle me-1"></i>
                                Información detallada del indicador:
                            </div>
                            <div className="table-responsive">
                                <Table striped bordered hover className="mb-0" style={{ fontSize: '13px' }}>
                                    <thead className="bg-light">
                                        {renderComplexHeaders(metadataTabla[0]?.headers || [])}
                                    </thead>
                                    <tbody>
                                        {metadataTabla[0]?.rows?.map((row: any[], i: number) => (
                                            <tr key={i}>
                                                {row.map((cell: any, j: number) => (
                                                    <td key={j}>{j > 0 ? formatCurrency(cell) : cell}</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>
                            
                            {metadataTabla.length > 1 && (
                                <div className="mt-3 text-center">
                                    <p className="text-muted small mb-2">Ver información de otros años:</p>
                                    <div className="d-flex flex-wrap justify-content-center gap-2">
                                        {metadataTabla.slice(1).map((table: any, idx: number) => (
                                            <Button 
                                                key={idx} 
                                                variant="outline-primary"
                                                onClick={() => {
                                                    setActiveTable(table);
                                                    setShowModal(true);
                                                }}
                                            >
                                                Ver Detalle {table.year !== 'Todos' ? table.year : ''}
                                            </Button>
                                        ))}
                                    </div>
                                    {renderTableModal()}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default DynamicChart;
