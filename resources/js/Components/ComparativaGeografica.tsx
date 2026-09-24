import React, { useState, useMemo, useEffect } from 'react';
import { Card, Col, Row, Form, Button } from 'react-bootstrap';
import { router, usePage } from '@inertiajs/react';
import CampecheHeatmap from './CampecheHeatmap';
import DynamicChart from '../Pages/Dashboard/DynamicChart';

export default function ComparativaGeografica({ indicators }: { indicators: any[] }) {
    const { url } = usePage();
    const { missions } = usePage<any>().props;
    
    // Parse current mision from url query string
    const queryMision = useMemo(() => {
        try {
            const params = new URLSearchParams(window.location.search);
            return params.get('mision') || '1';
        } catch (e) {
            return '1';
        }
    }, [url]);

    const [selectedIndicatorId, setSelectedIndicatorId] = useState<number | ''>(indicators.length > 0 ? indicators[0].id : '');
    const [selectedYear, setSelectedYear] = useState<string>('Todos');
    const [selectedSubCat, setSelectedSubCat] = useState<string>('Todos');
    const [selectedMunicipio, setSelectedMunicipio] = useState<string | null>(null);

    const handleMisionChange = (val: string) => {
        router.get(window.location.pathname, { mision: val }, { preserveState: true, preserveScroll: true });
    };

    // Auto-select first indicator when mission changes and reset filters
    useEffect(() => {
        if (indicators.length > 0) {
            const exists = indicators.find(i => i.id === selectedIndicatorId);
            if (!exists) {
                setSelectedIndicatorId(indicators[0].id);
            }
        } else {
            setSelectedIndicatorId('');
        }
    }, [indicators]);

    // Reset filters when indicator changes
    useEffect(() => {
        setSelectedYear('Todos');
        setSelectedSubCat('Todos');
        setSelectedMunicipio(null);
    }, [selectedIndicatorId]);

    const selectedIndicator = useMemo(() => {
        return indicators.find(i => i.id === selectedIndicatorId) || null;
    }, [selectedIndicatorId, indicators]);

    const parsedData = useMemo(() => {
        if (!selectedIndicator) return null;

        let dynamicData = selectedIndicator.metadata_dinamica || selectedIndicator.metadata_tabla_global || [];
        
        // If it's an object with keys like "2023", "2024" (M3 custom tables)
        if (dynamicData && typeof dynamicData === 'object' && !Array.isArray(dynamicData)) {
            let flattened: any[] = [];
            Object.keys(dynamicData).forEach(year => {
                const yearData = (dynamicData as any)[year];
                if (yearData && yearData.tabla && Array.isArray(yearData.tabla) && yearData.tabla.length > 1) {
                    let headerIndex = 0;
                    for (let i = 0; i < Math.min(3, yearData.tabla.length); i++) {
                        const row = yearData.tabla[i];
                        if (Array.isArray(row) && row.some((c: any) => typeof c === 'string' && (c.toUpperCase().includes('MUNICIPIO') || c.toUpperCase().includes('LOCALIDAD') || c.toUpperCase().includes('RACIONES') || c.toUpperCase().includes('CONVENIOS')))) {
                            headerIndex = i;
                            break;
                        }
                    }
                    const headers = yearData.tabla[headerIndex];
                    const rows = yearData.tabla.slice(headerIndex + 1);
                    
                    rows.forEach((rowArr: any[]) => {
                        let obj: any = {};
                        headers.forEach((h: string, i: number) => {
                            if (h) obj[h] = rowArr[i];
                        });
                        obj['Año'] = year;
                        flattened.push(obj);
                    });
                }
            });
            dynamicData = flattened;
        }

        // If empty, check if it's an M3 indicator that stores its data in metadata_tabla
        if ((!dynamicData || dynamicData.length === 0) && selectedIndicator.metadata_tabla && selectedIndicator.metadata_tabla.length > 0) {
            dynamicData = selectedIndicator.metadata_tabla;
        }

        if (!Array.isArray(dynamicData) || dynamicData.length === 0) return null;

        // Flatten nested complex tables (like those in M3)
        if (dynamicData[0] && typeof dynamicData[0] === 'object' && ('headers' in dynamicData[0] || 'rows' in dynamicData[0])) {
            let flattened: any[] = [];
            dynamicData.forEach((table: any) => {
                if (table.headers && table.rows) {
                    table.rows.forEach((rowArr: any[]) => {
                        let obj: any = {};
                        table.headers.forEach((h: string, i: number) => {
                            obj[h] = rowArr[i];
                        });
                        if (table.title && !obj['Año'] && !obj['Ao'] && !obj['Ao'] && !obj['A\u00f1o']) {
                            obj['Año'] = table.title;
                        }
                        flattened.push(obj);
                    });
                }
            });
            dynamicData = flattened;
            if (dynamicData.length === 0) return null;
        }

        const dataKeys = Array.from(new Set(dynamicData.flatMap(r => Object.keys(r))));
        let orderedKeys = dataKeys;
        if (selectedIndicator.metadata_tabla && selectedIndicator.metadata_tabla.length > 0 && selectedIndicator.metadata_tabla[0].headers) {
            orderedKeys = selectedIndicator.metadata_tabla[0].headers.filter((h: string) => dataKeys.includes(h));
            for (const dk of dataKeys) {
                if (!orderedKeys.includes(dk)) orderedKeys.push(dk);
            }
        }

        let categoryKey = orderedKeys[0];
        for (const key of orderedKeys) {
            if (key.startsWith('col_')) continue;
            const hasTextContent = dynamicData.some((r: any) => {
                const rawVal = r[key];
                if (rawVal === null || rawVal === '' || rawVal === undefined) return false;
                const cleanVal = typeof rawVal === 'string' ? String(rawVal).replace(/,/g, '').trim() : rawVal;
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
        let yearKey = dataKeys.find(k => { const up = String(k).toUpperCase(); return (up.includes('A') && (up.includes('O') || up.includes('0')) && up.length === 3) || up === 'YEAR'; });
        const hasPerRowYear = yearKey && categoryKey !== yearKey;

        if (hasPerRowYear && yearKey) {
            dynamicData.forEach((row: any) => {
                if (row[yearKey]) years.add(String(row[yearKey]));
            });
            if (years.size > 1 && years.has('General')) years.delete('General');
        }

        let subCats = orderedKeys.filter(k => k !== categoryKey && k !== yearKey && !String(k).toLowerCase().includes('total') && !String(k).startsWith('col_') && !(queryMision === '5' && !isNaN(Number(k)) && String(k).length > 4));
        let customGroups: Record<string, string[]> | null = null;

        const title = selectedIndicator.titulo || '';
        if (title.includes('Jaguar') || title.includes('stiles Jaguar')) {
            customGroups = {
                'Localidades y Escuelas': ['Localidad', 'Escuela'],
                'Beneficiarios': ['Nias', 'Nios', 'Niñas', 'Niños']
            };
        } else if (title.toLowerCase().includes('raciones alimentarias')) {
            customGroups = {
                'Raciones Distribuidas': ['RACION', 'RACIN', 'RACIÓN'],
                'Número de beneficiarios': ['BENEFICIARIO']
            };
        }

        if (customGroups) {
            subCats = Object.keys(customGroups);
        }

        return { dynamicData, categoryKey, years: Array.from(years).sort(), subCats, customGroups, hasPerRowYear, yearKey };
    }, [selectedIndicator]);

    const heatmapData = useMemo(() => {
        if (!parsedData) return [];
        const { dynamicData, categoryKey, hasPerRowYear, yearKey } = parsedData;

        const municipalities = [
            'Calkiní', 'Campeche', 'Carmen', 'Champotón', 'Hecelchakán', 'Hopelchén', 
            'Palizada', 'Tenabo', 'Escárcega', 'Calakmul', 'Candelaria', 'Seybaplaya', 'Dzitbalché'
        ];
        
        const normalizeStr = (str: string) => String(str).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();

        return municipalities.map(mun => {
            const munNorm = normalizeStr(mun);
            
            const rows = dynamicData.filter((r: any) => r[categoryKey] && normalizeStr(r[categoryKey]) === munNorm);
            
            if (rows.length === 0) return { name: mun, value: null };

            let sum = 0;
            let hasData = false;

            rows.forEach((r: any) => {
                if (hasPerRowYear && yearKey && selectedYear !== 'Todos' && queryMision !== '4' && queryMision !== '5') {
                    if (String(r[yearKey]) !== selectedYear) return;
                }

                parsedData.subCats.forEach((sc: string) => {
                    if (selectedSubCat !== 'Todos' && sc !== selectedSubCat) return;
                    
                    let keysToSum = [sc];
                    if (parsedData.customGroups && parsedData.customGroups[sc]) {
                        keysToSum = parsedData.customGroups[sc];
                    }

                    keysToSum.forEach(searchKey => {
                        const actualKey = Object.keys(r).find(k => k.toUpperCase().includes(searchKey.toUpperCase()));
                        if (actualKey) {
                            const rawVal = r[actualKey];
                            if (rawVal !== null && rawVal !== undefined && rawVal !== '') {
                                const cleanVal = typeof rawVal === 'string' ? String(rawVal).replace(/,/g, '').trim() : rawVal;
                                const num = Number(cleanVal);
                                if (!isNaN(num)) {
                                    sum += num;
                                    hasData = true;
                                }
                            }
                        }
                    });
                });
            });

            return { name: mun, value: hasData ? sum : null };
        });
    }, [parsedData, selectedYear, selectedSubCat]);


    const filteredChartData = useMemo(() => {
        if (!selectedIndicator || !parsedData) return [];
        let raw = selectedIndicator.metadata_dinamica || selectedIndicator.metadata_tabla_global || [];
        if (queryMision === '5') {
            return raw.map((row) => {
                const newRow = { ...row };
                if (selectedSubCat !== 'Todos') {
                    parsedData.subCats.forEach((sc) => {
                        if (sc !== selectedSubCat) delete newRow[sc];
                    });
                } else {
                    let sum = 0;
                    parsedData.subCats.forEach((sc) => {
                        sum += Number(row[sc]) || 0;
                        delete newRow[sc];
                    });
                    newRow['Sumatoria'] = sum;
                }
                return newRow;
            });
        }
        return raw;
    }, [selectedIndicator, queryMision, selectedSubCat, parsedData]);

    return (

        <Card>
            <Card.Header className="bg-light">
                <h5 className="card-title mb-0">Comparativa Geográfica Municipal</h5>
            </Card.Header>
            <Card.Body>
                <Row className="mb-4">
                    <Col lg={4}>
                        <Form.Group>
                            <Form.Label className="fw-bold">Misión</Form.Label>
                            <Form.Select 
                                value={queryMision} 
                                onChange={(e) => handleMisionChange(e.target.value)}
                                size="lg"
                            >
                                {Object.entries(missions || {}).map(([num, name]: any) => {
                                    const title = typeof name === 'string' && name.toLowerCase().includes('misión') 
                                        ? name 
                                        : `Misión ${num}: ${name}`;
                                    return <option key={num} value={num}>{title}</option>;
                                })}
                            </Form.Select>
                        </Form.Group>
                    </Col>
                    <Col lg={8}>
                        <Form.Group>
                            <Form.Label className="fw-bold">Selecciona un Indicador Municipal</Form.Label>
                            <Form.Select 
                                value={selectedIndicatorId} 
                                onChange={(e) => setSelectedIndicatorId(e.target.value ? Number(e.target.value) : '')}
                                size="lg"
                            >
                                <option value="">-- Seleccionar --</option>
                                {indicators.map(ind => {
                                    // Remove 'Indicador MX-XXX - ' prefix if it's baked into the database string
                                    const cleanTitle = ind.titulo.replace(new RegExp(`^(Indicador\\s*)?${ind.clave}\\s*-\\s*`, 'i'), '');
                                    return (
                                        <option key={ind.id} value={ind.id}>
                                            {cleanTitle}
                                        </option>
                                    );
                                })}
                            </Form.Select>
                        </Form.Group>
                    </Col>
                </Row>

                {parsedData && selectedIndicator ? (
                    <React.Fragment>
                        <Row className="mb-4 align-items-center">
                            {parsedData.years.length > 0 && queryMision !== '4' && queryMision !== '5' && (
                                <Col md="auto" className="mb-3 mb-md-0">
                                    <div className="d-flex align-items-center flex-wrap gap-2">
                                        <h6 className="fw-bold mb-0 me-2">Filtrar por Año:</h6>
                                        <Button 
                                            variant={selectedYear === 'Todos' ? 'primary' : 'outline-primary'} 
                                            size="sm"
                                            onClick={() => setSelectedYear('Todos')}
                                        >
                                            Sumatoria (Todos)
                                        </Button>
                                        {parsedData.years.map(y => (
                                            <Button 
                                                key={y}
                                                variant={selectedYear === y ? 'primary' : 'outline-primary'} 
                                                size="sm"
                                                onClick={() => setSelectedYear(y)}
                                            >
                                                {y}
                                            </Button>
                                        ))}
                                    </div>
                                </Col>
                            )}

                            {parsedData.subCats.length > 1 && (
                                <Col md="auto">
                                    <div className="d-flex align-items-center flex-wrap gap-2">
                                        <h6 className="fw-bold mb-0 me-2">{parsedData.subCats.every((sc: string) => /^\d{4}$/.test(sc)) ? 'Filtrar por Año:' : 'Filtrar por Categoría / Acción:'}</h6>
                                        <Button 
                                            variant={selectedSubCat === 'Todos' ? 'primary' : 'outline-primary'} 
                                            size="sm"
                                            onClick={() => setSelectedSubCat('Todos')}
                                        >
                                            Sumatoria de todas las acciones
                                        </Button>
                                        {parsedData.subCats.map(sc => (
                                            <Button 
                                                key={sc}
                                                variant={selectedSubCat === sc ? 'primary' : 'outline-primary'} 
                                                size="sm"
                                                onClick={() => setSelectedSubCat(sc)}
                                            >
                                                {sc}
                                            </Button>
                                        ))}
                                    </div>
                                </Col>
                            )}
                        </Row>
                        
                        <Row>
                            <Col lg={6} className="mb-4 mb-lg-0">
                                <h6 className="fw-bold text-center mb-3">Distribución Geográfica</h6>
                                <CampecheHeatmap 
                                    data={heatmapData} 
                                    selectedMunicipio={selectedMunicipio}
                                    onMunicipioSelect={setSelectedMunicipio}
                                />
                                <p className="text-muted text-center mt-2 small">Da clic en un municipio para ver el detalle en la gráfica</p>
                            </Col>
                            <Col lg={6}>
                                <h6 className="fw-bold text-center mb-3">
                                    {selectedMunicipio ? `Detalle de ${selectedMunicipio}` : 'Detalle Estatal'}
                                </h6>
                                <DynamicChart 
                                    dynamicData={filteredChartData} 
                                    metadataTabla={selectedIndicator.metadata_tabla || []}
                                    indicatorTitulo={selectedIndicator.titulo}
                                    selectedMunicipio={selectedMunicipio}
                                />
                            </Col>
                        </Row>
                    </React.Fragment>
                ) : indicators.length === 0 ? (
                    <div className="text-center p-5 bg-light rounded text-muted my-5">
                        <h4 className="fw-bold text-secondary">Misión sin indicadores para mostrar geográficamente</h4>
                    </div>
                ) : selectedIndicatorId ? (
                    <div className="alert alert-warning">
                        El indicador seleccionado no cuenta con datos tabulares compatibles o estructurados para la vista de mapa de calor.
                    </div>
                ) : (
                    <div className="text-center p-5 bg-light rounded text-muted">
                        <i className="ri-map-pin-line fs-1 mb-2 d-block"></i>
                        Selecciona un indicador de la lista para visualizar su distribución geográfica.
                    </div>
                )}
            </Card.Body>
        </Card>
    );
}
