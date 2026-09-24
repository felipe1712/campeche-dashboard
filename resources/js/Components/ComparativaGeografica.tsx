import React, { useState, useMemo, useEffect } from 'react';
import { Card, Col, Row, Form, Button } from 'react-bootstrap';
import { router, usePage } from '@inertiajs/react';
import CampecheHeatmap from './CampecheHeatmap';

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

    const [selectedIndicatorId, setSelectedIndicatorId] = useState<number | ''>('');
    const [selectedYear, setSelectedYear] = useState<string>('Todos');
    const [selectedSubCat, setSelectedSubCat] = useState<string>('Todos');

    const handleMisionChange = (val: string) => {
        setSelectedIndicatorId(''); // Reset selected indicator
        router.get(window.location.pathname, { mision: val }, { preserveState: true, preserveScroll: true });
    };

    // Reset filters when indicator changes
    useEffect(() => {
        setSelectedYear('Todos');
        setSelectedSubCat('Todos');
    }, [selectedIndicatorId]);

    const parsedData = useMemo(() => {
        if (!selectedIndicatorId) return null;
        const ind = indicators.find(i => i.id === selectedIndicatorId);
        if (!ind) return null;

        const dynamicData = ind.metadata_dinamica || ind.metadata_tabla_global || [];
        if (!Array.isArray(dynamicData) || dynamicData.length === 0) return null;

        // Ensure we are working with a flat structure
        if (dynamicData[0] && typeof dynamicData[0] === 'object' && ('headers' in dynamicData[0] || 'rows' in dynamicData[0])) {
            return null; // Custom M3 complex tables not supported generically yet
        }

        const dataKeys = Object.keys(dynamicData[0]);
        let orderedKeys = dataKeys;
        if (ind.metadata_tabla && ind.metadata_tabla.length > 0 && ind.metadata_tabla[0].headers) {
            orderedKeys = ind.metadata_tabla[0].headers.filter((h: string) => dataKeys.includes(h));
            for (const dk of dataKeys) {
                if (!orderedKeys.includes(dk)) orderedKeys.push(dk);
            }
        }

        let categoryKey = orderedKeys[0];
        for (const key of orderedKeys) {
            if (key.startsWith('col_')) continue;
            const hasTextContent = dynamicData.some(r => {
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
        // Watch out for encoding issues with 'Año'
        let yearKey = dataKeys.find(k => k === 'Ao' || k === 'Año' || k === 'Ao');
        const hasPerRowYear = yearKey && categoryKey !== yearKey;

        if (hasPerRowYear && yearKey) {
            dynamicData.forEach(row => {
                if (row[yearKey]) years.add(String(row[yearKey]));
            });
            if (years.size > 1 && years.has('General')) years.delete('General');
        }

        const subCats = orderedKeys.filter(k => k !== categoryKey && k !== yearKey && !k.toLowerCase().includes('total'));

        return { dynamicData, categoryKey, years: Array.from(years).sort(), subCats, hasPerRowYear, yearKey };
    }, [selectedIndicatorId, indicators]);

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
                if (hasPerRowYear && yearKey && selectedYear !== 'Todos') {
                    if (String(r[yearKey]) !== selectedYear) return;
                }

                parsedData.subCats.forEach((sc: string) => {
                    if (selectedSubCat !== 'Todos' && sc !== selectedSubCat) return;
                    
                    const rawVal = r[sc];
                    if (rawVal !== null && rawVal !== undefined && rawVal !== '') {
                        const cleanVal = typeof rawVal === 'string' ? String(rawVal).replace(/,/g, '').trim() : rawVal;
                        const num = Number(cleanVal);
                        if (!isNaN(num)) {
                            sum += num;
                            hasData = true;
                        }
                    }
                });
            });

            return { name: mun, value: hasData ? sum : null };
        });
    }, [parsedData, selectedYear, selectedSubCat]);

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
                                {Object.entries(missions || {}).map(([num, name]: any) => (
                                    <option key={num} value={num}>Misión {num}: {name}</option>
                                ))}
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
                                {indicators.map(ind => (
                                    <option key={ind.id} value={ind.id}>
                                        {ind.clave} - {ind.titulo}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    </Col>
                </Row>

                {parsedData ? (
                    <Row>
                        <Col lg={4} className="mb-4">
                            {parsedData.years.length > 0 && (
                                <div className="mb-4">
                                    <h6 className="fw-bold mb-3">Filtrar por Año</h6>
                                    <div className="d-flex flex-wrap gap-2">
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
                                </div>
                            )}

                            {parsedData.subCats.length > 1 && (
                                <div>
                                    <h6 className="fw-bold mb-3">Filtrar por Categoría / Acción</h6>
                                    <div className="d-flex flex-column gap-2">
                                        <Button 
                                            variant={selectedSubCat === 'Todos' ? 'primary' : 'outline-primary'} 
                                            size="sm"
                                            className="text-start"
                                            onClick={() => setSelectedSubCat('Todos')}
                                        >
                                            Sumatoria de todas las acciones
                                        </Button>
                                        {parsedData.subCats.map(sc => (
                                            <Button 
                                                key={sc}
                                                variant={selectedSubCat === sc ? 'primary' : 'outline-primary'} 
                                                size="sm"
                                                className="text-start"
                                                onClick={() => setSelectedSubCat(sc)}
                                            >
                                                {sc}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </Col>
                        <Col lg={8}>
                            <CampecheHeatmap data={heatmapData} />
                        </Col>
                    </Row>
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
