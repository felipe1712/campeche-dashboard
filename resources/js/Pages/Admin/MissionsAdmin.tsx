import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import Layout from '../../Layouts';

export default function MissionsAdmin({ missionsData }: any) {
    const [missions, setMissions] = useState(missionsData);
    const [processing, setProcessing] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleNameChange = (id: number, value: string) => {
        setMissions(missions.map((m: any) => m.id === id ? { ...m, nombre: value } : m));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setSuccess(false);

        router.post(route('admin.misiones.update'), {
            missions: missions
        }, {
            onSuccess: () => {
                setProcessing(false);
                setSuccess(true);
                setTimeout(() => setSuccess(false), 3000);
            },
            onError: () => {
                setProcessing(false);
            }
        });
    };

    return (
        <Layout>
            <Head title="Administrar Misiones" />
            <div className="page-content">
                <Container fluid>
                    <div className="row mb-3 pb-1">
                        <div className="col-12">
                            <div className="d-flex align-items-lg-center flex-lg-row flex-column">
                                <div className="flex-grow-1">
                                    <h4 className="fs-16 mb-1">Administrar Títulos de Misiones</h4>
                                    <p className="text-muted mb-0">Personaliza los títulos de las misiones para que se reflejen en todo el sistema.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Card>
                        <Card.Body>
                            {success && (
                                <Alert variant="success">
                                    Los títulos de las misiones se han actualizado correctamente.
                                </Alert>
                            )}
                            
                            <Form onSubmit={handleSubmit}>
                                {missions.map((mission: any) => (
                                    <Form.Group className="mb-3" key={mission.id}>
                                        <Form.Label>Misión {mission.numero}</Form.Label>
                                        <Form.Control 
                                            type="text" 
                                            value={mission.nombre} 
                                            onChange={(e) => handleNameChange(mission.id, e.target.value)}
                                            required 
                                        />
                                    </Form.Group>
                                ))}

                                <div className="mt-4">
                                    <Button type="submit" variant="primary" disabled={processing}>
                                        {processing ? 'Guardando...' : 'Guardar Cambios'}
                                    </Button>
                                </div>
                            </Form>
                        </Card.Body>
                    </Card>
                </Container>
            </div>
        </Layout>
    );
}
