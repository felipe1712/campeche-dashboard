import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Container, Row, Col, Card, Form, Button, Alert, Table, Badge } from 'react-bootstrap';
import Layout from '../../Layouts';

export default function CatalogIndex({ temas, flash }: any) {
    const { data, setData, post, processing, errors, progress } = useForm({
        file: null as File | null,
        year: new Date().getFullYear(),
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('catalog.store'));
    };

    return (
        <React.Fragment>
            <Head title="Catálogos Globales" />
            <div className="page-content">
                <Container fluid>
                    <Row>
                        <Col lg={4}>
                            <Card>
                                <Card.Header>
                                    <h5 className="card-title mb-0">Subir Catálogo Oficial</h5>
                                </Card.Header>
                                <Card.Body>
                                    {flash?.success && <Alert variant="success">{flash.success}</Alert>}
                                    {flash?.error && <Alert variant="danger">{flash.error}</Alert>}

                                    <div className="alert alert-info fs-13">
                                        Sube un archivo Excel que contenga como encabezados (fila 1) las columnas <strong>"Tema"</strong> y opcionalmente <strong>"Subtema"</strong>.
                                    </div>

                                    <Form onSubmit={submit}>
                                        <div className="mb-3">
                                            <Form.Label>Año de Vigencia</Form.Label>
                                            <Form.Select 
                                                value={data.year} 
                                                onChange={e => setData('year', parseInt(e.target.value))}
                                                isInvalid={!!errors.year}
                                            >
                                                {[2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030].map(y => (
                                                    <option key={y} value={y}>{y}</option>
                                                ))}
                                            </Form.Select>
                                            <Form.Control.Feedback type="invalid">{errors.year}</Form.Control.Feedback>
                                        </div>

                                        <div className="mb-4">
                                            <Form.Label>Archivo Excel (.xlsx, .xls)</Form.Label>
                                            <Form.Control 
                                                type="file" 
                                                accept=".xlsx, .xls"
                                                onChange={(e: any) => setData('file', e.target.files[0])}
                                                isInvalid={!!errors.file}
                                            />
                                            <Form.Control.Feedback type="invalid">{errors.file}</Form.Control.Feedback>
                                            {progress && (
                                                <div className="progress mt-2">
                                                    <div 
                                                        className="progress-bar progress-bar-striped progress-bar-animated bg-success" 
                                                        role="progressbar" 
                                                        style={{ width: `${progress.percentage}%` }}
                                                    >
                                                        {progress.percentage}%
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="text-end">
                                            <Button type="submit" variant="primary" disabled={processing || !data.file}>
                                                {processing ? 'Subiendo...' : 'Procesar Catálogo'}
                                            </Button>
                                        </div>
                                    </Form>
                                </Card.Body>
                            </Card>
                        </Col>
                        
                        <Col lg={8}>
                            <Card>
                                <Card.Header>
                                    <h5 className="card-title mb-0">Catálogo de Temas Registrados</h5>
                                </Card.Header>
                                <Card.Body>
                                    <div className="table-responsive">
                                        <Table className="table-nowrap table-bordered align-middle mb-0">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>Año</th>
                                                    <th>Tema Principal</th>
                                                    <th>Subtemas Vinculados</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {temas.map((tema: any) => (
                                                    <tr key={tema.id}>
                                                        <td><Badge bg="secondary">{tema.año}</Badge></td>
                                                        <td className="fw-medium text-primary">{tema.nombre}</td>
                                                        <td>
                                                            <div className="d-flex flex-wrap gap-1">
                                                                {tema.subtemas?.length > 0 ? (
                                                                    tema.subtemas.map((s: any) => (
                                                                        <Badge bg="light" text="dark" key={s.id} className="border">
                                                                            {s.nombre}
                                                                        </Badge>
                                                                    ))
                                                                ) : (
                                                                    <span className="text-muted fst-italic">Sin subtemas</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {temas.length === 0 && (
                                                    <tr>
                                                        <td colSpan={3} className="text-center py-4 text-muted">
                                                            No hay catálogos registrados. Sube el primero desde el formulario.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </Table>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
        </React.Fragment>
    );
}

CatalogIndex.layout = (page: any) => <Layout children={page} />;
