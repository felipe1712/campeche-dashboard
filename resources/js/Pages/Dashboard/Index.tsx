import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import { Container, Row, Col, Card, Form, Table, Button, Collapse, Tabs, Tab } from 'react-bootstrap';
import Layout from '../../Layouts';
import DynamicChart from './DynamicChart';
import ErrorBoundary from '../../Components/ErrorBoundary';
import CampecheMap from './CampecheMap';

const IndicatorRow = ({ indicator, selectedMunicipio }: any) => {
    const [open, setOpen] = useState(false);
    const dynamicData = indicator.metadata_dinamica || [];

    // Filter indicator to show only if it is municipal and municipality is selected, or if no municipality selected
    if (selectedMunicipio && !indicator.desglose_municipal) {
        return null;
    }

    return (
        <React.Fragment>
            {/* Summary row */}
            <tr
                onClick={() => setOpen(!open)}
                style={{ cursor: 'pointer' }}
                className={open ? 'table-active' : ''}
            >
                <td style={{ whiteSpace: 'nowrap' }}><strong>{indicator.clave}</strong></td>
                <td>
                    {indicator.titulo}
                    {indicator.is_estrella === 1 && (
                        <span className="badge bg-warning text-dark ms-2">
                            <i className="ri-star-fill align-middle me-1"></i>Estratégico
                        </span>
                    )}
                </td>
                <td>{indicator.dependencia}</td>
                <td>{indicator.tema ? indicator.tema.nombre : 'Sin Tema'}</td>
                <td style={{ whiteSpace: 'nowrap', textAlign: 'center' }}>
                    <i className={open ? 'ri-arrow-up-s-line fs-18' : 'ri-arrow-down-s-line fs-18'} />
                </td>
            </tr>

            {/* Detail panel — full-width row OUTSIDE the scrolling columns */}
            {open && (
                <tr style={{ background: 'transparent' }}>
                    <td
                        colSpan={5}
                        style={{
                            padding: 0,
                            border: 'none',
                            /* prevent this cell from contributing to table width */
                            width: 0,
                            overflow: 'visible',
                        }}
                    >
                        {/* The actual panel breaks out of the table column constraints */}
                        <div
                            style={{
                                width: '100%',
                                maxWidth: '100%',
                                padding: '16px',
                                background: '#f8f9fa',
                                borderTop: '2px solid #e9ecef',
                                borderBottom: '2px solid #e9ecef',
                                boxSizing: 'border-box',
                                overflow: 'hidden',
                            }}
                        >
                            {/* Chart card */}
                            {dynamicData.length > 0 ? (
                                <Card
                                    className="shadow-sm mb-3"
                                    style={{
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '12px',
                                        overflow: 'hidden',
                                    }}
                                >
                                    <Card.Body style={{ padding: '20px' }}>
                                        <ErrorBoundary>
                                            <DynamicChart
                                                dynamicData={dynamicData}
                                                indicatorTitulo={indicator.titulo}
                                                selectedMunicipio={selectedMunicipio}
                                                isMunicipal={indicator.desglose_municipal}
                                            />
                                        </ErrorBoundary>
                                    </Card.Body>
                                </Card>
                            ) : (
                                <p className="text-muted mb-3">No hay datos dinámicos disponibles.</p>
                            )}

                            {/* Metadata footer */}
                            {(indicator.notas || indicator.fuente) && (
                                <div
                                    style={{
                                        background: '#fff',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '10px',
                                        padding: '12px 16px',
                                        fontSize: '12px',
                                    }}
                                >
                                    {indicator.notas && (
                                        <div className="mb-1">
                                            <strong style={{ color: '#475569' }}>Notas: </strong>
                                            <span className="text-muted">
                                                {indicator.notas.replace(/\n|\r/g, ' ')}
                                            </span>
                                        </div>
                                    )}
                                    {indicator.fuente && (
                                        <div className="mb-0">
                                            <strong style={{ color: '#475569' }}>Fuente: </strong>
                                            <span className="text-muted">
                                                {indicator.fuente.replace(/^Fuente:\s*/i, '')}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </td>
                </tr>
            )}
        </React.Fragment>
    );
};

export default function DashboardIndex({ 
    indicators, 
    estrellas,
    temas, 
    subtemas, 
    dependencias, 
    filters 
}: any) {
    const [selectedMunicipio, setSelectedMunicipio] = useState<string | null>(null);
    const [showMapTab, setShowMapTab] = useState<boolean>(true);
    const [activeTab, setActiveTab] = useState<string>('estrellas');

    useEffect(() => {
        const handleToggle = () => setShowMapTab(prev => !prev);
        window.addEventListener('toggleMapTab', handleToggle);
        return () => window.removeEventListener('toggleMapTab', handleToggle);
    }, []);

    const handleFilterChange = (field: string, value: any) => {
        router.get(route('dashboard.index'), {
            ...filters,
            [field]: value
        }, { preserveState: true, preserveScroll: true });
    };

    return (
        <React.Fragment>
            <Head title="Tablero Principal" />
            <div className="page-content">
                <Container fluid>
                    {/* Header Row */}
                    <Row className="mb-3 pb-1">
                        <Col xs={12}>
                            <div className="d-flex align-items-lg-center flex-lg-row flex-column">
                                <div className="flex-grow-1">
                                    <h4 className="fs-16 mb-1">Tablero Gráfico de Indicadores</h4>
                                    <p className="text-muted mb-0">Explora e interactúa con los datos mediante gráficas generadas al instante.</p>
                                </div>
                            </div>
                        </Col>
                    </Row>

                    <Tabs 
                        activeKey={activeTab} 
                        onSelect={(k) => setActiveTab(k || 'estrellas')} 
                        id="dashboard-tabs" 
                        className="mb-4" 
                        variant="pills"
                    >
                        <Tab eventKey="estrellas" title={<><i className="ri-star-fill text-warning"></i> Indicadores Estratégicos</>}>
                            <Row>
                                <Col lg={12}>
                                    <div className="d-flex align-items-center mb-3">
                                        <h5 className="card-title mb-0 flex-grow-1">Tablero de Indicadores Estratégicos</h5>
                                        <div className="flex-shrink-0">
                                            <span className="badge bg-soft-warning text-warning fs-14">
                                                {estrellas.length} {estrellas.length === 1 ? 'Indicador' : 'Indicadores'}
                                            </span>
                                        </div>
                                    </div>
                                    {estrellas.length === 0 ? (
                                        <Card className="text-center p-5 border-0 shadow-sm">
                                            <Card.Body>
                                                <i className="ri-bar-chart-2-line display-4 text-muted mb-3"></i>
                                                <h5>No hay indicadores estratégicos</h5>
                                                <p className="text-muted">No se han marcado indicadores como estratégicos para el filtro actual.</p>
                                            </Card.Body>
                                        </Card>
                                    ) : (
                                        <div>
                                            {/* Municipal Estrellas Section */}
                                            {estrellas.filter((ind: any) => ind.desglose_municipal).length > 0 && (
                                                <div className="mb-5">
                                                    <h6 className="fw-bold mb-3" style={{ color: '#9D2449' }}>Indicadores con Desglose Municipal</h6>
                                                    <Row className="g-4">
                                                        <Col lg={6}>
                                                            <Row className="g-4">
                                                                {estrellas.filter((ind: any) => ind.desglose_municipal).map((estrella: any) => (
                                                                    <Col lg={12} key={estrella.id}>
                                                                        <Card className="shadow-sm border-0 h-100" style={{ borderRadius: '12px' }}>
                                                                            <Card.Header className="bg-white border-bottom pb-2 pt-3">
                                                                                <div className="d-flex align-items-center">
                                                                                    <div className="flex-grow-1">
                                                                                        <h6 className="card-title mb-1 fs-15">{estrella.titulo}</h6>
                                                                                        <p className="text-muted mb-0 fs-13">
                                                                                            <span className="fw-medium text-dark">{estrella.clave}</span> 
                                                                                            {estrella.dependencia && ` | ${estrella.dependencia}`}
                                                                                        </p>
                                                                                    </div>
                                                                                    <div className="flex-shrink-0 ms-2">
                                                                                        <span className="badge bg-warning text-dark"><i className="ri-star-fill align-middle"></i></span>
                                                                                    </div>
                                                                                </div>
                                                                            </Card.Header>
                                                                            <Card.Body className="bg-light">
                                                                                <ErrorBoundary>
                                                                                    <DynamicChart 
                                                                                        dynamicData={estrella.metadata_dinamica || []}
                                                                                        indicatorTitulo={estrella.titulo}
                                                                                        selectedMunicipio={selectedMunicipio} 
                                                                                        isMunicipal={estrella.desglose_municipal}
                                                                                    />
                                                                                </ErrorBoundary>
                                                                                {(estrella.notas || estrella.fuente) && (
                                                                                    <div className="mt-3 text-muted fs-12 border-top pt-2">
                                                                                        {estrella.notas && <div className="mb-1"><strong>Notas:</strong> {estrella.notas}</div>}
                                                                                        {estrella.fuente && <div><strong>Fuente:</strong> {estrella.fuente}</div>}
                                                                                    </div>
                                                                                )}
                                                                            </Card.Body>
                                                                        </Card>
                                                                    </Col>
                                                                ))}
                                                            </Row>
                                                        </Col>
                                                        <Col lg={6}>
                                                            <div className="sticky-top" style={{ top: '80px', zIndex: 10 }}>
                                                                <Card className="bg-white text-dark shadow-sm border-0" style={{ borderRadius: '15px', overflow: 'hidden' }}>
                                                                    <Card.Body className="p-0" style={{ height: '600px' }}>
                                                                        <div className="p-3 bg-light border-bottom d-flex justify-content-between align-items-center">
                                                                            <div>
                                                                                <h6 className="mb-0 fw-bold">Mapa Interactivo</h6>
                                                                                <small className="text-muted">Selecciona un municipio</small>
                                                                            </div>
                                                                            {selectedMunicipio && (
                                                                                <span className="badge bg-primary fs-12 d-flex align-items-center">
                                                                                    {selectedMunicipio}
                                                                                    <button 
                                                                                        className="btn-close btn-close-white ms-2" 
                                                                                        style={{ width: '0.4em', height: '0.4em' }}
                                                                                        onClick={() => setSelectedMunicipio(null)}
                                                                                    ></button>
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <div style={{ height: 'calc(100% - 60px)' }}>
                                                                            <CampecheMap 
                                                                                selectedMunicipio={selectedMunicipio}
                                                                                onMunicipioSelect={setSelectedMunicipio}
                                                                            />
                                                                        </div>
                                                                    </Card.Body>
                                                                </Card>
                                                            </div>
                                                        </Col>
                                                    </Row>
                                                </div>
                                            )}
        
                                            {/* Other Estrellas Section */}
                                            {estrellas.filter((ind: any) => !ind.desglose_municipal).length > 0 && (
                                                <div>
                                                    <h6 className="fw-bold mb-3" style={{ color: '#9D2449' }}>Otros Indicadores Estratégicos</h6>
                                                    <Row className="g-4">
                                                        {estrellas.filter((ind: any) => !ind.desglose_municipal).map((estrella: any) => (
                                                            <Col lg={12} key={estrella.id}>
                                                                <Card className="shadow-sm border-0 h-100" style={{ borderRadius: '12px' }}>
                                                                    <Card.Header className="bg-white border-bottom pb-2 pt-3">
                                                                        <div className="d-flex align-items-center">
                                                                            <div className="flex-grow-1">
                                                                                <h6 className="card-title mb-1 fs-15">{estrella.titulo}</h6>
                                                                                <p className="text-muted mb-0 fs-13">
                                                                                    <span className="fw-medium text-dark">{estrella.clave}</span> 
                                                                                    {estrella.dependencia && ` | ${estrella.dependencia}`}
                                                                                </p>
                                                                            </div>
                                                                            <div className="flex-shrink-0 ms-2">
                                                                                <span className="badge bg-warning text-dark"><i className="ri-star-fill align-middle"></i></span>
                                                                            </div>
                                                                        </div>
                                                                    </Card.Header>
                                                                    <Card.Body className="bg-light">
                                                                        <ErrorBoundary>
                                                                            <DynamicChart 
                                                                                dynamicData={estrella.metadata_dinamica || []}
                                                                                indicatorTitulo={estrella.titulo}
                                                                                selectedMunicipio={null} 
                                                                                isMunicipal={false}
                                                                            />
                                                                        </ErrorBoundary>
                                                                        {(estrella.notas || estrella.fuente) && (
                                                                            <div className="mt-3 text-muted fs-12 border-top pt-2">
                                                                                {estrella.notas && <div className="mb-1"><strong>Notas:</strong> {estrella.notas}</div>}
                                                                                {estrella.fuente && <div><strong>Fuente:</strong> {estrella.fuente}</div>}
                                                                            </div>
                                                                        )}
                                                                    </Card.Body>
                                                                </Card>
                                                            </Col>
                                                        ))}
                                                    </Row>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </Col>
                            </Row>
                        </Tab>

                        <Tab eventKey="graficas" title={<><i className="ri-bar-chart-2-line"></i> Directorio Completo</>}>
                            {/* Filters Row */}
                            <Row>
                                <Col lg={12}>
                                    <Card>
                                        <Card.Header>
                                            <h5 className="card-title mb-0"><i className="ri-filter-3-line align-middle me-1"></i> Búsqueda y Filtros</h5>
                                        </Card.Header>
                                        <Card.Body>
                                            <Row className="g-3">
                                                <Col md={2}>
                                                    <Form.Label>Año</Form.Label>
                                                    <Form.Select 
                                                        value={filters.año} 
                                                        onChange={e => handleFilterChange('año', e.target.value)}
                                                    >
                                                        {[2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030].map(y => (
                                                            <option key={y} value={y}>{y}</option>
                                                        ))}
                                                    </Form.Select>
                                                </Col>
                                                <Col md={2}>
                                                    <Form.Label>Misión</Form.Label>
                                                    <Form.Select 
                                                        value={filters.mision} 
                                                        onChange={e => handleFilterChange('mision', e.target.value)}
                                                    >
                                                        <option value="1">Misión 1</option>
                                                        <option value="2">Misión 2</option>
                                                        <option value="3">Misión 3</option>
                                                        <option value="4">Misión 4</option>
                                                        <option value="5">Misión 5</option>
                                                    </Form.Select>
                                                </Col>
                                                <Col md={2}>
                                                    <Form.Label>Tema</Form.Label>
                                                    <Form.Select 
                                                        value={filters.tema_id || ''} 
                                                        onChange={e => {
                                                            // Reset subtema if tema changes
                                                            router.get(route('dashboard.index'), {
                                                                ...filters,
                                                                tema_id: e.target.value,
                                                                subtema_id: ''
                                                            }, { preserveState: true, preserveScroll: true });
                                                        }}
                                                    >
                                                        <option value="">Todos los temas</option>
                                                        {temas.map((tema: any) => (
                                                            <option key={tema.id} value={tema.id}>{tema.nombre}</option>
                                                        ))}
                                                    </Form.Select>
                                                </Col>
                                                <Col md={2}>
                                                    <Form.Label>Subtema</Form.Label>
                                                    <Form.Select 
                                                        value={filters.subtema_id || ''} 
                                                        onChange={e => handleFilterChange('subtema_id', e.target.value)}
                                                        disabled={!filters.tema_id}
                                                    >
                                                        <option value="">Todos</option>
                                                        {subtemas.map((sub: any) => (
                                                            <option key={sub.id} value={sub.id}>{sub.nombre}</option>
                                                        ))}
                                                    </Form.Select>
                                                </Col>
                                                <Col md={3}>
                                                    <Form.Label>Dependencia</Form.Label>
                                                    <Form.Select 
                                                        value={filters.dependencia || ''} 
                                                        onChange={e => handleFilterChange('dependencia', e.target.value)}
                                                    >
                                                        <option value="">Todas</option>
                                                        {dependencias.map((dep: any, i: number) => (
                                                            <option key={i} value={dep}>{dep}</option>
                                                        ))}
                                                    </Form.Select>
                                                </Col>
                                                <Col md={1} className="d-flex align-items-end">
                                                    <Button variant="light" className="w-100" onClick={() => router.get(route('dashboard.index'))}>
                                                        <i className="ri-refresh-line"></i>
                                                    </Button>
                                                </Col>
                                            </Row>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>

                            {/* Data Table Row */}
                            <Row>
                                <Col lg={12}>
                                    <Card>
                                        <Card.Header className="d-flex justify-content-between align-items-center">
                                            <h5 className="card-title mb-0">Resultados ({indicators.total} indicadores)</h5>
                                        </Card.Header>
                                        <Card.Body className="p-0">
                                            <div style={{ overflowX: 'auto' }}>
                                                <Table className="mb-0 align-middle" style={{ tableLayout: 'fixed', width: '100%' }}>
                                                    <colgroup>
                                                        <col style={{ width: '90px' }} />
                                                        <col style={{ width: '40%' }} />
                                                        <col />
                                                        <col />
                                                        <col style={{ width: '80px' }} />
                                                    </colgroup>
                                                    <thead className="table-light">
                                                        <tr>
                                                            <th>Clave</th>
                                                            <th style={{ width: '40%' }}>Título</th>
                                                            <th>Dependencia</th>
                                                            <th>Tema</th>
                                                            <th>Gráfica</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {indicators.data.length > 0 ? (
                                                            indicators.data.map((indicator: any) => (
                                                                <IndicatorRow key={indicator.id} indicator={indicator} selectedMunicipio={null} />
                                                            ))
                                                        ) : (
                                                            <tr>
                                                                <td colSpan={5} className="text-center py-4 text-muted">
                                                                    No se encontraron indicadores para los filtros seleccionados.
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </Table>
                                            </div>
                                        </Card.Body>
                                        <Card.Footer>
                                            {/* Simple Pagination info */}
                                            <div className="d-flex justify-content-between align-items-center">
                                                <span className="text-muted">
                                                    Mostrando {indicators.from || 0} a {indicators.to || 0} de {indicators.total} resultados
                                                </span>
                                                <div>
                                                    {indicators.links.map((link: any, index: number) => (
                                                        <Button 
                                                            key={index}
                                                            variant={link.active ? 'primary' : 'light'}
                                                            className="me-1 btn-sm"
                                                            disabled={!link.url}
                                                            onClick={() => link.url && router.get(link.url, {}, { preserveScroll: true, preserveState: true })}
                                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        </Card.Footer>
                                    </Card>
                                </Col>
                            </Row>
                        </Tab>
                        {showMapTab && (
                            <Tab eventKey="mapa" title={<><i className="ri-map-pin-line"></i> Mapa de Municipios</>}>
                            <Row>
                                <Col lg={6} className="mb-4">
                                    <Card className="h-100">
                                        <Card.Body className="p-1">
                                            <CampecheMap 
                                                onMunicipioSelect={setSelectedMunicipio} 
                                                selectedMunicipio={selectedMunicipio}
                                            />
                                            {selectedMunicipio && (
                                                <div className="alert alert-primary mt-3 mx-2 mb-2">
                                                    <i className="ri-information-line me-2"></i>
                                                    Mostrando gráficas filtradas para el municipio de <strong>{selectedMunicipio}</strong>
                                                </div>
                                            )}
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col lg={6} className="mb-4">
                                    <Card className="h-100">
                                        <Card.Header>
                                            <h5 className="card-title mb-0"><i className="ri-filter-3-line align-middle me-1"></i> Búsqueda y Filtros</h5>
                                        </Card.Header>
                                        <Card.Body>
                                            <div className="mb-3">
                                                <Form.Label>Año</Form.Label>
                                                <Form.Select 
                                                    value={filters.año} 
                                                    onChange={e => handleFilterChange('año', e.target.value)}
                                                >
                                                    {[2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030].map(y => (
                                                        <option key={y} value={y}>{y}</option>
                                                    ))}
                                                </Form.Select>
                                            </div>
                                            <div className="mb-3">
                                                <Form.Label>Misión</Form.Label>
                                                <Form.Select 
                                                    value={filters.mision} 
                                                    onChange={e => handleFilterChange('mision', e.target.value)}
                                                >
                                                    <option value="1">Misión 1</option>
                                                    <option value="2">Misión 2</option>
                                                    <option value="3">Misión 3</option>
                                                    <option value="4">Misión 4</option>
                                                    <option value="5">Misión 5</option>
                                                </Form.Select>
                                            </div>
                                            <div className="mb-3">
                                                <Form.Label>Tema</Form.Label>
                                                <Form.Select 
                                                    value={filters.tema_id || ''} 
                                                    onChange={e => {
                                                        router.get(route('dashboard.index'), {
                                                            ...filters,
                                                            tema_id: e.target.value,
                                                            subtema_id: ''
                                                        }, { preserveState: true, preserveScroll: true });
                                                    }}
                                                >
                                                    <option value="">Todos los temas</option>
                                                    {temas.map((tema: any) => (
                                                        <option key={tema.id} value={tema.id}>{tema.nombre}</option>
                                                    ))}
                                                </Form.Select>
                                            </div>
                                            <div className="mb-3">
                                                <Form.Label>Subtema</Form.Label>
                                                <Form.Select 
                                                    value={filters.subtema_id || ''} 
                                                    onChange={e => handleFilterChange('subtema_id', e.target.value)}
                                                    disabled={!filters.tema_id}
                                                >
                                                    <option value="">Todos</option>
                                                    {subtemas.map((sub: any) => (
                                                        <option key={sub.id} value={sub.id}>{sub.nombre}</option>
                                                    ))}
                                                </Form.Select>
                                            </div>
                                            <div className="mb-3">
                                                <Form.Label>Dependencia</Form.Label>
                                                <Form.Select 
                                                    value={filters.dependencia || ''} 
                                                    onChange={e => handleFilterChange('dependencia', e.target.value)}
                                                >
                                                    <option value="">Todas</option>
                                                    {dependencias.map((dep: any, i: number) => (
                                                        <option key={i} value={dep}>{dep}</option>
                                                    ))}
                                                </Form.Select>
                                            </div>
                                            <div className="d-flex justify-content-end mt-4">
                                                <Button variant="light" onClick={() => router.get(route('dashboard.index'))}>
                                                    <i className="ri-refresh-line me-1"></i> Limpiar Filtros
                                                </Button>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                
                                <Col lg={12}>
                                    <Card>
                                        <Card.Header className="bg-light">
                                            <h5 className="card-title mb-0">Indicadores Municipales {selectedMunicipio ? `- ${selectedMunicipio}` : ''}</h5>
                                        </Card.Header>
                                        <Card.Body className="p-0">
                                            <Table className="mb-0 align-middle" style={{ tableLayout: 'fixed', width: '100%' }}>
                                                <colgroup>
                                                    <col style={{ width: '90px' }} />
                                                    <col style={{ width: '40%' }} />
                                                    <col />
                                                    <col />
                                                    <col style={{ width: '80px' }} />
                                                </colgroup>
                                                <tbody>
                                                    {indicators.data.filter((ind: any) => ind.desglose_municipal).length > 0 ? (
                                                        indicators.data
                                                            .filter((ind: any) => ind.desglose_municipal)
                                                            .map((indicator: any) => (
                                                                <IndicatorRow key={indicator.id} indicator={indicator} selectedMunicipio={selectedMunicipio} />
                                                            ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan={5} className="text-center py-4 text-muted">
                                                                No se encontraron indicadores con desglose municipal.
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </Table>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>
                        </Tab>
                        )}
                    </Tabs>
                </Container>
            </div>
        </React.Fragment>
    );
}

DashboardIndex.layout = (page: any) => <Layout children={page} />;
