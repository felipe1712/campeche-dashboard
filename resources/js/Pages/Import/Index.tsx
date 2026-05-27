import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import Layout from '../../Layouts';

export default function ImportIndex({ flash }: any) {
    const { data, setData, post, processing, errors, progress } = useForm({
        file: null as File | null,
        year: 2025,
        mision: '1',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('import.store'));
    };

    return (
        <React.Fragment>
            <Head title="Gestor de Carga de Excel" />
            <div className="page-content">
                <Container fluid>
                    <Row className="justify-content-center">
                        <Col lg={8}>
                            <Card>
                                <Card.Header>
                                    <h5 className="card-title mb-0">Gestor de Carga de Indicadores (Excel)</h5>
                                </Card.Header>
                                <Card.Body>
                                    {flash?.success && <Alert variant="success">{flash.success}</Alert>}
                                    {flash?.error && <Alert variant="danger">{flash.error}</Alert>}

                                    <div className="alert alert-info">
                                        <strong>ℹ️ ¿Cómo funciona?</strong> Selecciona un archivo Excel. El sistema analizará todas las pestañas automáticamente, buscará las cabeceras e importará los datos de los indicadores. Ignorará las pestañas llamadas "Índice".
                                    </div>

                                    <Form onSubmit={submit}>
                                        <Row className="mb-3">
                                            <Col md={6}>
                                                <Form.Label>Año de los datos</Form.Label>
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
                                            </Col>
                                            <Col md={6}>
                                                <Form.Label>Misión (Eje de Gobierno)</Form.Label>
                                                <Form.Select 
                                                    value={data.mision} 
                                                    onChange={e => setData('mision', e.target.value)}
                                                    isInvalid={!!errors.mision}
                                                >
                                                    <option value="1">Misión 1</option>
                                                    <option value="2">Misión 2</option>
                                                    <option value="3">Misión 3</option>
                                                    <option value="4">Misión 4</option>
                                                    <option value="5">Misión 5</option>
                                                </Form.Select>
                                                <Form.Control.Feedback type="invalid">{errors.mision}</Form.Control.Feedback>
                                            </Col>
                                        </Row>

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
                                                {processing ? 'Procesando archivo, por favor espera...' : 'Subir y Procesar'}
                                            </Button>
                                        </div>
                                    </Form>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
        </React.Fragment>
    );
}

ImportIndex.layout = (page: any) => <Layout children={page} />;
