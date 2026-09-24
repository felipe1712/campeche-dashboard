import React, { useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Container, Row, Col } from 'react-bootstrap';
import CampecheLogo from '../../../images/logo-informe.png';
import ComparativaGeografica from '../../Components/ComparativaGeografica';

export default function LandingComparativa({ indicators = [], filters = {} }: any) {
    
    useEffect(() => {
        document.body.setAttribute("data-theme", "default");
        document.body.setAttribute("data-bs-theme", "light");
        document.body.setAttribute("data-layout-mode", "light");
        return () => {
            document.body.removeAttribute("data-bs-theme");
            document.body.removeAttribute("data-theme");
            document.body.removeAttribute("data-layout-mode");
        };
    }, []);

    return (
        <React.Fragment>
            <Head title="Comparativa Geográfica - Campeche" />

            {/* Top Navigation */}
            <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom shadow-sm">
                <Container style={{ maxWidth: '1200px' }}>
                    <Link className="navbar-brand d-flex align-items-center" href="/">
                        <img src={CampecheLogo} alt="Logo Campeche" height="65" className="me-3 rounded shadow-sm" />
                        <div className="d-flex flex-column">
                            <span className="fw-bold fs-18 text-primary" style={{ lineHeight: '1.2' }}>Indicadores Estratégicos</span>
                            <span className="text-muted fs-12">5° Informe de Gobierno</span>
                        </div>
                    </Link>
                    <div className="collapse navbar-collapse d-flex ms-4">
                        <ul className="navbar-nav me-auto mb-2 mb-lg-0 fw-bold">
                            <li className="nav-item me-3">
                                <Link className="nav-link" href={route('landing.index')}>Inicio</Link>
                            </li>
                            <li className="nav-item">
                                <Link className="nav-link active text-primary" aria-current="page" href={route('landing.comparativa')}>Comparativa Geográfica</Link>
                            </li>
                        </ul>
                    </div>
                    <div className="ms-auto">
                        <Link href={route('login')} className="btn btn-primary btn-sm px-3 rounded-pill shadow-sm">
                            <i className="ri-user-settings-line align-middle me-1"></i> Acceso a Servidores Públicos
                        </Link>
                    </div>
                </Container>
            </nav>

            {/* Content Section */}
            <div className="bg-light py-5 min-vh-100">
                <Container style={{ maxWidth: '1400px' }}>
                    <Row>
                        <Col lg={12}>
                            <ComparativaGeografica indicators={indicators} />
                        </Col>
                    </Row>
                </Container>
            </div>
            
            {/* Footer */}
            <footer className="py-4 text-center text-white" style={{ backgroundColor: '#7D1638' }}>
                <Container>
                    <p className="mb-0">© {new Date().getFullYear()} Gobierno del Estado de Campeche.</p>
                </Container>
            </footer>
        </React.Fragment>
    );
}
