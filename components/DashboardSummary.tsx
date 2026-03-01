'use client';

import { useMemo } from 'react';
import { TrackerItem } from '../lib/types';
import { formatCurrency } from '../lib/utils';
import { TrendingUp, TrendingDown, Wallet, Activity, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface DashboardSummaryProps {
    items: TrackerItem[];
    currency: 'EUR' | 'USD';
}

export default function DashboardSummary({ items, currency }: DashboardSummaryProps) {
    const stats = useMemo(() => {
        let totalValue = 0;
        let totalBuyPrice = 0;
        let bestCard: TrackerItem | null = null;
        let worstCard: TrackerItem | null = null;

        let maxProfit = -Infinity;
        let minProfit = Infinity;

        items.forEach(item => {
            const current = item.currentPrice || item.buyPrice; // fallback to buyPrice if not priced yet
            totalValue += current;
            totalBuyPrice += item.buyPrice;

            if (item.currentPrice !== null) {
                const profit = item.currentPrice - item.buyPrice;

                if (profit > maxProfit) {
                    maxProfit = profit;
                    bestCard = item;
                }
                if (profit < minProfit) {
                    minProfit = profit;
                    worstCard = item;
                }
            }
        });

        const totalProfit = totalValue - totalBuyPrice;
        const totalProfitPercent = totalBuyPrice > 0 ? (totalProfit / totalBuyPrice) * 100 : 0;

        return {
            totalValue,
            totalProfit,
            totalProfitPercent,
            bestCard,
            worstCard,
            maxProfit,
            minProfit
        };
    }, [items]);

    if (items.length === 0) return null;

    return (
        <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Activity size={20} className="text-primary" />
                Prehľad Zbierky
            </h2>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '1rem'
            }}>
                {/* Total Value / Profit Card */}
                <div className="glass" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        <Wallet size={16} /> Celková Hodnota
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {formatCurrency(stats.totalValue, currency)}
                    </div>

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        color: stats.totalProfit >= 0 ? 'var(--success)' : 'var(--danger)',
                        fontSize: '0.9rem',
                        fontWeight: 500,
                        marginTop: 'auto'
                    }}>
                        {stats.totalProfit >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                        {stats.totalProfit > 0 ? '+' : ''}{formatCurrency(stats.totalProfit, currency)} ({stats.totalProfit > 0 ? '+' : ''}{stats.totalProfitPercent.toFixed(1)}%)
                    </div>
                </div>

                {/* Best Card */}
                <div className="glass" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        <ArrowUpRight size={16} style={{ color: 'var(--success)' }} /> Najziskovejšia Karta
                    </div>
                    {stats.bestCard ? (
                        <>
                            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {(stats.bestCard as TrackerItem).name}
                            </div>
                            <div style={{ color: 'var(--success)', fontWeight: 500, fontSize: '1rem', marginTop: 'auto' }}>
                                +{formatCurrency(stats.maxProfit, currency)}
                            </div>
                        </>
                    ) : (
                        <div style={{ color: 'var(--text-muted)' }}>Nedostatok dát</div>
                    )}
                </div>

                {/* Worst Card */}
                <div className="glass" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        <ArrowDownRight size={16} style={{ color: 'var(--danger)' }} /> Najstratovejšia Karta
                    </div>
                    {stats.worstCard ? (
                        <>
                            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {(stats.worstCard as TrackerItem).name}
                            </div>
                            <div style={{ color: 'var(--danger)', fontWeight: 500, fontSize: '1rem', marginTop: 'auto' }}>
                                {formatCurrency(stats.minProfit, currency)}
                            </div>
                        </>
                    ) : (
                        <div style={{ color: 'var(--text-muted)' }}>Nedostatok dát</div>
                    )}
                </div>
            </div>
        </div>
    );
}
