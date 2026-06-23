import React, { useMemo, useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import { Table, Form, Row, Col, ButtonGroup, Button, Modal, Card } from 'react-bootstrap';
type ChartType = 'bar' | 'bar-horizontal' | 'line' | 'area' | 'pie' | 'donut' | 'table';
interface Props {
    dynamicData: any[];
    metadataTabla?: any[];
    indicatorTitulo: string;
    selectedMunicipio?: string | null;
    isMunicipal?: boolean;
    defaultChartType?: string;
}

const DynamicChart = ({ dynamicData, metadataTabla, indicatorTitulo, selectedMunicipio, isMunicipal, defaultChartType }: Props) => {
    // We keep bar-horizontal in the state, and map it to 'bar' only when passing to ReactApexChart type prop
    const initialChartType = (defaultChartType as ChartType) || 'bar';
    const [chartType, setChartType] = useState<ChartType>(initialChartType);
    const [selectedYear, setSelectedYear] = useState<string>('Completo');
    const [selectedRightSubCat, setSelectedRightSubCat] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [activeTable, setActiveTable] = useState<any>(null);

    const handleTableClick = (table: any) => {
        setActiveTable(table);
        if (table.year !== 'Todos') {
            setShowModal(true);
        } else {
            setShowModal(false);
        }
    };

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

    // Generate tablesData for M3 custom indicators where dynamicData is an object (metadata_dinamica)
    const tablesData = useMemo(() => {
        let tables: any[] = [];
        if (dynamicData && !Array.isArray(dynamicData)) {
            Object.keys(dynamicData).forEach(year => {
                const yearData = (dynamicData as any)[year];
                if (yearData.tabla && yearData.tabla.length > 1) {
                    let headerIndex = 0;
                    for (let i = 0; i < Math.min(3, yearData.tabla.length); i++) {
                        const row = yearData.tabla[i];
                        if (row.some((c: string) => typeof c === 'string' && (c.toUpperCase().includes('MUNICIPIO') || c.toUpperCase().includes('TEMAS') || c.toUpperCase().includes('ORGANISMO') || c.toUpperCase().includes('CATEGORIA') || c.toUpperCase().includes('RACIONES') || c.toUpperCase().includes('CONVENIOS') || c.toUpperCase().includes('PROGRAMAS')))) {
                            headerIndex = i;
                            break;
                        }
                    }
                    tables.push({
                        year,
                        headers: yearData.tabla[headerIndex],
                        rows: yearData.tabla.slice(headerIndex + 1)
                    });
                }
            });
        }
        return tables;
    }, [dynamicData]);

    // 1. Analyze keys to extract categories, years, and subcategories (Sedes, Sexo, etc.)
    const { categoryKey, uniqueYears, uniqueSubCats, parsedStructure } = useMemo(() => {
        if (!dynamicData || !Array.isArray(dynamicData) || dynamicData.length === 0) {
            return { categoryKey: null, uniqueYears: [], uniqueSubCats: [], parsedStructure: [] };
        }

        const dataKeys = Object.keys(dynamicData[0]);
        let orderedKeys = dataKeys;
        
        // Use metadataTabla headers for the correct column order from Excel
        if (metadataTabla && metadataTabla.length > 0 && metadataTabla[0].headers && metadataTabla[0].headers.length > 0) {
            // Keep only headers that actually exist in the data keys
            orderedKeys = metadataTabla[0].headers.filter((h: string) => dataKeys.includes(h));
            // Add any dataKeys that weren't in metadataTabla just in case
            for (const dk of dataKeys) {
                if (!orderedKeys.includes(dk)) orderedKeys.push(dk);
            }
        }

        let categoryKey = orderedKeys[0];

        // Ensure categoryKey is the actual grouping column
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

        const years = new Set<string>();
        // If the data has an 'Año' column AND it is not the category itself, extract unique years
        const hasPerRowYear = dataKeys.includes('Año') && categoryKey !== 'Año';

        if (hasPerRowYear) {
            dynamicData.forEach(row => {
                if (row['Año']) years.add(String(row['Año']));
            });
            // If we found actual years, we can remove 'General' if it was added
            if (years.size > 1 && years.has('General')) {
                years.delete('General');
            }
        }

        const subCats = new Set<string>();
        const parsedStructure: Array<{ originalKey: string, year: string, subCat: string }> = [];

        for (const key of orderedKeys) {
            if (key === categoryKey || key.startsWith('col_') || key.toLowerCase() === 'notas' || key.toLowerCase() === 'fuente' || key === 'Año') continue;
            
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

            // If there's an 'Año' column (and it's not the category), we don't extract year from the key
            if (hasPerRowYear) {
                subCat = key.trim();
                // Add an entry for each actual year found in the data
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

        return {
            categoryKey,
            uniqueYears: Array.from(years).sort(),
            uniqueSubCats: Array.from(subCats),
            parsedStructure
        };
    }, [dynamicData]);

    // 2. Filter rows for municipal selection if active
    const { validData, chartNotes } = useMemo(() => {
        if (!dynamicData || !Array.isArray(dynamicData)) {
            return { validData: [], chartNotes: [] };
        }

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

    const isM3Custom = useMemo(() => {
        return indicatorTitulo && (
            indicatorTitulo.includes('Número de alumnos inscritos, egresados y titulados por carreras con mayor demanda') ||
            indicatorTitulo.includes('Número de localidades, escuelas y beneficiados por el Proyecto Útiles Jaguar') ||
            indicatorTitulo.includes('Medallas obtenidas') || 
            indicatorTitulo.includes('raciones alimentarias') || 
            indicatorTitulo.includes('CAPANNA') || 
            indicatorTitulo.includes('DIF estatal por programa') || 
            indicatorTitulo.includes('Convenios en materia cultural')
        );
    }, [indicatorTitulo]);

    if (!isM3Custom && (!validData.length || !categoryKey)) {
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

    const cleanTitle = (title: string) => {
        return title.replace(/,?\s*(?<!-)\b20\d{2}\.?$/, '').trim();
    };

    const getChartOptions = (chartTitle: string, cats: string[], isPieChart: boolean, isHorizontal: boolean = false): ApexCharts.ApexOptions => {
        const formatNumber = (val: any) => {
            if (val === null || val === undefined || val === '') return '';
            const num = Number(val);
            if (isNaN(num)) return String(val);
            const numStr = num.toLocaleString('es-MX', { maximumFractionDigits: 1 });
            return isInvestment ? `$${numStr}` : numStr;
        };

        const formatAxisNumber = (val: any) => {
            if (val === null || val === undefined || val === '') return '';
            const num = Number(val);
            if (isNaN(num)) return String(val);
            
            let numStr = '';
            if (Math.abs(num) >= 1000000) {
                numStr = (num / 1000000).toLocaleString('es-MX', { maximumFractionDigits: 1 }) + 'M';
            } else if (Math.abs(num) >= 1000) {
                numStr = (num / 1000).toLocaleString('es-MX', { maximumFractionDigits: 1 }) + 'k';
            } else {
                numStr = num.toLocaleString('es-MX', { maximumFractionDigits: 1 });
            }
            
            return isInvestment ? `$${numStr}` : numStr;
        };

        return {
            chart: {
                type: isPieChart ? 'pie' : (chartType === 'bar-horizontal' ? 'bar' : chartType as any),
                height: 350,
                toolbar: { show: !isPieChart },
                zoom: { enabled: false },
                animations: { enabled: true, speed: 500 },
                fontFamily: 'Inter, system-ui, sans-serif',
            },
            colors: PALETTE,
            title: {
                text: cleanTitle(chartTitle),
            align: 'left',
            style: { fontSize: '14px', fontWeight: 600, color: '#334155' }
        },
        plotOptions: {
            bar: {
                horizontal: isHorizontal,
                columnWidth: '55%',
                borderRadius: 4,
            },
        },
        fill: isPieChart
            ? { type: 'gradient', gradient: { shade: 'dark', type: 'diagonal2', opacityFrom: 1, opacityTo: 0.8, stops: [0, 100] } }
            : (chartType === 'line'
                ? { type: 'solid' }
                : { type: 'gradient', gradient: { shade: 'light', type: 'vertical', opacityFrom: 0.85, opacityTo: 0.25, stops: [0, 100] } }),
        dataLabels: { enabled: false },
        stroke: chartType === 'bar' || chartType === 'bar-horizontal' ? { show: false } : { show: true, curve: 'smooth', width: 2.5 },
            ...(isPieChart
                ? { labels: cats }
                : {
                    xaxis: {
                        categories: cats,
                        labels: {
                            style: { colors: '#94a3b8', fontSize: '11px', fontWeight: 500 },
                            rotate: (!isHorizontal && cats.length > 6) ? -30 : 0,
                            trim: false,
                            formatter: isHorizontal ? formatAxisNumber : undefined,
                        },
                    },
                    yaxis: {
                        labels: {
                            style: { colors: '#94a3b8', fontSize: '11px' },
                            formatter: !isHorizontal ? formatAxisNumber : undefined,
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
                formatter: formatNumber
            },
        },
    };
    };

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

        const options = getChartOptions(title || '', categories, isPie, chartType === 'bar-horizontal');
        const dynamicHeight = 350;

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

        const hasData = series.some((s: any) => s.data.some((val: any) => val !== null && val !== undefined && val !== 0 && !isNaN(val)));

        if (!hasData && selectedMunicipio) {
            return (
                <div className="bg-light rounded border border-slate-100 p-4 shadow-sm mb-4 d-flex justify-content-center align-items-center" style={{ minHeight: '350px', backgroundColor: '#f8f9fa' }}>
                    <h5 className="text-danger mb-0 fw-bold text-center">No existe información para este municipio</h5>
                </div>
            );
        }

        return (
            <ReactApexChart
                key={`${chartType}-${subCat}-${selectedYear}`}
                type={chartType === 'bar-horizontal' ? 'bar' : chartType as any}
                series={finalSeries}
                options={options}
                height={dynamicHeight}
            />
        );
    };

    const renderMunicipalTransposed = () => {
        const target = selectedMunicipio ? selectedMunicipio.toUpperCase().trim() : 'ESTADO';
        const totalRowRegex = /^(TOTAL|ESTADO|TOTAL ESTATAL)$/i;
        
        const targetRows = dynamicData.filter(r => {
            if (!r[categoryKey]) return false;
            const val = String(r[categoryKey]).toUpperCase().trim();
            return selectedMunicipio ? val === target : totalRowRegex.test(val);
        });

        if (targetRows.length === 0) {
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
            
            // Find the correct row for this year
            let rowForYear = targetRows.find(r => String(r['Año']) === String(year));
            if (!rowForYear) {
                // Fallback to the first row if no 'Año' column exists or no match
                rowForYear = targetRows[0];
            }

            return {
                name,
                data: cats.map(subCat => {
                    const p = parsedStructure.find(ps => ps.year === year && ps.subCat === subCat);
                    if (!p) return null;
                    const rawVal = rowForYear[p.originalKey];
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
        const options = getChartOptions(chartTitle, cats, isPie, true);
        const dynamicHeight = Math.max(350, cats.length * (filteredYears.length * 20 + 20));

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

        const hasData = series.some((s: any) => s.data.some((val: any) => val !== null && val !== undefined && val !== 0 && !isNaN(val)));

        if (!hasData && selectedMunicipio) {
            return (
                <div className="bg-light rounded border border-slate-100 p-4 shadow-sm mb-4 d-flex justify-content-center align-items-center" style={{ minHeight: '350px', backgroundColor: '#f8f9fa' }}>
                    <h5 className="text-danger mb-0 fw-bold">No existe información para este municipio</h5>
                </div>
            );
        }

        return (
            <div className="bg-white rounded border border-slate-100 p-4 shadow-sm mb-4">
                <ReactApexChart
                    key={`municipal-transposed-${selectedMunicipio || 'total'}-${selectedYear}`}
                    type={chartType === 'bar-horizontal' ? 'bar' : chartType as any}
                    series={finalSeries}
                    options={options}
                    height={dynamicHeight}
                />
            </div>
        );
    };

    const renderComplexHeaders = (headers: string[]) => {
        const hasFofisp = headers.some(h => String(h || '').includes('FOFISP'));
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
            let h = String(headers[i] || '');
            
            if (h.includes('FASP')) {
                const match = h.match(/\d{4}-\d{4}/);
                const year = match ? match[0] : 'Inversión';
                let colSpan = 1;
                if (i + 1 < headers.length && String(headers[i+1] || '').includes('FOFISP')) {
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
        if (!isM3Custom && (!categoryKey || validData.length === 0)) return null;

        // Custom render for M3-045
        if (indicatorTitulo && indicatorTitulo.includes('Número de alumnos inscritos, egresados y titulados por carreras con mayor demanda')) {
            // M3-045 has tables per year. 
            // We want to graph only 3 bars per year (Inscritos, Egresados, Titulados) based on the "TOTAL" row.
            // Render one chart per year.
            const categories = tablesData.map(t => t.year);
            const seriesMap = { 'Inscritos': [] as number[], 'Egresados': [] as number[], 'Titulados': [] as number[] };

            tablesData.forEach(table => {
                let totalRow = null;
                if (table.rows && table.rows.length > 0) {
                    totalRow = table.rows.find((r: any[]) => {
                        const first = String(r[0] || '').toUpperCase();
                        return first === 'TOTAL' || first === 'ESTADO';
                    });
                }
                
                if (totalRow) {
                    seriesMap['Inscritos'].push(Number(totalRow[1]) || 0);
                    seriesMap['Egresados'].push(Number(totalRow[2]) || 0);
                    seriesMap['Titulados'].push(Number(totalRow[3]) || 0);
                } else {
                    seriesMap['Inscritos'].push(0);
                    seriesMap['Egresados'].push(0);
                    seriesMap['Titulados'].push(0);
                }
            });

            const customSeries = [
                { name: 'Inscritos', data: seriesMap['Inscritos'] },
                { name: 'Egresados', data: seriesMap['Egresados'] },
                { name: 'Titulados', data: seriesMap['Titulados'] },
            ];

            return (
                <div className="mt-4">
                    <Card className="mb-4">
                        <Card.Header className="bg-light">
                            <h5 className="mb-0">Información por Ciclo Escolar</h5>
                        </Card.Header>
                        <Card.Body>
                            <ReactApexChart 
                                options={getChartOptions('', categories, false, chartType === 'bar-horizontal')} 
                                series={customSeries} 
                                type={chartType === 'area' || chartType === 'bar-horizontal' ? 'bar' : chartType as any} 
                                height={350} 
                            />
                            <div className="d-flex justify-content-center mt-4 gap-2 flex-wrap">
                                {tablesData.map((table, idx) => (
                                    <Button
                                        key={`btn-045-${idx}`}
                                        variant="outline-primary"
                                        size="sm"
                                        onClick={() => handleTableClick(table)}
                                    >
                                        Ver detalle {table.year}
                                    </Button>
                                ))}
                            </div>
                        </Card.Body>
                    </Card>
                </div>
            );
        }

        // Custom render for M3-058
        if (indicatorTitulo && indicatorTitulo.includes('Número de localidades, escuelas y beneficiados por el Proyecto Útiles Jaguar')) {
            // M3-058 has tables per year. 
            // 4 bars per year: Localidades, Escuelas, Beneficiarios Niñas, Beneficiarios Niños
            // If selectedMunicipio is active, filter to only that row. Otherwise, map "ESTADO" or "TOTAL" row.
            
            const isYearView = activeTable && activeTable.year !== 'Todos';
            let localData = isYearView ? tablesData.filter(t => t.year === activeTable.year) : tablesData;
            
            const categories = localData.map(t => t.year);
            const seriesMap = { 'Localidades': [], 'Escuelas': [], 'Niñas': [], 'Niños': [] } as Record<string, number[]>;
            
            localData.forEach(t => {
                let targetRow = null;
                if (t.rows && t.rows.length > 0) {
                    if (selectedMunicipio) {
                        // Find specific municipality row
                        targetRow = t.rows.find((r: any[]) => {
                            const first = String(r[0] || '').toUpperCase();
                            return first === selectedMunicipio.toUpperCase();
                        });
                    } else {
                        // Find TOTAL / ESTADO row
                        targetRow = t.rows.find((r: any[]) => {
                            const first = String(r[0] || '').toUpperCase();
                            return first === 'TOTAL' || first === 'ESTADO';
                        });
                    }
                }
                
                if (targetRow) {
                    seriesMap['Localidades'].push(Number(targetRow[1]) || 0);
                    seriesMap['Escuelas'].push(Number(targetRow[2]) || 0);
                    seriesMap['Niñas'].push(Number(targetRow[3]) || 0);
                    seriesMap['Niños'].push(Number(targetRow[4]) || 0);
                } else {
                    seriesMap['Localidades'].push(0);
                    seriesMap['Escuelas'].push(0);
                    seriesMap['Niñas'].push(0);
                    seriesMap['Niños'].push(0);
                }
            });

            const customSeries = Object.entries(seriesMap).map(([name, data]) => ({ name, data }));

            const seriesLocalidades = customSeries.filter(s => s.name === 'Localidades' || s.name === 'Escuelas');
            const hasDataLocalidades = seriesLocalidades.some(s => s.data.some(v => v !== null && v !== undefined && v !== 0 && !isNaN(v)));

            const seriesBeneficiarios = customSeries.filter(s => s.name === 'Niñas' || s.name === 'Niños');
            const hasDataBeneficiarios = seriesBeneficiarios.some(s => s.data.some(v => v !== null && v !== undefined && v !== 0 && !isNaN(v)));

            return (
                <div className="mt-4">
                    <Row className="mb-4">
                        <Col className="d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">
                                {isYearView ? `Información del Año ${activeTable.year}` : 'Información Completa'}
                                {selectedMunicipio && ` - ${selectedMunicipio}`}
                            </h5>
                            <div className="d-flex gap-2">
                                <Button
                                    variant={!isYearView ? "primary" : "outline-primary"}
                                    size="sm"
                                    onClick={() => handleTableClick({ year: 'Todos', rows: [], headers: [] })}
                                >
                                    Información Completa
                                </Button>
                                {tablesData.map((table, idx) => (
                                    <Button
                                        key={`btn-m3-058-${idx}`}
                                        variant={activeTable?.year === table.year ? "primary" : "outline-primary"}
                                        size="sm"
                                        onClick={() => handleTableClick(table)}
                                    >
                                        Ver Detalle {table.year !== 'Todos' ? table.year : ''}
                                    </Button>
                                ))}
                            </div>
                        </Col>
                    </Row>
                    
                    <Card className="mb-4">
                        <Card.Header className="bg-light">
                            <h6 className="mb-0">Localidades y Escuelas</h6>
                        </Card.Header>
                        <Card.Body>
                            {(!hasDataLocalidades && selectedMunicipio) ? (
                                <div className="bg-light rounded border p-4 shadow-sm d-flex justify-content-center align-items-center" style={{ minHeight: '350px', backgroundColor: '#f8f9fa' }}>
                                    <h5 className="text-danger mb-0 fw-bold text-center">No existe información para este municipio</h5>
                                </div>
                            ) : (
                                <ReactApexChart 
                                    options={getChartOptions('', categories, false, chartType === 'bar-horizontal')} 
                                    series={seriesLocalidades} 
                                    type={chartType === 'area' || chartType === 'bar-horizontal' ? 'bar' : chartType as any} 
                                    height={350} 
                                />
                            )}
                        </Card.Body>
                    </Card>

                    <Card>
                        <Card.Header className="bg-light">
                            <h6 className="mb-0">Beneficiarios</h6>
                        </Card.Header>
                        <Card.Body>
                            {(!hasDataBeneficiarios && selectedMunicipio) ? (
                                <div className="bg-light rounded border p-4 shadow-sm d-flex justify-content-center align-items-center" style={{ minHeight: '350px', backgroundColor: '#f8f9fa' }}>
                                    <h5 className="text-danger mb-0 fw-bold text-center">No existe información para este municipio</h5>
                                </div>
                            ) : (
                                <ReactApexChart 
                                    options={getChartOptions('', categories, false, chartType === 'bar-horizontal')} 
                                    series={seriesBeneficiarios} 
                                    type={chartType === 'area' || chartType === 'bar-horizontal' ? 'bar' : chartType as any} 
                                    height={350} 
                                />
                            )}
                        </Card.Body>
                    </Card>
                </div>
            );
        }

        // Custom render for M3-065
        if (indicatorTitulo && indicatorTitulo.includes('Viviendas edificadas en el Estado por organismo que otorga el financiamiento')) {
            // M3-065 has metadata_tabla_global
            // X-axis: Years (2021 to 2025)
            // Series: Organismos (INFONAVIT, FOVISSSTE, etc.)
            
            if (!validData || validData.length < 2) return null;

            const headerIndex = validData.findIndex(r => String(r[0] || '').toUpperCase() === 'ORGANISMO');
            if (headerIndex === -1) return null;

            const headers = validData[headerIndex] as string[];
            const categories = headers.slice(1).filter(h => h && h.toUpperCase() !== 'NOTAS');
            const customSeries: any[] = [];
            
            for (let i = headerIndex + 1; i < validData.length; i++) {
                const row = validData[i] as any[];
                const org = String(row[0] || '').toUpperCase();
                if (org && org !== 'TOTALES' && org !== 'TOTAL') {
                    const data = categories.map((_, idx) => Number(row[idx + 1]) || 0);
                    customSeries.push({ name: org, data });
                }
            }

            const tableObj = {
                year: 'Todos',
                headers: headers,
                rows: validData.slice(headerIndex + 1)
            };

            return (
                <div className="mt-4">
                    <Row className="mb-4">
                        <Col>
                            <h5 className="mb-0">Información Completa</h5>
                        </Col>
                    </Row>
                    <Card className="mb-4">
                        <Card.Body>
                            <ReactApexChart 
                                options={getChartOptions('', categories, false, chartType === 'bar-horizontal')} 
                                series={customSeries} 
                                type={chartType === 'area' || chartType === 'bar-horizontal' ? 'bar' : chartType as any} 
                                height={350} 
                            />
                        </Card.Body>
                    </Card>
                    
                    <Row className="mb-4">
                        <Col className="d-flex justify-content-center">
                            <Button 
                                variant="outline-primary"
                                size="sm"
                                onClick={() => handleTableClick(tableObj)}
                            >
                                Ver Detalle
                            </Button>
                        </Col>
                    </Row>
                </div>
            );
        }

        // Custom render for M3-089
        if (indicatorTitulo && indicatorTitulo.includes('raciones alimentarias')) {
            const localCategories = tablesData.map(t => t.year).sort();
            const targetName = selectedMunicipio ? selectedMunicipio : 'ESTADO';
            
            const extractSeriesForColumn = (searchWord: string) => {
                return tablesData.sort((a, b) => a.year.localeCompare(b.year)).map(t => {
                    if (!t.headers || !t.rows) return 0;
                    const idx = t.headers.findIndex((h: string) => h.toUpperCase().replace(/\s+/g, ' ').includes(searchWord.toUpperCase()));
                    if (idx === -1) return 0;
                    
                    const row = t.rows.find((r: any[]) => String(r[0] || '').toUpperCase().trim() === targetName.toUpperCase().trim());
                    if (row && row[idx] !== undefined) {
                        return Number(String(row[idx]).replace(/,/g, '')) || 0;
                    }
                    return 0;
                });
            };

            const seriesRaciones = [{
                name: 'Raciones Distribuidas',
                data: extractSeriesForColumn('RACIONES')
            }];

            const seriesBeneficiarios = [{
                name: 'Número de Beneficiarios',
                data: extractSeriesForColumn('BENEFICIARIOS')
            }];

            const hasDataRaciones = seriesRaciones[0].data.some(val => val !== null && val !== undefined && val !== 0 && !isNaN(val));
            const hasDataBeneficiarios = seriesBeneficiarios[0].data.some(val => val !== null && val !== undefined && val !== 0 && !isNaN(val));

            return (
                <div className="mt-4">
                    <Row className="mb-4">
                        <Col className="d-flex justify-content-center align-items-center">
                            <h5 className="mb-0">
                                {targetName === 'ESTADO' ? 'Total Estatal' : `Desglose: ${targetName}`}
                            </h5>
                        </Col>
                    </Row>
                    
                    <Row>
                        <Col lg={12} className="mb-4">
                            <h6 className="mb-3 text-muted fw-bold text-center">Raciones Distribuidas</h6>
                            <Card>
                                <Card.Body>
                                    {(!hasDataRaciones && selectedMunicipio) ? (
                                        <div className="bg-light rounded border p-4 shadow-sm d-flex justify-content-center align-items-center" style={{ minHeight: '350px', backgroundColor: '#f8f9fa' }}>
                                            <h5 className="text-danger mb-0 fw-bold text-center">No existe información para este municipio</h5>
                                        </div>
                                    ) : (
                                        <ReactApexChart 
                                            options={getChartOptions('', localCategories, false, true)} 
                                            series={seriesRaciones} 
                                            type="bar"
                                            height={350} 
                                        />
                                    )}
                                </Card.Body>
                            </Card>
                        </Col>
                        
                        <Col lg={12} className="mb-4">
                            <h6 className="mb-3 text-muted fw-bold text-center">Número de Beneficiarios</h6>
                            <Card>
                                <Card.Body>
                                    {(!hasDataBeneficiarios && selectedMunicipio) ? (
                                        <div className="bg-light rounded border p-4 shadow-sm d-flex justify-content-center align-items-center" style={{ minHeight: '350px', backgroundColor: '#f8f9fa' }}>
                                            <h5 className="text-danger mb-0 fw-bold text-center">No existe información para este municipio</h5>
                                        </div>
                                    ) : (
                                        <ReactApexChart 
                                            options={getChartOptions('', localCategories, false, true)} 
                                            series={seriesBeneficiarios} 
                                            type="bar"
                                            height={350} 
                                        />
                                    )}
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </div>
            );
        }

        // Custom render for M3-068, M3-095, M3-100, M3-104
        if (indicatorTitulo && (
            indicatorTitulo.includes('Medallas obtenidas') || 
            indicatorTitulo.includes('CAPANNA') || 
            indicatorTitulo.includes('atenciones psicológicas') || 
            indicatorTitulo.includes('DIF estatal por programa') || 
            indicatorTitulo.includes('Convenios en materia cultural')
        )) {
            let config = { seriesKeys: [] as string[], totalKey: 'TOTAL' };
            
            if (indicatorTitulo.includes('Medallas obtenidas')) {
                config = { seriesKeys: ['ORO', 'PLATA', 'BRONCE'], totalKey: 'TOTAL' };

            } else if (indicatorTitulo.includes('CAPANNA') || indicatorTitulo.includes('atenciones psicológicas')) {
                config = { seriesKeys: ['ACCIONES', 'BENEFICIARIOS'], totalKey: 'TOTAL' };
            } else if (indicatorTitulo.includes('DIF estatal por programa')) {
                config = { seriesKeys: ['BENEFICIARIOS'], totalKey: 'TOTAL' };
            } else if (indicatorTitulo.includes('Convenios en materia cultural')) {
                config = { seriesKeys: ['ESTATAL', 'FEDERAL', 'TOTAL'], totalKey: 'TOTAL' };
            }

            const isYearView = activeTable && activeTable.year !== 'Todos';
            let localData = [...tablesData].sort((a, b) => a.year.localeCompare(b.year));
            
            let categories: string[] = [];
            const seriesMap = {} as Record<string, number[]>;
            config.seriesKeys.forEach(k => seriesMap[k] = []);

            if (isYearView) {
                // Detail view for a specific year
                const table = localData.find(t => t.year === activeTable.year);
                if (table && table.rows && table.rows.length > 0) {
                    let headerIndices = {} as Record<string, number>;
                    if (table.headers && table.headers.length > 0) {
                        table.headers.forEach((h: string, i: number) => {
                            headerIndices[h.toUpperCase().trim()] = i;
                            if (h.toUpperCase().includes('ESPACIOS DE ALIMENTACIÓN')) {
                                headerIndices['NÚMERO DE ESPACIOS DE ALIMENTACIÓN'] = i;
                            }
                        });
                    }

                    // For detail view, we plot all rows EXCEPT the TOTAL row
                    table.rows.forEach((r: any[]) => {
                        const first = String(r[0] || '').toUpperCase();
                        const second = String(r[1] || '').toUpperCase();
                        const isTotalRow = first.includes(config.totalKey) || second.includes(config.totalKey) || first === 'NOTAS' || first.includes('FUENTE');
                        
                        if (!isTotalRow && String(r[0] || '').trim() !== '') {
                            categories.push(String(r[0])); // Category name (Deporte, Temas, etc.)
                            
                            config.seriesKeys.forEach(key => {
                                const idx = headerIndices[key];
                                if (idx !== undefined) {
                                    seriesMap[key].push(Number(r[idx]) || 0);
                                } else if (key === 'BENEFICIARIOS' && headerIndices['NÚMERO DE BENEFICIARIOS']) {
                                    seriesMap[key].push(Number(r[headerIndices['NÚMERO DE BENEFICIARIOS']]) || 0);
                                } else if (key === 'BENEFICIARIOS' && headerIndices['TOTAL BENEFICIARIOS']) {
                                    seriesMap[key].push(Number(r[headerIndices['TOTAL BENEFICIARIOS']]) || 0);
                                } else {
                                    let fallbackIdx = -1;
                                    if (key === 'ORO') fallbackIdx = 2;
                                    if (key === 'PLATA') fallbackIdx = 3;
                                    if (key === 'BRONCE') fallbackIdx = 4;
                                    if (key === 'ACCIONES') fallbackIdx = 1;
                                    if (key === 'BENEFICIARIOS') fallbackIdx = indicatorTitulo.includes('Programas, Centros') ? 1 : 2;
                                    if (key === 'ESTATAL') fallbackIdx = 1;
                                    if (key === 'FEDERAL') fallbackIdx = 2;
                                    if (key === 'TOTAL') fallbackIdx = 3;
                                    
                                    if (fallbackIdx !== -1) {
                                        seriesMap[key].push(Number(r[fallbackIdx]) || 0);
                                    } else {
                                        seriesMap[key].push(0);
                                    }
                                }
                            });
                        }
                    });
                }
            } else {
                // Global view: X-axis = Years, Series = TOTAL row
                categories = localData.map(t => t.year);
                
                localData.forEach(t => {
                    let targetRow = null;
                    let headerIndices = {} as Record<string, number>;
                    
                    if (t.headers && t.headers.length > 0) {
                        t.headers.forEach((h: string, i: number) => {
                            headerIndices[h.toUpperCase().trim()] = i;
                            if (h.toUpperCase().includes('ESPACIOS DE ALIMENTACIÓN')) {
                                headerIndices['NÚMERO DE ESPACIOS DE ALIMENTACIÓN'] = i;
                            }
                        });
                    }
                    
                    if (t.rows && t.rows.length > 0) {
                        targetRow = t.rows.find((r: any[]) => {
                            const first = String(r[0] || '').toUpperCase();
                            const second = String(r[1] || '').toUpperCase();
                            return first.includes(config.totalKey) || second.includes(config.totalKey);
                        });
                    }
                    
                    config.seriesKeys.forEach(key => {
                        const idx = headerIndices[key];
                        if (targetRow && idx !== undefined) {
                            seriesMap[key].push(Number(targetRow[idx]) || 0);
                        } else if (targetRow && key === 'BENEFICIARIOS' && headerIndices['NÚMERO DE BENEFICIARIOS']) {
                            seriesMap[key].push(Number(targetRow[headerIndices['NÚMERO DE BENEFICIARIOS']]) || 0);
                        } else if (targetRow && key === 'BENEFICIARIOS' && headerIndices['TOTAL BENEFICIARIOS']) {
                            seriesMap[key].push(Number(targetRow[headerIndices['TOTAL BENEFICIARIOS']]) || 0);
                        } else {
                            let fallbackIdx = -1;
                            if (key === 'ORO') fallbackIdx = 2;
                            if (key === 'PLATA') fallbackIdx = 3;
                            if (key === 'BRONCE') fallbackIdx = 4;
                            if (key === 'ACCIONES') fallbackIdx = 1;
                            if (key === 'BENEFICIARIOS') fallbackIdx = indicatorTitulo.includes('Programas, Centros') ? 1 : 2;
                            if (key === 'ESTATAL') fallbackIdx = 1;
                            if (key === 'FEDERAL') fallbackIdx = 2;
                            if (key === 'TOTAL') fallbackIdx = 3;
                            
                            if (targetRow && fallbackIdx !== -1) {
                                seriesMap[key].push(Number(targetRow[fallbackIdx]) || 0);
                            } else {
                                seriesMap[key].push(0);
                            }
                        }
                    });
                });
            }

            const customSeries = Object.entries(seriesMap).map(([name, data]) => ({ name, data }));

            return (
                <div className="mt-4">
                    <Row className="mb-4">
                        <Col className="d-flex justify-content-center align-items-center">
                            <h5 className="mb-0">
                                {isYearView ? `Detalle del Año ${activeTable.year}` : 'Información Completa'}
                            </h5>
                        </Col>
                    </Row>
                    
                    <Card>
                        <Card.Body>
                            <ReactApexChart 
                                options={getChartOptions('', categories, false, chartType === 'bar-horizontal')} 
                                series={customSeries} 
                                type={chartType === 'area' || chartType === 'bar-horizontal' ? 'bar' : chartType as any} 
                                height={350} 
                            />
                            <div className="d-flex justify-content-center mt-4 gap-2 flex-wrap">
                                <Button
                                    variant={!isYearView ? "primary" : "outline-primary"}
                                    size="sm"
                                    onClick={() => handleTableClick({ year: 'Todos', rows: [], headers: [] })}
                                >
                                    Información Completa
                                </Button>
                                {tablesData.sort((a, b) => a.year.localeCompare(b.year)).map((table, idx) => (
                                    <Button
                                        key={`btn-m3-group-${idx}`}
                                        variant={activeTable?.year === table.year ? "primary" : "outline-primary"}
                                        size="sm"
                                        onClick={() => handleTableClick(table)}
                                    >
                                        Ver Detalle {table.year !== 'Todos' ? table.year : ''}
                                    </Button>
                                ))}
                            </div>
                        </Card.Body>
                    </Card>
                </div>
            );
        }

        // Custom render for M5-015 (Tortuga Marina) to group by ESPECIE (Carey/Blanca) on X-axis and show NIDOS, HUEVOS, CRIAS as series
        if (indicatorTitulo && indicatorTitulo.includes('Tortuga Marina') && validData[0] && 'ESPECIE' in validData[0]) {
            let localData = validData;
            const cols = Object.keys(validData[0]).filter(k => k !== 'ESPECIE' && k !== 'Año');
            
            if (selectedYear === 'Completo') {
                const sums: any = {};
                for (const r of validData) {
                    const esp = r.ESPECIE;
                    if (!sums[esp]) sums[esp] = { ESPECIE: esp };
                    for (const col of cols) {
                        const val = Number(String(r[col] || 0).replace(/,/g, ''));
                        sums[esp][col] = (sums[esp][col] || 0) + (isNaN(val) ? 0 : val);
                    }
                }
                localData = Object.values(sums);
            } else {
                localData = validData.filter(r => String(r['Año']) === String(selectedYear));
            }

            const localCategories = localData.map(r => String(r.ESPECIE));
            const isPie = chartType === 'pie' || chartType === 'donut';
            const series = cols.map(col => ({
                name: col,
                data: localData.map(r => {
                    const rawVal = r[col];
                    if (rawVal === null || rawVal === '' || rawVal === undefined) return null;
                    const num = Number(typeof rawVal === 'string' ? rawVal.replace(/,/g, '').trim() : rawVal);
                    return isNaN(num) ? null : num;
                })
            }));

            let finalSeries: any = series;
            if (isPie) {
                finalSeries = series.length > 0 ? series[0].data : [];
            }

            const chartTitle = selectedYear === 'Completo' ? 'Información Completa' : selectedYear;
            const options = getChartOptions(chartTitle, localCategories, isPie, chartType === 'bar-horizontal');

            if (chartType === 'table') {
                return (
                    <div className="table-responsive mt-3">
                        <h6 className="mb-3 text-muted">{chartTitle}</h6>
                        <Table striped bordered hover size="sm" className="mb-0 text-muted" style={{ fontSize: '13px' }}>
                            <thead className="bg-light">
                                <tr>
                                    <th>Especie</th>
                                    {series.map((s: any) => <th key={s.name} className="text-end">{s.name}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {localCategories.map((cat: string, i: number) => (
                                    <tr key={cat}>
                                        <td className="fw-bold">{cat}</td>
                                        {series.map((s: any) => (
                                            <td key={s.name} className="text-end">
                                                {s.data[i] !== null && s.data[i] !== undefined ? s.data[i].toLocaleString('es-MX') : '-'}
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
                        key={`m5015-${selectedYear}`}
                        type={chartType === 'bar-horizontal' ? 'bar' : chartType as any}
                        series={finalSeries}
                        options={options}
                        height={350}
                    />
                </div>
            );
        }

        // Custom render for M5-020 (Cobertura de la energía eléctrica)
        if (indicatorTitulo && indicatorTitulo.includes('Cobertura de la energía eléctrica')) {
            const isPie = chartType === 'pie' || chartType === 'donut';
            const localCategories = validData.map(r => String(r['Año']));
            const series = [
                {
                    name: 'Estatal',
                    data: validData.map(r => Number(r['Estatal']) || 0)
                },
                {
                    name: 'Nacional',
                    data: validData.map(r => Number(r['Nacional']) || 0)
                }
            ];

            const chartTitle = 'Cobertura de la Energía Eléctrica (%)';
            const options = getChartOptions(chartTitle, localCategories, isPie, chartType === 'bar-horizontal');

            if (chartType === 'table') {
                return (
                    <div className="table-responsive mt-3">
                        <h6 className="mb-3 text-muted">{chartTitle}</h6>
                        <Table striped bordered hover size="sm" className="mb-0 text-muted" style={{ fontSize: '13px' }}>
                            <thead className="bg-light">
                                <tr>
                                    <th>Año</th>
                                    <th className="text-end">Estatal</th>
                                    <th className="text-end">Nacional</th>
                                </tr>
                            </thead>
                            <tbody>
                                {localCategories.map((cat: string, i: number) => (
                                    <tr key={cat}>
                                        <td className="fw-bold">{cat}</td>
                                        <td className="text-end">{series[0].data[i].toLocaleString('es-MX')}</td>
                                        <td className="text-end">{series[1].data[i].toLocaleString('es-MX')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                );
            }

            return (
                <div className="mb-4">
                    <ReactApexChart
                        key={`custom-m5-020-${chartType}`}
                        type={chartType === 'bar-horizontal' ? 'bar' : (chartType as any)}
                        series={isPie ? series[0].data : series}
                        options={options}
                        height={350}
                    />
                </div>
            );
        }

        // Custom render for M5-023 (Acciones de inspección y vigilancia en materia ambiental)
        if (indicatorTitulo && indicatorTitulo.includes('Acciones de inspección y vigilancia en materia ambiental')) {
            const normalizedData: any[] = [];
            
            dynamicData.forEach((row: any) => {
                const year = String(row['Año']);
                
                // First half (Standard)
                if (row['MATERIA AMBIENTAL Y/O BIENESTAR ANIMAL'] && row['ACCIONES'] !== undefined) {
                    normalizedData.push({
                        year,
                        cat: String(row['MATERIA AMBIENTAL Y/O BIENESTAR ANIMAL']).trim(),
                        val: Number(row['ACCIONES']) || 0
                    });
                }
                
                // Second half (Fallback for 2023 dual-table format)
                if (row['Residuos de manejo especial'] && row['19'] !== undefined) {
                    normalizedData.push({
                        year,
                        cat: String(row['Residuos de manejo especial']).trim(),
                        val: Number(row['19']) || 0
                    });
                }
            });

            // Base categories from 2025
            const data2025 = normalizedData.filter(r => r.year === '2025' && !r.cat.toUpperCase().includes('TOTAL'));
            let baseCategories = data2025.map(r => r.cat);
            
            // Fallback if 2025 is missing
            if (baseCategories.length === 0) {
                const allCats = new Set<string>();
                normalizedData.forEach(r => {
                    if (!r.cat.toUpperCase().includes('TOTAL')) allCats.add(r.cat);
                });
                baseCategories = Array.from(allCats);
            }

            const yearsToRender = selectedYear === 'Completo' ? ['2023', '2024', '2025'] : [selectedYear];
            
            const series = yearsToRender.map(year => {
                const yearData = normalizedData.filter(r => r.year === year);
                return {
                    name: year,
                    data: baseCategories.map(cat => {
                        const match = yearData.find(r => r.cat.toLowerCase() === cat.toLowerCase());
                        return match ? match.val : 0;
                    })
                };
            });

            const isPie = chartType === 'pie' || chartType === 'donut';
            const chartTitle = 'Acciones de Inspección y Vigilancia';
            
            let customOptions = getChartOptions(chartTitle, baseCategories, isPie, chartType === 'bar-horizontal');
            
            // Apply vertical labels
            customOptions = {
                ...customOptions,
                xaxis: {
                    ...customOptions.xaxis,
                    categories: baseCategories,
                    labels: {
                        ...(customOptions.xaxis?.labels || {}),
                        rotate: -90,
                        rotateAlways: true,
                        trim: false,
                        maxHeight: 250,
                        style: {
                            fontSize: '11px'
                        }
                    }
                }
            };

            if (chartType === 'table') {
                return (
                    <div className="table-responsive mt-3">
                        <h6 className="mb-3 text-muted">{chartTitle}</h6>
                        <Table striped bordered hover size="sm" className="mb-0 text-muted" style={{ fontSize: '13px' }}>
                            <thead className="bg-light">
                                <tr>
                                    <th>Categoría</th>
                                    {yearsToRender.map(y => <th key={y} className="text-end">{y}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {baseCategories.map((cat: string, i: number) => (
                                    <tr key={cat}>
                                        <td className="fw-bold">{cat}</td>
                                        {series.map(s => (
                                            <td key={s.name} className="text-end">{s.data[i].toLocaleString('es-MX')}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                );
            }

            return (
                <div className="mb-4">
                    <ReactApexChart
                        key={`custom-m5-023-${chartType}-${selectedYear}`}
                        type={chartType === 'bar-horizontal' ? 'bar' : (chartType as any)}
                        series={isPie ? series[0].data : series}
                        options={customOptions}
                        height={450}
                    />
                </div>
            );
        }

        // Custom render for M5-024 (Sanciones ambientales aplicadas por materia según tipo de sanción)
        if (indicatorTitulo && indicatorTitulo.includes('Sanciones ambientales aplicadas')) {
            const isPie = chartType === 'pie' || chartType === 'donut';
            
            // Get the 'Total' or 'TOTAL' row for each year
            const totalRows = dynamicData.filter((r: any) => 
                String(r['MATERIA']).toUpperCase() === 'TOTAL'
            );

            const yearsToRender = selectedYear === 'Completo' ? ['2023', '2024', '2025'] : [selectedYear];
            const localCategories = yearsToRender;

            const series = [
                {
                    name: 'Recomendación',
                    data: yearsToRender.map(y => {
                        const row = totalRows.find((r: any) => String(r['Año']) === y);
                        return row ? (Number(row['TIPO DE SANCIÓN - RECOMENDACIÓN']) || 0) : 0;
                    })
                },
                {
                    name: 'Amonestación',
                    data: yearsToRender.map(y => {
                        const row = totalRows.find((r: any) => String(r['Año']) === y);
                        return row ? (Number(row['TIPO DE SANCIÓN - AMONESTACIÓN']) || 0) : 0;
                    })
                },
                {
                    name: 'Económica',
                    data: yearsToRender.map(y => {
                        const row = totalRows.find((r: any) => String(r['Año']) === y);
                        return row ? (Number(row['TIPO DE SANCIÓN - ECONÓMICA']) || 0) : 0;
                    })
                }
            ];

            const chartTitle = 'Sanciones Ambientales Aplicadas por Tipo';
            const options = getChartOptions(chartTitle, localCategories, isPie, chartType === 'bar-horizontal');

            if (chartType === 'table') {
                return (
                    <div className="table-responsive mt-3">
                        <h6 className="mb-3 text-muted">{chartTitle}</h6>
                        <Table striped bordered hover size="sm" className="mb-0 text-muted" style={{ fontSize: '13px' }}>
                            <thead className="bg-light">
                                <tr>
                                    <th>Tipo de Sanción</th>
                                    {yearsToRender.map(y => <th key={y} className="text-end">{y}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {series.map((s) => (
                                    <tr key={s.name}>
                                        <td className="fw-bold">{s.name}</td>
                                        {s.data.map((val, i) => (
                                            <td key={i} className="text-end">{val.toLocaleString('es-MX')}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                );
            }

            return (
                <div className="mb-4">
                    <ReactApexChart
                        key={`custom-m5-024-${chartType}-${selectedYear}`}
                        type={chartType === 'bar-horizontal' ? 'bar' : (chartType as any)}
                        series={isPie ? series[0].data : series}
                        options={options}
                        height={350}
                    />
                </div>
            );
        }

        // Custom render for M5-017 (Áreas destinadas voluntariamente) to group by Año on X-axis and show SUPERFICIE as series
        if (indicatorTitulo && indicatorTitulo.includes('Áreas destinadas voluntariamente') && dynamicData[0] && 'SUPERFICIE (HA)' in dynamicData[0]) {
            // We want to graph the SUPERFICIE (HA) for EVERY year, regardless of selectedYear
            // dynamicData has rows like { TIPO: 'TOTAL', 'SUPERFICIE (HA)': 123, Año: '2024' }
            
            const localCategories = dynamicData.map(r => String(r['Año']));
            const isPie = chartType === 'pie' || chartType === 'donut';
            
            const series = [{
                name: 'Superficie (HA)',
                data: dynamicData.map(r => {
                    const rawVal = r['SUPERFICIE (HA)'];
                    if (rawVal === null || rawVal === '' || rawVal === undefined) return null;
                    const num = Number(typeof rawVal === 'string' ? String(rawVal).replace(/,/g, '').trim() : rawVal);
                    return isNaN(num) ? null : num;
                })
            }];

            let finalSeries: any = series;
            if (isPie) {
                finalSeries = series[0].data;
            }

            const chartTitle = 'Información Completa';
            const options = getChartOptions(chartTitle, localCategories, isPie, chartType === 'bar-horizontal');

            if (chartType === 'table') {
                return (
                    <div className="table-responsive mt-3">
                        <h6 className="mb-3 text-muted">{chartTitle}</h6>
                        <Table striped bordered hover size="sm" className="mb-0 text-muted" style={{ fontSize: '13px' }}>
                            <thead className="bg-light">
                                <tr>
                                    <th>Año</th>
                                    <th className="text-end">Superficie (HA)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {localCategories.map((cat: string, i: number) => (
                                    <tr key={cat}>
                                        <td className="fw-bold">{cat}</td>
                                        <td className="text-end">
                                            {series[0].data[i] !== null && series[0].data[i] !== undefined ? series[0].data[i].toLocaleString('es-MX') : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                );
            }

            return (
                <div className="bg-white rounded border border-slate-100 p-4 shadow-sm mb-4 text-center">
                    <ReactApexChart
                        key={`m5017-all-years`}
                        type={chartType === 'bar-horizontal' ? 'bar' : chartType as any}
                        series={finalSeries}
                        options={options}
                        height={350}
                    />
                </div>
            );
        }

        if (isMunicipal) {
            return renderMunicipalTransposed();
        }

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
        return uniqueSubCats.map(subCat => (
            <div key={subCat} className="bg-white rounded border border-slate-100 p-4 shadow-sm mb-4">
                {renderSingleChart(subCat, indicatorTitulo ? undefined : subCat)}
            </div>
        ));
    };

    return (
        <div className="dynamic-chart-wrapper">
            <h5 className="fw-bold mb-3" style={{ lineHeight: '1.4', color: '#9D2449' }}>
                {cleanTitle(indicatorTitulo || '')}{indicatorTitulo?.includes('Áreas destinadas voluntariamente') && !indicatorTitulo?.includes('Hectáreas') && !indicatorTitulo?.includes('Hectareas') ? ' (Hectáreas)' : ''}
            </h5>

            <Row className="mb-4 justify-content-between align-items-center">
                <Col xs={12} md="auto" className="mb-3 mb-md-0">
                    {uniqueYears.length > 0 && uniqueYears[0] !== 'General' && !(indicatorTitulo?.includes('Áreas destinadas voluntariamente')) && (
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

            {!isMunicipal && metadataTabla && metadataTabla.length > 0 && (
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
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
            {renderTableModal()}
        </div>
    );
};

export default DynamicChart;
