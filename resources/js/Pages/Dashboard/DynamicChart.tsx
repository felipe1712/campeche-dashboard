import React, { useMemo, useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import { Table, Form, Row, Col } from 'react-bootstrap';
import { motion } from 'framer-motion';

type ChartType = 'bar' | 'line' | 'area' | 'pie' | 'donut';

interface Props {
    dynamicData: any[];
    indicatorTitulo: string;
}

const DynamicChart = ({ dynamicData, indicatorTitulo }: Props) => {
    const [chartType, setChartType] = useState<ChartType>('bar');

    // ── 1. Detect which column is the category label and which are numeric series ──
    const { categoryKey, seriesKeys } = useMemo(() => {
        if (!dynamicData || dynamicData.length === 0) {
            return { categoryKey: null as string | null, seriesKeys: [] as string[] };
        }

        const keys = Object.keys(dynamicData[0]);
        let categoryKey: string | null = null;
        const seriesKeys: string[] = [];

        for (const key of keys) {
            const keyUpper = key.trim().toUpperCase();

            let numericCount = 0;
            let stringCount  = 0;
            let yearLikeCount = 0;

            for (const row of dynamicData) {
                const v = row[key];
                if (v === null || v === undefined || String(v).trim() === '') continue;
                const n = Number(v);
                if (!isNaN(n)) {
                    numericCount++;
                    // Detect year-like integers (1900–2100)
                    if (Number.isInteger(n) && n >= 1900 && n <= 2100) yearLikeCount++;
                } else {
                    stringCount++;
                }
            }

            // 1. Skip TOTAL columns — they are sums of other series, not independent data
            if (keyUpper === 'TOTAL') continue;

            // 2. Column whose ALL numeric values look like years → use as category
            if (numericCount > 0 && yearLikeCount === numericCount && stringCount === 0 && categoryKey === null) {
                categoryKey = key;
            }
            // 3. numericCount > 0 wins even if a few sub-header strings leaked in
            else if (numericCount > 0) {
                seriesKeys.push(key);
            }
            // 4. Text-only column → category candidate
            else if (stringCount > 0 && categoryKey === null) {
                categoryKey = key;
            }
        }

        // fallback: use first key as category if nothing was found
        if (categoryKey === null && keys.length > 0) {
            categoryKey = keys[0];
        }

        return { categoryKey, seriesKeys };
    }, [dynamicData]);

    // ── 2. Filter out empty/header rows, and separate TOTAL rows ──
    const { chartData, totalRow } = useMemo(() => {
        if (!categoryKey) return { chartData: dynamicData, totalRow: null as any };
        let totalRow: any = null;
        const chartData = dynamicData.filter(row => {
            const v = row[categoryKey!];
            if (v === null || v === undefined || String(v).trim() === '') return false;
            // Detect TOTAL rows (case-insensitive, trim)
            if (String(v).trim().toUpperCase() === 'TOTAL') {
                totalRow = row;
                return false; // exclude from main chart data
            }
            return true;
        });
        return { chartData, totalRow };
    }, [dynamicData, categoryKey]);

    const validData = chartData;

    // ── 3. Detect hierarchical (pivotable) structure ──────────────────────────
    // Pattern: categoryKey has repeated values AND there's a secondary text column
    // e.g. ORGANISMO | ACCIONES | CANTIDAD  →  pivot so ACCIONES becomes X-axis
    //       and each ORGANISMO becomes a series.
    const pivotInfo = useMemo(() => {
        if (!categoryKey || seriesKeys.length !== 1 || validData.length < 2) return null;

        const keys = Object.keys(validData[0] || {});
        // Find the secondary text column (not category, not numeric series)
        const secondaryKey = keys.find(k => {
            if (k === categoryKey || seriesKeys.includes(k)) return false;
            return validData.some(row => {
                const v = row[k];
                return v && String(v).trim() !== '' && isNaN(Number(v));
            });
        });
        if (!secondaryKey) return null;

        // Check for repeated categoryKey values (sign of a hierarchical table)
        const catValues = validData.map(r => String(r[categoryKey!]));
        const uniqueCats = [...new Set(catValues)];
        if (uniqueCats.length >= catValues.length) return null; // no repeats → not hierarchical

        // Build pivot
        const uniqueActions = [...new Set(validData.map(r => String(r[secondaryKey])))] as string[];
        const numKey = seriesKeys[0];
        const pivotSeries = uniqueCats.map(org => ({
            name: org,
            data: uniqueActions.map(action => {
                const row = validData.find(
                    r => String(r[categoryKey!]) === org && String(r[secondaryKey]) === action
                );
                return row ? Number(row[numKey]) || 0 : 0;
            }),
        }));
        return { categories: uniqueActions, series: pivotSeries };
    }, [validData, categoryKey, seriesKeys]);

    // ── 4. Build series and categories ──
    const isPie = chartType === 'pie' || chartType === 'donut';

    const categories: string[] = useMemo(() => {
        if (pivotInfo) return pivotInfo.categories;
        return validData.map((row, i) => categoryKey ? String(row[categoryKey]) : `Item ${i + 1}`);
    }, [validData, categoryKey, pivotInfo]);

    const series: any = useMemo(() => {
        if (pivotInfo) return pivotInfo.series;
        if (isPie) {
            const key = seriesKeys[0];
            return validData.map(row => Number(row[key]) || 0);
        }
        return seriesKeys.map(key => ({
            name: key.startsWith('col_') ? key.replace('col_', 'Columna ') : key,
            data: validData.map(row => Number(row[key]) || 0),
        }));
    }, [validData, seriesKeys, isPie]);

    // ── 4. Guard: no data ──
    if (!validData.length || !seriesKeys.length) {
        const headers = dynamicData.length > 0 ? Object.keys(dynamicData[0]) : [];
        return (
            <div className="table-responsive">
                <div className="alert alert-info py-1 px-2 mb-2" style={{ fontSize: '12px' }}>
                    <i className="ri-information-line me-1" /> Sin datos graficables — mostrando tabla
                </div>
                <Table size="sm" bordered hover className="bg-white mb-0">
                    <thead className="table-light">
                        <tr>{headers.map((h, i) => <th key={i}>{h.replace('col_', 'Columna ')}</th>)}</tr>
                    </thead>
                    <tbody>
                        {dynamicData.map((row, i) => (
                            <tr key={i}>{headers.map((h, j) => <td key={j}>{row[h]}</td>)}</tr>
                        ))}
                    </tbody>
                </Table>
            </div>
        );
    }

    // ── 5. ApexCharts options ──
    const PALETTE = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#3b82f6'];

    const options: ApexCharts.ApexOptions = {
        chart: {
            type: chartType,
            height: 400,
            toolbar: { show: !isPie },
            zoom: { enabled: false },
            animations: {
                enabled: true,
                easing: 'easeinout',
                speed: 700,
                animateGradually: { enabled: true, delay: 100 },
            },
            fontFamily: 'Inter, system-ui, sans-serif',
        },
        colors: PALETTE,

        // ── Bars: rounded + gradient ──
        ...(chartType === 'bar' && {
            plotOptions: {
                bar: {
                    horizontal: false,
                    columnWidth: '55%',
                    borderRadius: 6,
                    borderRadiusApplication: 'end' as const,
                },
            },
        }),

        // ── Fill: gradient for all chart types ──
        fill: isPie
            ? {
                type: 'gradient',
                gradient: {
                    shade: 'dark',
                    type: 'diagonal2',
                    shadeIntensity: 0.4,
                    opacityFrom: 1,
                    opacityTo: 0.75,
                    stops: [0, 100],
                },
            }
            : chartType === 'line'
                ? {
                    type: 'gradient',
                    gradient: {
                        shade: 'dark',
                        type: 'vertical',
                        shadeIntensity: 0.3,
                        opacityFrom: 1,
                        opacityTo: 0.7,
                        stops: [0, 100],
                    },
                }
                : {
                    type: 'gradient',
                    gradient: {
                        shade: 'light',
                        type: 'vertical',
                        shadeIntensity: 0.25,
                        opacityFrom: chartType === 'area' ? 0.85 : 1,
                        opacityTo: chartType === 'area' ? 0.1 : 0.65,
                        stops: [0, 90, 100],
                    },
                },

        dataLabels: { enabled: false },

        stroke: chartType === 'bar'
            ? { show: false }
            : { show: true, curve: 'smooth', width: chartType === 'area' ? 2.5 : 2.5 },

        // ── Axes ──
        ...(isPie
            ? { labels: categories }
            : {
                xaxis: {
                    categories,
                    labels: {
                        style: { colors: '#94a3b8', fontSize: '11px', fontWeight: 500 },
                        rotate: categories.length > 6 ? -30 : 0,
                        trim: true,
                    },
                    axisBorder: { show: false },
                    axisTicks: { show: false },
                },
                yaxis: {
                    labels: {
                        style: { colors: '#94a3b8', fontSize: '11px' },
                        formatter: (val: number) => val >= 1000 ? `${(val / 1000).toFixed(1)}k` : String(Math.round(val)),
                    },
                },
                grid: {
                    borderColor: '#e2e8f0',
                    strokeDashArray: 4,
                    xaxis: { lines: { show: false } },
                    yaxis: { lines: { show: true } },
                },
            }
        ),

        // ── Legend ──
        legend: {
            position: 'right',
            offsetY: 20,
            fontSize: '12px',
            fontWeight: 500,
            labels: { colors: '#475569' },
            markers: { size: 8 } as any,
        },

        // ── Tooltip ──
        tooltip: {
            shared: !isPie,
            intersect: false,
            theme: 'light',
            style: { fontSize: '12px' },
            y: {
                formatter: (val: number) =>
                    val >= 1000 ? val.toLocaleString('es-MX') : String(val),
            },
        },

        // ── Pie/Donut extra ──
        ...(isPie && {
            plotOptions: {
                pie: {
                    donut: {
                        size: '65%',
                        labels: {
                            show: chartType === 'donut',
                            total: {
                                show: true,
                                label: 'Total',
                                fontSize: '13px',
                                fontWeight: 600,
                                color: '#334155',
                            },
                        },
                    },
                },
            },
        }),
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            {/* Type selector */}
            <Row className="mb-3 justify-content-end align-items-center">
                <Col xs="auto">
                    <Form.Select
                        size="sm"
                        value={chartType}
                        onChange={(e) => setChartType(e.target.value as ChartType)}
                        className="w-auto"
                    >
                        <option value="bar">Gráfica de Barras</option>
                        <option value="line">Gráfica de Líneas</option>
                        <option value="area">Gráfica de Área</option>
                        <option value="pie">Gráfica de Pastel</option>
                        <option value="donut">Gráfica de Dona</option>
                    </Form.Select>
                </Col>
            </Row>

            {/* Title */}
            <h6 className="fw-bold mb-3 text-dark" style={{ lineHeight: '1.4' }}>
                {indicatorTitulo}
            </h6>

            {/* Chart — key forces full remount when type changes */}
            <ReactApexChart
                key={`${chartType}-${categories.length}-${seriesKeys.join(',')}`}
                type={chartType}
                series={series}
                options={options}
                height={400}
                width="100%"
            />

            {/* TOTAL footer — shown when the source table had a TOTAL row */}
            {totalRow && !isPie && (
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginTop: '4px',
                        padding: '8px 14px',
                        background: 'linear-gradient(90deg, #9D2449 0%, #b31c45 100%)',
                        borderRadius: '8px',
                        flexWrap: 'wrap',
                    }}
                >
                    <span style={{ color: '#fff', fontWeight: 700, fontSize: '12px', marginRight: '6px', flexShrink: 0 }}>
                        TOTAL
                    </span>
                    {seriesKeys.map((key, idx) => {
                        const val = Number(totalRow[key]);
                        const label = key.startsWith('col_') ? key.replace('col_', 'Columna ') : key;
                        return (
                            <span
                                key={idx}
                                style={{
                                    background: 'rgba(255,255,255,0.18)',
                                    borderRadius: '6px',
                                    padding: '2px 10px',
                                    color: '#fff',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {label}: {val >= 1000 ? val.toLocaleString('es-MX') : val}
                            </span>
                        );
                    })}
                </div>
            )}
        </motion.div>
    );
};

export default DynamicChart;
