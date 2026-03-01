'use client';

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useMemo } from 'react';
import { formatCurrency } from '../lib/utils';

interface PricePoint {
    price: number;
    date: string;
}

interface PriceChartProps {
    data: PricePoint[];
}

export default function PriceChart({ data }: PriceChartProps) {
    const chartData = useMemo(() => {
        return data.map(point => {
            const dateObj = new Date(point.date);
            return {
                ...point,
                // display only localized short date formats gracefully
                formattedDate: dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
                timestamp: dateObj.getTime()
            };
        }).sort((a, b) => a.timestamp - b.timestamp); // Ensure chronologically sorted
    }, [data]);

    if (!data || data.length === 0) {
        return (
            <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                No price history available yet.
            </div>
        );
    }

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div style={{
                    background: 'rgba(0, 0, 0, 0.8)',
                    border: '1px solid var(--border)',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
                }}>
                    <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{payload[0].payload.formattedDate}</p>
                    <p style={{ margin: 0, color: 'var(--primary)', fontWeight: 'bold' }}>
                        {formatCurrency(payload[0].value)}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div style={{ width: '100%', height: 300, marginTop: '1rem' }}>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis
                        dataKey="formattedDate"
                        stroke="var(--text-secondary)"
                        fontSize={12}
                        tickMargin={10}
                        minTickGap={30}
                    />
                    <YAxis
                        stroke="var(--text-secondary)"
                        fontSize={12}
                        tickFormatter={(value) => `€${value.toFixed(2)}`}
                        domain={['auto', 'auto']}
                        width={60}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                        type="monotone"
                        dataKey="price"
                        stroke="var(--primary)"
                        strokeWidth={2}
                        dot={{ r: 4, fill: 'var(--surface)', strokeWidth: 2 }}
                        activeDot={{ r: 6, fill: 'var(--primary)', stroke: 'white' }}
                        isAnimationActive={true}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
