import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Container, Row, Col, Card, Form, Table, Button, Collapse } from 'react-bootstrap';
import Layout from '../../Layouts';
import DynamicChart from './DynamicChart';
import ErrorBoundary from '../../Components/ErrorBoundary';

const IndicatorRow = ({ indicator }: any) => {
    const [open, setOpen] = useState(false);
    const dynamicData = indicator.metadata_dinamica || [];

    return (
        <React.Fragment>
            {/* Summary row */}
            <tr
                onClick={() => setOpen(!open)}
                style={{ cursor: 'pointer' }}
                className={open ? 'table-active' : ''}
            >
                <td style={{ whiteSpace: 'nowrap' }}><strong>{indicator.clave}</strong></td>
                <td>{indicator.titulo}</td>
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

export default function DashboardIndex({ indicators, temas, subtemas, dependencias, filters }: any) {
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
                                                        <IndicatorRow key={indicator.id} indicator={indicator} />
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
                                                    onClick={() => link.url && router.get(link.url, {}, { preserveScroll: true })}
                                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </Card.Footer>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
        </React.Fragment>
    );
}

DashboardIndex.layout = (page: any) => <Layout children={page} />;
