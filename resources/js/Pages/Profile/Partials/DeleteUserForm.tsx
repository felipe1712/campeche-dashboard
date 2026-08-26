import React, { useRef, useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Button, Card, Col, Container, Form, Modal, Row } from 'react-bootstrap';

export default function DeleteUserForm({ className = '' }) {
    const [confirmingUserDeletion, setConfirmingUserDeletion] = useState<boolean>(false);
    const passwordInput: any = useRef();

    const {
        data,
        setData,
        delete: destroy,
        processing,
        reset,
        errors,
    } = useForm({
        password: '',
    });

    const confirmUserDeletion = () => {
        setConfirmingUserDeletion(true);
    };

    const deleteUser = (e: any) => {
        e.preventDefault();

        destroy(route('profile.destroy'), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onError: () => passwordInput.current.focus(),
            onFinish: () => reset(),
        });
    };

    const closeModal = () => {
        setConfirmingUserDeletion(false);

        reset();
    };

    return (
        <React.Fragment>
            <Row>
                <Col lg={12} className="mt-4">
                    <h2 className="mb-3">Eliminar Cuenta</h2>
                    <Card>
                        <p className="text-muted p-3 mb-0 pb-0">
                            Una vez que se elimine tu cuenta, todos sus recursos y datos se eliminarán permanentemente. Antes de
                            eliminar tu cuenta, por favor descarga cualquier dato o información que desees conservar.
                        </p>
                        <Col lg={6} className="p-3">
                            <Button variant="danger" onClick={confirmUserDeletion} type='button' className='btn btn-danger m-2'>Eliminar Cuenta</Button>
                        </Col>
                    </Card>
                </Col>
            </Row>
            <Modal show={confirmingUserDeletion} onHide={closeModal} centered>
                <Modal.Header className="bg-light p-3" closeButton>
                    <h5 className='modal-title'>
                        ¿Estás seguro de que quieres eliminar tu cuenta?
                    </h5>
                </Modal.Header>
                <Form onSubmit={deleteUser} className="p-6">
                    <Modal.Body>
                        <div className="mt-3">
                            <p className="mt-1">
                                Una vez que se elimine tu cuenta, todos sus recursos y datos se eliminarán permanentemente. Por favor,
                                ingresa tu contraseña para confirmar que deseas eliminar tu cuenta de forma permanente.
                            </p>
                            <Form.Label htmlFor="password" value="Password" className="sr-only">Contraseña</Form.Label>

                            <Form.Control
                                id="password"
                                type="password"
                                name="password"
                                ref={passwordInput}
                                value={data.password}
                                onChange={(e: any) => setData('password', e.target.value)}
                                className="mt-1 block w-100"
                                autoFocus
                                placeholder="Contraseña"
                            />
                            <Form.Control.Feedback type="invalid" className='d-block'> {errors.password} </Form.Control.Feedback>
                        </div>
                    </Modal.Body>
                    <div className="mt-4 mb-4 d-flex justify-content-end px-3">
                        <Button variant='light' onClick={closeModal} className='btn ms-2' type='button'>Cancelar</Button>

                        <Button variant='danger' className="btn ms-3" disabled={processing} type='submit'>
                            Eliminar Cuenta
                        </Button>
                    </div>
                </Form>
            </Modal>
        </React.Fragment>
    );
}
