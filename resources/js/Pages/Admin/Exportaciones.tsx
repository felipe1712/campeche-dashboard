import React, { useState, useEffect, useRef } from 'react';
import { Head, router } from '@inertiajs/react';
import { Container, Card, Form, Button, Row, Col, Alert, Spinner } from 'react-bootstrap';
import Layout from '../../Layouts';
import DynamicChart from '../Dashboard/DynamicChart';
import axios from 'axios';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface Props {
    años: string[];
    misiones: string[];
    indicatorsList: any[];
}

export default function Exportaciones({ años, misiones, indicatorsList }: Props) {
    const [selectedMision, setSelectedMision] = useState<string>('Todas');
    const [selectedAño, setSelectedAño] = useState<string>('Todos');
    const [selectedIndicator, setSelectedIndicator] = useState<string>('all');
    
    const [previewData, setPreviewData] = useState<any>(null);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [pdfProgress, setPdfProgress] = useState('');
    
    const exportRef = useRef<HTMLDivElement>(null);
    
    // Filter indicators based on mision and año
    const filteredIndicators = indicatorsList.filter(ind => {
        let matchMision = selectedMision === 'Todas' ? true : ind.mision === selectedMision;
        let matchAño = selectedAño === 'Todos' ? true : String(ind.año) === String(selectedAño);
        return matchMision && matchAño;
    });

    useEffect(() => {
        const fetchIndicatorData = async () => {
            setLoadingPreview(true);
            try {
                const params: any = { id: selectedIndicator };
                if (selectedIndicator === 'all') {
                    params.mision = selectedMision;
                    params.año = selectedAño;
                }
                const response = await axios.get('/admin/exportaciones/data', { params });
                setPreviewData(response.data);
            } catch (error) {
                console.error("Error fetching data", error);
            } finally {
                setLoadingPreview(false);
            }
        };

        fetchIndicatorData();
    }, [selectedIndicator, selectedMision, selectedAño]);

    const handleExportExcel = () => {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = '/admin/exportaciones/excel';
        
        const csrfToken = document.head.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        if (csrfToken) {
            const csrfInput = document.createElement('input');
            csrfInput.type = 'hidden';
            csrfInput.name = '_token';
            csrfInput.value = csrfToken;
            form.appendChild(csrfInput);
        }

        const misionInput = document.createElement('input');
        misionInput.type = 'hidden';
        misionInput.name = 'mision';
        misionInput.value = selectedMision;
        form.appendChild(misionInput);

        const añoInput = document.createElement('input');
        añoInput.type = 'hidden';
        añoInput.name = 'año';
        añoInput.value = selectedAño;
        form.appendChild(añoInput);

        const idInput = document.createElement('input');
        idInput.type = 'hidden';
        idInput.name = 'indicator_id';
        idInput.value = selectedIndicator;
        form.appendChild(idInput);

        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
    };

    const handleExportPDF = async () => {
        if (!exportRef.current) return;
        
        setIsGeneratingPdf(true);
        setPdfProgress('Iniciando...');
        // Find all pages to capture
        const pages = Array.from(exportRef.current.querySelectorAll('.pdf-indicator-page'));
        const elementsToCapture = pages.length > 0 ? pages : [exportRef.current];
        
        try {
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            // Inject temporary style to kill box-shadows and animations, which ruin html2canvas performance
            const style = document.createElement('style');
            style.id = 'pdf-perf-style';
            // We removed 'animation: none' so the spinner keeps spinning!
            style.innerHTML = '* { box-shadow: none !important; border-radius: 0 !important; transition: none !important; }';
            document.head.appendChild(style);

            for (let i = 0; i < elementsToCapture.length; i++) {
                setPdfProgress('Procesando ' + (i + 1) + ' de ' + elementsToCapture.length);
                await new Promise(r => setTimeout(r, 200));

                const element = elementsToCapture[i] as HTMLElement;
                const originalBg = element.style.backgroundColor;
                element.style.backgroundColor = '#ffffff';
                element.style.padding = '20px';

                // Instead of moving to an overlay, we will force the Bootstrap container to be 1400px
                const originalWidth = element.style.width;
                const originalMaxWidth = element.style.maxWidth;
                element.style.width = '1400px';
                element.style.maxWidth = '1400px';
                
                // Find the parent column (e.g. col-lg-8) and force it to wrap this huge width
                let colContainer = element.closest('.col-lg-8') as HTMLElement;
                let originalColOverflow = '';
                if (colContainer) {
                    originalColOverflow = colContainer.style.overflow;
                    colContainer.style.overflow = 'visible';
                }

                // Remove table-responsive overflow to prevent scrollbars from hiding content
                const tables = element.querySelectorAll('.table-responsive');
                const originalOverflows: string[] = [];
                tables.forEach((t, idx) => {
                    originalOverflows[idx] = (t as HTMLElement).style.overflow;
                    (t as HTMLElement).style.overflow = 'visible';
                });

                // Force window resize event so ApexCharts reacts immediately
                window.dispatchEvent(new Event('resize'));

                // Wait 800ms to allow ApexCharts to resize its SVG to the new 1400px width
                await new Promise(r => setTimeout(r, 800));

                const canvas = await html2canvas(element, { 
                    scale: 1.3,
                    useCORS: true,
                    logging: false,
                    windowWidth: 1400,
                    ignoreElements: (node) => {
                        // Ignore other indicator pages to prevent massive DOM cloning
                        if (node.classList && node.classList.contains('pdf-indicator-page') && node !== element) {
                            return true;
                        }
                        return false;
                    }
                });
                
                element.style.backgroundColor = originalBg;
                element.style.padding = '0';
                
                element.style.width = originalWidth;
                element.style.maxWidth = originalMaxWidth;
                if (colContainer) {
                    colContainer.style.overflow = originalColOverflow;
                }
                
                tables.forEach((t, idx) => {
                    (t as HTMLElement).style.overflow = originalOverflows[idx] || '';
                });
                
                const imgData = canvas.toDataURL('image/jpeg', 0.95); // Use JPEG instead of PNG for smaller memory footprint
                
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                
                if (i > 0) pdf.addPage();
                pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
            }
            
            const filename = selectedIndicator === 'all' 
                ? `Exportacion_Mision_${selectedMision}_${selectedAño}.pdf` 
                : `Exportacion_${previewData?.clave || 'Indicador'}.pdf`;
                
            pdf.save(filename);
            
        } catch (error) {
            console.error("Error generating PDF", error);
            alert("Hubo un error al generar el PDF. Verifica que tu navegador tenga suficiente memoria o intenta descargar por partes.");
        } finally {
            const perfStyle = document.getElementById('pdf-perf-style');
            if (perfStyle) perfStyle.remove();
            
            setIsGeneratingPdf(false);
        }
    };

    const renderPreviewTable = (data: any) => {
        if (!data || !data.metadata_dinamica) return null;
        
        const isM3Format = !Array.isArray(data.metadata_dinamica) && typeof data.metadata_dinamica === 'object';
        
        if (isM3Format) {
            return (
                <div className="table-responsive mt-4">
                    <h6 className="fw-bold mb-3">Datos Tabulares</h6>
                    {Object.keys(data.metadata_dinamica).map(year => {
                        const yearData = data.metadata_dinamica[year];
                        if (!yearData.tabla || !Array.isArray(yearData.tabla) || yearData.tabla.length === 0) return null;
                        
                        return (
                            <div key={year} className="mb-4">
                                <span className="badge bg-primary mb-2">Año: {year}</span>
                                <table className="table table-bordered table-sm" style={{fontSize: '12px'}}>
                                    <tbody>
                                        {yearData.tabla.map((row: any[], i: number) => (
                                            <tr key={i} className={i < 3 ? 'bg-light fw-bold' : ''}>
                                                {row.map((cell: any, j: number) => (
                                                    <td key={j}>{cell}</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        );
                    })}
                </div>
            );
        } else {
            const hasTabla = data.metadata_tabla && data.metadata_tabla.length > 0 && data.metadata_tabla[0].headers && data.metadata_tabla[0].rows;
            
            if (hasTabla) {
                return (
                    <div className="table-responsive mt-4">
                        <h6 className="fw-bold mb-3">Datos Tabulares</h6>
                        {data.metadata_tabla.map((tabla: any, tIdx: number) => (
                            <div key={tIdx} className="mb-4">
                                {tabla.year && tabla.year !== 'Todos' && <span className="badge bg-primary mb-2">Año: {tabla.year}</span>}
                                <table className="table table-striped table-bordered table-sm" style={{fontSize: '12px'}}>
                                    <thead className="bg-light">
                                        <tr>
                                            {tabla.headers.map((h: string, i: number) => <th key={i}>{h}</th>)}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tabla.rows.map((row: any[], i: number) => (
                                            <tr key={i}>
                                                {row.map((cell: any, j: number) => <td key={j}>{cell}</td>)}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ))}
                    </div>
                );
            }

            if (!Array.isArray(data.metadata_dinamica) || data.metadata_dinamica.length === 0) return <p>Sin datos estructurados.</p>;
            
            const headersSet = new Set<string>();
            data.metadata_dinamica.forEach((row: any) => {
                if (row && typeof row === 'object') {
                    Object.keys(row).forEach(k => headersSet.add(k));
                }
            });
            const headers = Array.from(headersSet);
            
            const validRows = data.metadata_dinamica.filter((row: any) => 
                headers.some(h => row[h] !== null && row[h] !== undefined && String(row[h]).trim() !== '')
            );
            if (validRows.length === 0) return <p>Sin datos estructurados.</p>;

            return (
                <div className="table-responsive mt-4">
                    <h6 className="fw-bold mb-3">Datos Tabulares</h6>
                    <table className="table table-striped table-bordered table-sm" style={{fontSize: '12px'}}>
                        <thead className="bg-light">
                            <tr>
                                {headers.map((h: string, i: number) => <th key={i}>{h}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {validRows.map((row: any, i: number) => (
                                <tr key={i}>
                                    {headers.map((h: string, j: number) => <td key={j}>{row[h]}</td>)}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
        }
    };

    return (
        <Layout>
            <Head title="Exportaciones" />
            <Container fluid className="p-4">
                <Row className="mb-4">
                    <Col>
                        <h4 className="fw-bold text-slate-800">Módulo de Exportaciones</h4>
                        <p className="text-muted">Filtra y exporta la información de los indicadores a formatos Excel o PDF.</p>
                    </Col>
                </Row>

                <Row>
                    <Col lg={4}>
                        <Card className="shadow-sm border-0 mb-4">
                            <Card.Header className="bg-white border-bottom border-light pt-4 pb-3">
                                <h6 className="mb-0 fw-bold"><i className="ri-filter-3-line me-2 text-primary"></i>Filtros de Exportación</h6>
                            </Card.Header>
                            <Card.Body>
                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-medium text-muted small">Misión</Form.Label>
                                    <Form.Select 
                                        value={selectedMision} 
                                        onChange={(e) => {
                                            setSelectedMision(e.target.value);
                                            setSelectedIndicator('all');
                                        }}
                                        className="border-slate-200"
                                    >
                                        <option value="Todas">-- Todas las Misiones --</option>
                                        {misiones.map(m => (
                                            <option key={m} value={m}>{m}</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>

                                <Form.Group className="mb-3 d-none">
                                    <Form.Label className="fw-medium text-muted small">Año</Form.Label>
                                    <Form.Select 
                                        value={selectedAño} 
                                        onChange={(e) => {
                                            setSelectedAño(e.target.value);
                                            setSelectedIndicator('all');
                                        }}
                                        className="border-slate-200"
                                    >
                                        <option value="Todos">-- Todos los Años --</option>
                                        {años.map(a => (
                                            <option key={a} value={a}>{a}</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>

                                <Form.Group className="mb-4">
                                    <Form.Label className="fw-medium text-muted small">Indicador</Form.Label>
                                    <Form.Select 
                                        value={selectedIndicator} 
                                        onChange={(e) => setSelectedIndicator(e.target.value)}
                                        className="border-slate-200"
                                    >
                                        <option value="all">-- Todo el consolidado --</option>
                                        {filteredIndicators.map(ind => (
                                            <option key={ind.id} value={ind.id}>{ind.clave} - {ind.titulo.substring(0, 50)}...</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>

                                <div className="d-grid gap-2">
                                    <Button variant="success" onClick={handleExportExcel} className="d-flex align-items-center justify-content-center">
                                        <i className="ri-file-excel-2-line me-2 fs-5"></i> 
                                        Exportar a Excel
                                    </Button>
                                    
                                    <Button 
                                        variant="danger" 
                                        onClick={handleExportPDF} 
                                        disabled={loadingPreview || !previewData || isGeneratingPdf}
                                        className="d-flex align-items-center justify-content-center"
                                    >
                                        {isGeneratingPdf ? (
                                            <>
                                                <Spinner animation="border" size="sm" className="me-2" />
                                                {pdfProgress || 'Generando PDF...'}
                                            </>
                                        ) : (
                                            <>
                                                <i className="ri-file-pdf-line me-2 fs-5"></i> 
                                                Exportar a PDF
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col lg={8}>
                        <Card className="shadow-sm border-0 h-100">
                            <Card.Header className="bg-white border-bottom border-light pt-4 pb-3">
                                <h6 className="mb-0 fw-bold"><i className="ri-eye-line me-2 text-primary"></i>Previsualización</h6>
                            </Card.Header>
                            <Card.Body className="bg-slate-50">
                                {loadingPreview ? (
                                    <div className="d-flex justify-content-center align-items-center h-100">
                                        <Spinner animation="border" variant="primary" />
                                    </div>
                                ) : previewData ? (
                                    <div ref={exportRef}>
                                        {(Array.isArray(previewData) ? previewData : [previewData]).map((data: any, index: number) => (
                                            <div key={data.id || index} className="pdf-indicator-page p-3 bg-white rounded shadow-sm mb-4">
                                                <div className="mb-4 pb-3 border-bottom">
                                                    <h5 className="fw-bold text-primary mb-1">{data.titulo}</h5>
                                                    <div className="d-flex gap-3 text-muted small">
                                                        <span><strong>Clave:</strong> {data.clave}</span>
                                                        <span><strong>Año:</strong> {data.año}</span>
                                                        <span><strong>Misión:</strong> {data.mision}</span>
                                                    </div>
                                                </div>
                                                
                                                {data.is_estrella && data.metadata_dinamica && (
                                                    <div className="mb-5">
                                                        <DynamicChart 
                                                            dynamicData={data.metadata_dinamica}
                                                            metadataTabla={data.metadata_tabla}
                                                            indicatorTitulo={data.titulo}
                                                            isMunicipal={false}
                                                            defaultChartType={data.tipo_grafica || 'bar'}
                                                            hideTitle={true}
                                                        />
                                                    </div>
                                                )}
                                                
                                                {renderPreviewTable(data)}
                                                
                                                {data.fuente && (
                                                    <div className="mt-4 pt-3 border-top text-muted small">
                                                        <strong>Fuente:</strong> {data.fuente}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="d-flex justify-content-center align-items-center h-100 text-muted">
                                        <p>Selecciona un indicador para ver la previsualización.</p>
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </Layout>
    );
}
