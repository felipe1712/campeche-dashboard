import React, { useEffect, useState } from 'react';
import GuestLayout from '../../Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import logoLight from "../../../images/logo-light.png";
import { Container, Row, Col, Card, Form, Button } from 'react-bootstrap';

export default function Login({ status, canResetPassword }: any) {

    const [passwordShow, setPasswordShow] = useState<boolean>(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        email: 'admin@themesbrand.com' || '',
        password: '12345678' || '',
        remember: false,
    });

    useEffect(() => {
        return () => {
            reset('password');
        };
    }, []);

    const submit = (e: any) => {
        e.preventDefault();
        post(route('login'));
    };

    return (
        <React.Fragment>
            <GuestLayout>
                <Head title="Basic SignIn | Velzon - React Admin & Dashboard Template" />
                <div className="auth-page-content mt-lg-5">
                    <Container>
                        <Row>
                            <Col lg={12}>
                                <div className="text-center mt-sm-5 mb-4 text-white-50">
                                    <div>
                                        <Link href='/' className="d-inline-block auth-logo">
                                            <h2 className="text-white fw-bold mb-0">Tablero de Indicadores</h2>
                                            <h4 className="text-white-50">5to Informe de Gobierno</h4>
                                        </Link>
                                    </div>
                                    <p className="mt-3 fs-15 fw-medium">Sistema de Indicadores y Estadística</p>
                                </div>
                            </Col>
                        </Row>

                        <Row className="justify-content-center">
                            <Col md={8} lg={6} xl={5}>
                                <Card className="mt-4">
                                    <Card.Body className='p-4'>
                                        <div className="text-center mt-2">
                                            <h5 className="text-primary">¡Bienvenido!</h5>
                                            <p className="text-muted">Inicia sesión para continuar.</p>
                                        </div>
                                        {status && <div className="mb-4 font-medium text-sm text-green-600">{status}</div>}
                                        <div className='p-2 mt-4'>
                                            <Form onSubmit={submit}>
                                                <div className='mb-3'>
                                                    <Form.Label className='form-label' htmlFor="email" value="Correo electrónico" > Correo electrónico </Form.Label>
                                                    <span className="text-danger ms-1">*</span>
                                                    <Form.Control
                                                        id="email"
                                                        type="email"
                                                        name="email"
                                                        placeholder="Ingresa tu correo"
                                                        value={data.email}
                                                        className={'mb-1 ' + (errors.email ? 'is-invalid' : ' ')}
                                                        autoComplete="username"
                                                        autoFocus
                                                        required
                                                        onChange={(e: any) => setData('email', e.target.value)}
                                                    />

                                                    <Form.Control.Feedback type="invalid" className='d-block mt-2'> {errors.email} </Form.Control.Feedback>
                                                </div>

                                                <div className="mb-3">
                                                    <div className="float-end">

                                                        {canResetPassword && (
                                                            <Link href={route('password.request')} className="text-muted">¿Olvidaste tu contraseña?</Link>
                                                        )}
                                                    </div>

                                                    <Form.Label className='form-label' htmlFor="password" value="Contraseña" > Contraseña </Form.Label>
                                                    <span className="text-danger ms-1">*</span>
                                                    <div className="position-relative auth-pass-inputgroup mb-3">

                                                        <Form.Control
                                                            id="password"
                                                            type={passwordShow ? "text" : "password"}
                                                            name="password"
                                                            value={data.password}
                                                            placeholder="Ingresa tu contraseña"
                                                            required
                                                            className={'mt-1 ' + (errors.password ? 'is-invalid' : ' ')}
                                                            autoComplete="current-password"
                                                            onChange={(e: any) => setData('password', e.target.value)}
                                                        />
                                                       
                                                        <Form.Control.Feedback type="invalid" className='d-block mt-2'> {errors.password} </Form.Control.Feedback>
                                                        <button className="btn btn-link position-absolute end-0 top-0 text-decoration-none text-muted material-shadow-none" type="button" id="password-addon" onClick={() => setPasswordShow(!passwordShow)}><i className="ri-eye-fill align-middle"></i></button>
                                                    </div>
                                                </div>

                                                <div className="block mt-4">
                                                    <label className="flex items-center">
                                                        <Form.Check.Input
                                                            className='form-check-input'
                                                            name="remember"
                                                            checked={data.remember}
                                                            onChange={(e: any) => setData('remember', e.target.checked)}
                                                        />
                                                        <Form.Check.Label className="form-check-label" htmlFor="auth-remember-check">
                                                            <span className='ms-2'>Recordarme</span>
                                                        </Form.Check.Label>
                                                    </label>
                                                </div>

                                                <div className="mt-4">

                                                    <Button type="submit" className="btn w-100" style={{ backgroundColor: '#9D2449', borderColor: '#9D2449', color: '#fff' }} disabled={processing}>
                                                        Iniciar Sesión
                                                    </Button>
                                                </div>

                                                <div className="mt-4 text-center">
                                                    {/* Eliminado: Sign In with Social Networks */}
                                                </div>
                                            </Form>
                                        </div>
                                    </Card.Body>
                                </Card>
                                <div className="mt-4 text-center">
                                    <p className="mb-0 text-muted"><i className="ri-lock-fill align-middle me-1"></i> El acceso a este sistema está restringido a personal autorizado.</p>
                                </div>
                            </Col>
                        </Row>
                    </Container>
                </div>

            </GuestLayout>
        </React.Fragment>
    );
}

