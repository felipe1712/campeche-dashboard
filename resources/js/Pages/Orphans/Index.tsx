import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Container, Row, Col, Card, Table, Button, Form, Modal, Alert } from 'react-bootstrap';
import Layout from '../../Layouts';

const OrphanRow = ({ orphan, temas, subtemas, dependencias_list }: any) => {
    const [showModal, setShowModal] = useState(false);
    
    const { data, setData, put, processing, errors } = useForm({
        tema_id: orphan.tema_id || '',
        subtema_id: orphan.subtema_id || '',
        dependencia: orphan.dependencia === 'No Especificada' ? '' : orphan.dependencia,
        titulo: orphan.titulo || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('orphans.update', orphan.id), {
            onSuccess: () => setShowModal(false)
        });
    };

    return (
        <React.Fragment>
            <tr>
                <td><strong>{orphan.clave}</strong></td>
                <td>{orphan.año}</td>
                <td>{orphan.titulo}</td>
                <td>
                    <span className="badge bg-danger">
                        {orphan.tema_id ? 'Dependencia N/A' : 'Sin Tema'}
                    </span>
                </td>
                <td>
                    <Button variant="primary" size="sm" onClick={() => setShowModal(true)}>
                        <i className="ri-edit-2-line align-middle me-1"></i> Asignar
                    </Button>
                </td>
            </tr>

            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Asignar Metadata a: {orphan.clave}</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSubmit}>
                    <Modal.Body>
                        <Row className="g-3">
                            <Col md={12}>
                                <Form.Label>Título</Form.Label>
                                <Form.Control 
                                    type="text" 
                                    value={data.titulo} 
                                    onChange={e => setData('titulo', e.target.value)}
                                    isInvalid={!!errors.titulo}
                                />
                            </Col>
                            <Col md={6}>
                                <Form.Label>Tema</Form.Label>
                                <Form.Select 
                                    value={data.tema_id} 
                                    onChange={e => setData('tema_id', e.target.value)}
                                    isInvalid={!!errors.tema_id}
                                >
                                    <option value="">Selecciona un Tema</option>
                                    {temas.filter((t:any) => t.año === orphan.año).map((tema: any) => (
                                        <option key={tema.id} value={tema.id}>{tema.nombre}</option>
                                    ))}
                                </Form.Select>
                            </Col>
                            <Col md={6}>
                                <Form.Label>Subtema</Form.Label>
                                <Form.Select 
                                    value={data.subtema_id} 
                                    onChange={e => setData('subtema_id', e.target.value)}
                                    isInvalid={!!errors.subtema_id}
                                    disabled={!data.tema_id}
                                >
                                    <option value="">Selecciona un Subtema</option>
                                    {subtemas.filter((s:any) => s.tema_id == data.tema_id).map((sub: any) => (
                                        <option key={sub.id} value={sub.id}>{sub.nombre}</option>
                                    ))}
                                </Form.Select>
                            </Col>
                            <Col md={12}>
                                <Form.Label>Dependencia</Form.Label>
                                <Form.Control 
                                    type="text" 
                                    list="dependenciasList"
                                    value={data.dependencia} 
                                    onChange={e => setData('dependencia', e.target.value)}
                                    isInvalid={!!errors.dependencia}
                                    placeholder="Escribe o selecciona una dependencia"
                                />
                                <datalist id="dependenciasList">
                                    {dependencias_list.map((dep: string, i: number) => (
                                        <option key={i} value={dep} />
                                    ))}
                                </datalist>
                            </Col>
                        </Row>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="light" onClick={() => setShowModal(false)}>Cancelar</Button>
                        <Button type="submit" variant="primary" disabled={processing}>
                            Guardar Asignación
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </React.Fragment>
    );
};

export default function OrphansIndex({ orphans, temas, subtemas, dependencias, flash }: any) {
    return (
        <React.Fragment>
            <Head title="Asignación Manual (Huérfanos)" />
            <div className="page-content">
                <Container fluid>
                    <Row className="mb-3">
                        <Col xs={12}>
                            <h4 className="fs-16 mb-1">Gestor de Indicadores Huérfanos</h4>
                            <p className="text-muted mb-0">Asigna manualmente Temas, Subtemas y Dependencias a las pestañas que no pasaron por la hoja de Índice.</p>
                        </Col>
                    </Row>

                    <Row>
                        <Col lg={12}>
                            <Card>
                                <Card.Header>
                                    <h5 className="card-title mb-0">Indicadores Pendientes ({orphans.total})</h5>
                                </Card.Header>
                                <Card.Body className="p-0">
                                    {flash?.success && <Alert variant="success" className="m-3">{flash.success}</Alert>}
                                    <div className="table-responsive">
                                        <Table className="table-nowrap mb-0 align-middle">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>Clave</th>
                                                    <th>Año</th>
                                                    <th>Título Provisional</th>
                                                    <th>Motivo</th>
                                                    <th>Acción</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {orphans.data.length > 0 ? (
                                                    orphans.data.map((orphan: any) => (
                                                        <OrphanRow 
                                                            key={orphan.id} 
                                                            orphan={orphan} 
                                                            temas={temas}
                                                            subtemas={subtemas}
                                                            dependencias_list={dependencias}
                                                        />
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={5} className="text-center py-4 text-muted">
                                                            ¡Felicidades! No hay indicadores huérfanos pendientes.
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

OrphansIndex.layout = (page: any) => <Layout children={page} />;
