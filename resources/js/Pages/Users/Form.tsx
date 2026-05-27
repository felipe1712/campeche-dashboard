import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { Container, Row, Col, Card, Form, Button } from 'react-bootstrap';
import Layout from '../../Layouts';

export default function UserForm({ user }: any) {
    const isEditing = !!user;

    const { data, setData, post, put, processing, errors } = useForm({
        name: user?.name || '',
        email: user?.email || '',
        password: '',
        password_confirmation: '',
    });

    const handleSubmit = (e: any) => {
        e.preventDefault();
        if (isEditing) {
            put(route('users.update', user.id));
        } else {
            post(route('users.store'));
        }
    };

    return (
        <React.Fragment>
            <Head title={isEditing ? 'Editar Usuario' : 'Nuevo Usuario'} />
            <div className="page-content">
                <Container fluid>
                    <Row className="justify-content-center">
                        <Col lg={8}>
                            <Card>
                                <Card.Header>
                                    <h5 className="card-title mb-0">
                                        {isEditing ? 'Editar Usuario' : 'Crear Nuevo Usuario Evaluador'}
                                    </h5>
                                </Card.Header>
                                <Card.Body>
                                    <Form onSubmit={handleSubmit}>
                                        <div className="mb-3">
                                            <Form.Label>Nombre Completo</Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={data.name}
                                                onChange={e => setData('name', e.target.value)}
                                                isInvalid={!!errors.name}
                                            />
                                            <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
                                        </div>

                                        <div className="mb-3">
                                            <Form.Label>Correo Electrónico</Form.Label>
                                            <Form.Control
                                                type="email"
                                                value={data.email}
                                                onChange={e => setData('email', e.target.value)}
                                                isInvalid={!!errors.email}
                                            />
                                            <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
                                        </div>

                                        <div className="mb-3">
                                            <Form.Label>Contraseña {isEditing && <small className="text-muted">(Dejar en blanco si no se desea cambiar)</small>}</Form.Label>
                                            <Form.Control
                                                type="password"
                                                value={data.password}
                                                onChange={e => setData('password', e.target.value)}
                                                isInvalid={!!errors.password}
                                            />
                                            <Form.Control.Feedback type="invalid">{errors.password}</Form.Control.Feedback>
                                        </div>

                                        <div className="mb-4">
                                            <Form.Label>Confirmar Contraseña</Form.Label>
                                            <Form.Control
                                                type="password"
                                                value={data.password_confirmation}
                                                onChange={e => setData('password_confirmation', e.target.value)}
                                            />
                                        </div>

                                        <div className="d-flex justify-content-end gap-2">
                                            <Link href={route('users.index')} className="btn btn-light">
                                                Cancelar
                                            </Link>
                                            <Button type="submit" variant="success" disabled={processing}>
                                                {isEditing ? 'Guardar Cambios' : 'Crear Usuario'}
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

UserForm.layout = (page: any) => <Layout children={page} />;
