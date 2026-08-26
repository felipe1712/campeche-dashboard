import React, { useRef } from 'react';
import { useForm } from '@inertiajs/react';
import { Button, Card, Col, Form, Row } from 'react-bootstrap';

export default function UpdatePasswordForm({ className = '' }) {
    const passwordInput: any = useRef();
    const currentPasswordInput: any = useRef();

    const { data, setData, errors, put, reset, processing, recentlySuccessful } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const updatePassword = (e: any) => {
        e.preventDefault();

        put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => reset(),
            onError: (errors) => {
                if (errors.password) {
                    reset('password', 'password_confirmation');
                    passwordInput.current.focus();
                }

                if (errors.current_password) {
                    reset('current_password');
                    currentPasswordInput.current.focus();
                }
            },
        });
    };

    return (
        <React.Fragment>
            <Col className="mt-4">
                <h2 className="mb-3">Actualizar Contraseña</h2>
                <Card>
                    <p className="text-muted p-3 mb-0 pb-0">
                        Asegúrate de que tu cuenta esté usando una contraseña larga y aleatoria para mantenerse segura.
                    </p>
                    <Card.Body>
                        <Form onSubmit={updatePassword} className="mt-6 space-y-6">
                            <Row>
                                <Col lg={6}>
                                    <Form.Label htmlFor="current_password" value="Current Password" className='form-label'> Contraseña Actual</Form.Label>

                                    <Form.Control
                                        id="current_password"
                                        ref={currentPasswordInput}
                                        value={data.current_password}
                                        onChange={(e: any) => setData('current_password', e.target.value)}
                                        type="password"
                                        className="mt-1 block w-100 form-control border"
                                        autoComplete="current-password"
                                    />
                                    <Form.Control.Feedback type="invalid" className='d-block'> {errors.current_password} </Form.Control.Feedback>
                                </Col>

                                <Col lg={6}>
                                    <Form.Label htmlFor="password" value="New Password">Nueva Contraseña</Form.Label>

                                    <Form.Control
                                        id="password"
                                        ref={passwordInput}
                                        value={data.password}
                                        onChange={(e: any) => setData('password', e.target.value)}
                                        type="password"
                                        className="mt-1 block w-100 border"
                                        autoComplete="new-password"
                                    />
                                    <Form.Control.Feedback type="invalid" className='d-block'> {errors.password} </Form.Control.Feedback>
                                </Col>
                            </Row>

                            <Col lg={6} className="mt-3">
                                <Form.Label htmlFor="password_confirmation" value="Confirm Password">Confirmar Contraseña</Form.Label>

                                <Form.Control
                                    id="password_confirmation"
                                    value={data.password_confirmation}
                                    onChange={(e: any) => setData('password_confirmation', e.target.value)}
                                    type="password"
                                    className="mt-1 block w-100 border"
                                    autoComplete="new-password"
                                />
                                <Form.Control.Feedback type="invalid" className='d-block'> {errors.password_confirmation} </Form.Control.Feedback>
                            </Col>

                            <div className="d-flex align-items-center gap-4 mt-4">
                                <Button variant='success' disabled={processing} type='submit' className='btn btn-success'>Guardar Contraseña</Button>

                                {recentlySuccessful && (
                                    <p className="text-sm text-success mb-0 ms-3 fw-bold">¡Contraseña actualizada!</p>
                                )}
                            </div>
                        </Form>
                    </Card.Body>
                </Card>
            </Col>
        </React.Fragment>
    );
}
