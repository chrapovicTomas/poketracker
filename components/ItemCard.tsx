'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { TrackerItem } from '../lib/types';
import { formatCurrency, calculateProfit } from '../lib/utils';
import { RefreshCw, Trash2, ExternalLink, TrendingUp, TrendingDown, AlertCircle, LineChart as ChartIcon } from 'lucide-react';
import PriceChart from './PriceChart';
import './card.css';

interface ItemCardProps {
    item: TrackerItem;
    currency: 'EUR' | 'USD';
    onRefresh: (id: number, url: string) => void;
    onRemove: (id: number) => void;
    onEdit: (item: TrackerItem) => void;
}

export default function ItemCard({ item, currency, onRefresh, onRemove, onEdit }: ItemCardProps) {
    const { absolute, percentage } = calculateProfit(item.buyPrice, item.currentPrice);
    const isPositive = absolute >= 0;
    const [isImageEnlarged, setIsImageEnlarged] = useState(false);
    const [isChartEnlarged, setIsChartEnlarged] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <div className="glass item-card">
            <div className="card-header">
                <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
                    {item.imageUrl ? (
                        <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="card-image clickable"
                            onClick={() => setIsImageEnlarged(true)}
                        />
                    ) : (
                        <div className="card-image-placeholder">
                            <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>No Img</span>
                        </div>
                    )}
                    <h3 className="card-title" title={item.name}>{item.name}</h3>
                </div>
                <div className="card-actions">
                    <button
                        onClick={() => onEdit(item)}
                        className="icon-btn"
                        title="Edit Item"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                    </button>
                    <a href={item.marketUrl} target="_blank" rel="noopener noreferrer" className="icon-btn" title="Open Market URL">
                        <ExternalLink size={18} />
                    </a>
                    <button
                        onClick={() => setIsChartEnlarged(true)}
                        className="icon-btn"
                        title="View Price History"
                        disabled={!item.priceHistory || item.priceHistory.length === 0}
                    >
                        <ChartIcon size={18} />
                    </button>
                    <button
                        onClick={() => onRefresh(item.id, item.marketUrl)}
                        disabled={item.isUpdating}
                        className={`icon-btn ${item.isUpdating ? 'spinning' : ''}`}
                        title="Refresh Price"
                    >
                        <RefreshCw size={18} />
                    </button>
                    <button
                        onClick={() => onRemove(item.id)}
                        className="icon-btn danger"
                        title="Delete Item"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>

            <div className="card-body">
                <div className="price-row">
                    <span className="price-label">Buy Price</span>
                    <span className="price-value">{formatCurrency(item.buyPrice, currency)}</span>
                </div>
                <div className="price-row highlight">
                    <span className="price-label">Market Value</span>
                    <span className="price-value">
                        {item.isUpdating ? (
                            <span className="loading-dots">Updating</span>
                        ) : (
                            item.currentPrice !== null ? formatCurrency(item.currentPrice, currency) : 'Unknown'
                        )}
                    </span>
                </div>

                {item.error ? (
                    <div className="error-message">
                        <AlertCircle size={14} /> {item.error}
                    </div>
                ) : item.currentPrice !== null && (
                    <div className={`profit-badge ${isPositive ? 'positive' : 'negative'}`}>
                        {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                        <span>
                            {isPositive ? '+' : ''}{formatCurrency(absolute, currency)} ({isPositive ? '+' : ''}{percentage.toFixed(2)}%)
                        </span>
                    </div>
                )}
            </div>

            {item.lastUpdated && (
                <div className="card-footer">
                    Last updated: {new Date(item.lastUpdated).toLocaleString()}
                </div>
            )}

            {mounted && isImageEnlarged && item.imageUrl && createPortal(
                <div className="image-modal-overlay" onClick={() => setIsImageEnlarged(false)}>
                    <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="image-modal-close" onClick={() => setIsImageEnlarged(false)}>&times;</button>
                        <img src={item.imageUrl} alt={item.name} className="enlarged-image" />
                    </div>
                </div>,
                document.body
            )}

            {mounted && isChartEnlarged && createPortal(
                <div className="image-modal-overlay" onClick={() => setIsChartEnlarged(false)}>
                    <div className="image-modal-content glass" onClick={(e) => e.stopPropagation()} style={{ width: '90vw', maxWidth: '600px', padding: '1.5rem', background: '#111', borderRadius: 'var(--radius-md)' }}>
                        <button className="image-modal-close" onClick={() => setIsChartEnlarged(false)}>&times;</button>
                        <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text-primary)' }}>Price History: {item.name}</h3>
                        <PriceChart data={item.priceHistory || []} />
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
