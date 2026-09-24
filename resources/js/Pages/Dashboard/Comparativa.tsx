import React from 'react';
import Layout from '../../Layouts';
import { Head } from '@inertiajs/react';
import { Col, Container, Row } from 'react-bootstrap';
import ComparativaGeografica from '../../Components/ComparativaGeografica';

export default function DashboardComparativa({ indicators, filters }: any) {
    return (
        <React.Fragment>
            <Head title="Comparativa Geográfica | Admin" />
            <div className="page-content">
                <Container fluid>
                    <Row className="mb-3">
                        <Col>
                            <h4 className="mb-sm-0">Comparativa Geográfica (Misión {filters?.mision || '1'})</h4>
                        </Col>
                    </Row>
                    <Row>
                        <Col lg={12}>
                            <ComparativaGeografica indicators={indicators} />
                        </Col>
                    </Row>
                </Container>
            </div>
        </React.Fragment>
    );
}

DashboardComparativa.layout = (page: any) => <Layout children={page} />;
