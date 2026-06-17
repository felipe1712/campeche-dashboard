import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Container, Row, Col, Card, Form } from 'react-bootstrap';
import DynamicChart from '../Dashboard/DynamicChart';
import CampecheMap from '../Dashboard/CampecheMap';
import campecheLogo from '../../../images/campeche-logo.png';

export default function LandingIndex({ indicators = [], filters = {} }: any) {
    const [selectedMunicipio, setSelectedMunicipio] = useState<string | null>(null);

    const handleFilterChange = (key: string, value: any) => {
        router.get(route('landing.index'), {
            ...filters,
            [key]: value
        }, { preserveState: true, preserveScroll: true });
    };

    useEffect(() => {
        document.body.setAttribute("data-theme", "default");
        document.body.setAttribute("data-bs-theme", "light");
        document.body.setAttribute("data-layout-mode", "light");
        return () => {
            document.body.removeAttribute("data-bs-theme");
            document.body.removeAttribute("data-theme");
            document.body.removeAttribute("data-layout-mode");
        };
    }, []);

    // Split indicators based on municipal flag
    const municipalIndicators = indicators.filter((ind: any) => ind.desglose_municipal);
    const otherIndicators = indicators.filter((ind: any) => !ind.desglose_municipal);
    const hasMunicipalData = municipalIndicators.length > 0;

    return (
        <React.Fragment>
            <Head title="Indicadores Estratégicos - Campeche" />
            
            {/* Top Navigation */}
            <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom shadow-sm">
                <Container style={{ maxWidth: '1200px' }}>
                    <a className="navbar-brand d-flex align-items-center" href="/">
                        <img src={campecheLogo} alt="Logo Campeche" height="40" className="me-2 bg-primary rounded p-1" />
                        <span className="fw-bold fs-18 text-primary">Indicadores Estratégicos</span>
                    </a>
                    <div className="ms-auto">
                        <Link href={route('login')} className="btn btn-primary btn-sm">
                            <i className="ri-user-settings-line align-middle me-1"></i> Acceso a Servidores Públicos
                        </Link>
                    </div>
                </Container>
            </nav>

            {/* Hero Section */}
            <div className="bg-primary text-white py-5 mb-4 shadow" style={{ backgroundImage: "url('/build/images/bg-pattern.png')", backgroundSize: 'cover' }}>
                <Container style={{ maxWidth: '1200px' }}>
                    <Row className="align-items-center">
                        <Col lg={hasMunicipalData ? 7 : 12}>
                            <h1 className="display-5 fw-bold mb-3 text-white">Tablero de Indicadores Estratégicos</h1>
                            <p className="lead mb-0" style={{ opacity: 0.9 }}>
                                Explora los datos clave y los avances más importantes de la administración del Estado de Campeche, actualizados y al alcance de todos.
                            </p>
                            {selectedMunicipio && (
                                <div className="mt-3">
                                    <span className="badge bg-light text-primary fs-14 px-3 py-2">
                                        Filtrando por: {selectedMunicipio}
                                        <button 
                                            className="btn-close btn-close-white ms-2" 
                                            style={{ filter: 'invert(1) grayscale(100%) brightness(200%)', width: '0.5em', height: '0.5em' }}
                                            onClick={() => setSelectedMunicipio(null)}
                                        ></button>
                                    </span>
                                </div>
                            )}
                        </Col>
                    </Row>
                </Container>
            </div>

            {/* Filters Section */}
            <div className="page-content bg-light pt-4 pb-0">
                <Container style={{ maxWidth: '1200px' }}>
                    <Card className="shadow-sm border-0 mb-4" style={{ borderRadius: '15px' }}>
                        <Card.Header className="bg-white border-bottom-0 pt-3 pb-0">
                            <h5 className="card-title mb-0" style={{ color: '#9D2449' }}><i className="ri-filter-3-line align-middle me-1"></i> Búsqueda y Filtros</h5>
                        </Card.Header>
                        <Card.Body>
                            <Row className="g-3">
                                <Col md={6}>
                                    <Form.Label>Año</Form.Label>
                                    <Form.Select 
                                        value={filters.año || ''} 
                                        onChange={e => handleFilterChange('año', e.target.value)}
                                    >
                                        {[2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030].map(y => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </Form.Select>
                                </Col>
                                <Col md={6}>
                                    <Form.Label>Misión</Form.Label>
                                    <Form.Select 
                                        value={filters.mision || ''} 
                                        onChange={e => handleFilterChange('mision', e.target.value)}
                                    >
                                        <option value="1">Misión 1</option>
                                        <option value="2">Misión 2</option>
                                        <option value="3">Misión 3</option>
                                        <option value="4">Misión 4</option>
                                        <option value="5">Misión 5</option>
                                    </Form.Select>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                </Container>
            </div>

            {/* Municipal Section */}
            {hasMunicipalData && (
                <div className="page-content bg-light pt-5 pb-4">
                    <Container style={{ maxWidth: '1200px' }}>
                        <h3 className="fw-bold mb-4" style={{ color: '#9D2449' }}>Indicadores con Desglose Municipal</h3>
                        <Row className="g-4">
                            {/* Left Column: Charts */}
                            <Col lg={6}>
                                <Row className="g-4">
                                    {municipalIndicators.map((indicator: any) => (
                                        <Col lg={12} key={indicator.id}>
                                            <Card className="shadow-sm border-0 h-100" style={{ borderRadius: '12px' }}>
                                                <Card.Body>
                                                    <DynamicChart 
                                                        dynamicData={indicator.metadata_dinamica || []}
                                                        indicatorTitulo={indicator.titulo}
                                                        selectedMunicipio={selectedMunicipio} 
                                                        isMunicipal={indicator.desglose_municipal}
                                                    />
                                                    {indicator.fuente && (
                                                        <div className="mt-3 text-end">
                                                            <small className="text-muted">
                                                                <strong>Fuente:</strong> {indicator.fuente.replace(/^Fuente:\s*/i, '')}
                                                            </small>
                                                        </div>
                                                    )}
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                    ))}
                                </Row>
                            </Col>

                            {/* Right Column: Map (Sticky) */}
                            <Col lg={6}>
                                <div className="sticky-top" style={{ top: '20px', zIndex: 10 }}>
                                    <Card className="bg-white text-dark shadow-sm border-0" style={{ borderRadius: '15px', overflow: 'hidden' }}>
                                        <Card.Body className="p-0" style={{ height: '600px' }}>
                                            <div className="p-3 bg-light border-bottom d-flex justify-content-between align-items-center">
                                                <div>
                                                    <h6 className="mb-0 fw-bold">Mapa Interactivo</h6>
                                                    <small className="text-muted">Selecciona un municipio</small>
                                                </div>
                                                {selectedMunicipio && (
                                                    <span className="badge bg-primary fs-12">
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
                    </Container>
                </div>
            )}

            {/* Other Strategic Indicators Section */}
            {otherIndicators.length > 0 && (
                <div className={`page-content bg-white ${hasMunicipalData ? 'pt-5' : 'pt-0'}`}>
                    <Container style={{ maxWidth: '1200px' }}>
                        <h3 className="fw-bold mb-4" style={{ color: '#9D2449' }}>Otros Indicadores Estratégicos</h3>
                        <Row className="g-4">
                            {otherIndicators.map((indicator: any) => (
                                <Col lg={12} key={indicator.id}>
                                    <Card className="shadow-sm border-0 h-100" style={{ borderRadius: '12px', background: '#f8f9fa' }}>
                                        <Card.Body>
                                            <DynamicChart 
                                                dynamicData={indicator.metadata_dinamica || []}
                                                indicatorTitulo={indicator.titulo}
                                                selectedMunicipio={null} 
                                                isMunicipal={false}
                                            />
                                            {indicator.fuente && (
                                                <div className="mt-3 text-end">
                                                    <small className="text-muted">
                                                        <strong>Fuente:</strong> {indicator.fuente.replace(/^Fuente:\s*/i, '')}
                                                    </small>
                                                </div>
                                            )}
                                        </Card.Body>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    </Container>
                </div>
            )}

            {/* Empty State if no indicators at all */}
            {indicators.length === 0 && (
                <div className="page-content bg-light pt-0">
                    <Container style={{ maxWidth: '1200px' }}>
                        <Card className="text-center p-5 shadow-sm border-0">
                            <Card.Body>
                                <i className="ri-bar-chart-2-line display-1 text-muted mb-3"></i>
                                <h4>No hay indicadores disponibles</h4>
                                <p className="text-muted">No se han cargado indicadores estratégicos aún.</p>
                            </Card.Body>
                        </Card>
                    </Container>
                </div>
            )}
            
            {/* Minimal Footer */}
            <footer className="bg-white border-top py-4 mt-5">
                <Container className="text-center" style={{ maxWidth: '1200px' }}>
                    <p className="mb-0 text-muted">© {new Date().getFullYear()} Gobierno del Estado de Campeche.</p>
                </Container>
            </footer>
        </React.Fragment>
    );
}
