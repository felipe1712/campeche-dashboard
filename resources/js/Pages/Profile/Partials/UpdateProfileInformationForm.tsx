import InputError from '../../../Components/InputError';
import { Link, useForm, usePage } from '@inertiajs/react';
import { Button, Card, Col, Form, Row } from 'react-bootstrap';
import React from 'react';

export default function UpdateProfileInformation({ mustVerifyEmail, status, className = '' }: any) {
    const user = usePage().props.auth.user;

    const { data, setData, patch, errors, processing, recentlySuccessful } = useForm({
        name: user.name,
        email: user.email,
    });

    const submit = (e: any) => {
        e.preventDefault();

        patch(route('profile.update'));
    };

    return (
        <React.Fragment>
            <Col>
                <h2 className="mb-3">Información del Perfil</h2>
            <Card>

                <p className="text-muted p-3 mb-0 pb-0">
                    Actualiza la información del perfil y la dirección de correo electrónico de tu cuenta.
                </p>
                <Card.Body>
                    <Form onSubmit={submit} className="mt-6 space-y-6">
                        <Row>
                            <Col lg={6}>
                                <Form.Label htmlFor="name">Nombre</Form.Label>

                                <Form.Control
                                    id="name"
                                    className="mt-1 block w-full border"
                                    value={data.name}
                                    onChange={(e: any) => setData('name', e.target.value)}
                                    required
                                    autoFocus
                                    autoComplete="name"
                                />

                                <InputError className="mt-2" message={errors.name} />
                            </Col>

                            <Col lg={6}>
                                <Form.Label htmlFor="email">Correo Electrónico</Form.Label>

                                <Form.Control
                                    id="email"
                                    type="email"
                                    className="mt-1 block w-full border"
                                    value={data.email}
                                    onChange={(e: any) => setData('email', e.target.value)}
                                    required
                                    autoComplete="username"
                                />

                                <InputError className="mt-2" message={errors.email} />
                            </Col>
                        </Row>

                        {mustVerifyEmail && user.email_verified_at === null && (
                            <div>
                                <p className="text-sm mt-2 text-gray-800">
                                    Tu dirección de correo electrónico no está verificada.
                                    <Link
                                        href={route('verification.send')}
                                        method="post"
                                        as="button"
                                        className="underline text-sm text-gray-600 hover:text-gray-900 rounded-md focus:outline-none"
                                    >
                                        Haz clic aquí para reenviar el correo de verificación.
                                    </Link>
                                </p>

                                {status === 'verification-link-sent' && (
                                    <div className="mt-2 font-medium text-sm text-success">
                                        Se ha enviado un nuevo enlace de verificación a tu correo electrónico.
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="d-flex align-items-center gap-4 mt-4">
                            <Button variant="success" disabled={processing} type='submit' className='btn btn-success'>Guardar Cambios</Button>

                            {recentlySuccessful && (
                                <p className="text-sm text-success mb-0 ms-3 fw-bold">¡Guardado correctamente!</p>
                            )}
                        </div>
                    </Form>
                </Card.Body>
            </Card>
            </Col>
        </React.Fragment>
    );
}
