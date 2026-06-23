import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { Container, Row, Col, Card, Accordion, Form, Button } from 'react-bootstrap';
import Layout from '../../Layouts';

interface Props {
    groupedIndicators: Record<string, any[]>;
}

export default function IndicatorsAdmin({ groupedIndicators }: Props) {
    const [savingId, setSavingId] = useState<number | null>(null);

    const handleSave = (indicator: any) => {
        setSavingId(indicator.id);
        
        // Find the form element nearest to this button
        const formEl = document.getElementById(`form-indicator-${indicator.id}`) as HTMLFormElement;
        if (!formEl) return;

        const formData = new FormData(formEl);
        const data = {
            titulo: formData.get('titulo') as string,
            tipo_grafica: formData.get('tipo_grafica') as string,
        };

        router.put(route('admin.indicadores.update', indicator.id), data, {
            preserveScroll: true,
            onFinish: () => setSavingId(null)
        });
    };

    return (
        <React.Fragment>
            <Head title="Administrar Indicadores" />
            <div className="page-content">
                <Container fluid>
                    <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                        <h4 className="mb-sm-0">Administrar Indicadores Estratégicos</h4>
                    </div>

                    <Row>
                        <Col lg={12}>
                            <Card>
                                <Card.Body>
                                    <p className="text-muted mb-4">
                                        Modifica el título o el tipo de gráfica por defecto para los indicadores estratégicos. 
                                        Los indicadores están agrupados por Misión.
                                    </p>

                                    <Accordion defaultActiveKey="0">
                                        {Object.entries(groupedIndicators).map(([mision, indicators], mIndex) => {
                                            const missionName = (usePage<any>().props.missions || {})[mision] || `Misión ${mision}`;
                                            return (
                                            <Accordion.Item eventKey={mIndex.toString()} key={mision}>
                                                <Accordion.Header>
                                                    <strong className="fs-15">{missionName}</strong>
                                                    <span className="badge bg-primary ms-2">{indicators.length} indicadores</span>
                                                </Accordion.Header>
                                                <Accordion.Body>
                                                    {indicators.map((ind) => (
                                                        <Card key={ind.id} className="border shadow-none mb-3">
                                                            <Card.Body>
                                                                <form id={`form-indicator-${ind.id}`} onSubmit={(e) => { e.preventDefault(); handleSave(ind); }}>
                                                                    <Row className="align-items-center">
                                                                        <Col lg={2}>
                                                                            <strong>{ind.clave}</strong>
                                                                        </Col>
                                                                        <Col lg={5}>
                                                                            <Form.Group>
                                                                                <Form.Label className="mb-1 text-muted small">Título del Indicador</Form.Label>
                                                                                <Form.Control 
                                                                                    type="text" 
                                                                                    name="titulo" 
                                                                                    defaultValue={ind.titulo} 
                                                                                    required
                                                                                />
                                                                            </Form.Group>
                                                                        </Col>
                                                                        <Col lg={3}>
                                                                            <Form.Group>
                                                                                <Form.Label className="mb-1 text-muted small">Tipo de Gráfica</Form.Label>
                                                                                <Form.Select name="tipo_grafica" defaultValue={ind.tipo_grafica || 'bar'}>
                                                                                    <option value="bar">Barras Verticales</option>
                                                                                    <option value="bar-horizontal">Barras Horizontales</option>
                                                                                    <option value="pie">Pastel</option>
                                                                                    <option value="donut">Dona</option>
                                                                                    <option value="area">Gráfica de Área</option>
                                                                                </Form.Select>
                                                                            </Form.Group>
                                                                        </Col>
                                                                        <Col lg={2} className="text-end">
                                                                            <Button 
                                                                                variant="success" 
                                                                                type="submit"
                                                                                disabled={savingId === ind.id}
                                                                                className="mt-3"
                                                                            >
                                                                                {savingId === ind.id ? 'Guardando...' : 'Guardar'}
                                                                            </Button>
                                                                        </Col>
                                                                    </Row>
                                                                </form>
                                                            </Card.Body>
                                                        </Card>
                                                    ))}
                                                </Accordion.Body>
                                            </Accordion.Item>
                                            );
                                        })}
                                    </Accordion>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
        </React.Fragment>
    );
}

IndicatorsAdmin.layout = (page: any) => <Layout children={page} />;
