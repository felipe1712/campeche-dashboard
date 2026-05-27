import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { Container, Row, Col, Card, Table, Button } from 'react-bootstrap';
import Layout from '../../Layouts';

export default function Index({ users, flash }: any) {
    const { delete: destroy } = useForm();

    const handleDelete = (id: number) => {
        if (confirm('¿Estás seguro de eliminar este usuario?')) {
            destroy(route('users.destroy', id));
        }
    };

    return (
        <React.Fragment>
            <Head title="Gestión de Usuarios" />
            <div className="page-content">
                <Container fluid>
                    <Row>
                        <Col lg={12}>
                            <Card>
                                <Card.Header className="d-flex justify-content-between align-items-center">
                                    <h5 className="card-title mb-0">Gestión de Evaluadores</h5>
                                    <Link href={route('users.create')} className="btn btn-primary">
                                        <i className="ri-add-line align-bottom me-1"></i> Nuevo Usuario
                                    </Link>
                                </Card.Header>
                                <Card.Body>
                                    {flash?.success && <div className="alert alert-success">{flash.success}</div>}
                                    {flash?.error && <div className="alert alert-danger">{flash.error}</div>}
                                    
                                    <div className="table-responsive">
                                        <Table className="table-nowrap table-bordered align-middle mb-0">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>ID</th>
                                                    <th>Nombre</th>
                                                    <th>Email</th>
                                                    <th>Fecha de Registro</th>
                                                    <th>Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {users.map((user: any) => (
                                                    <tr key={user.id}>
                                                        <td>{user.id}</td>
                                                        <td>{user.name}</td>
                                                        <td>{user.email}</td>
                                                        <td>{new Date(user.created_at).toLocaleDateString()}</td>
                                                        <td>
                                                            <div className="d-flex gap-2">
                                                                <Link href={route('users.edit', user.id)} className="btn btn-sm btn-info">
                                                                    Editar
                                                                </Link>
                                                                <Button variant="danger" size="sm" onClick={() => handleDelete(user.id)}>
                                                                    Eliminar
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {users.length === 0 && (
                                                    <tr>
                                                        <td colSpan={5} className="text-center">No hay usuarios registrados.</td>
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

Index.layout = (page: any) => <Layout children={page} />;
