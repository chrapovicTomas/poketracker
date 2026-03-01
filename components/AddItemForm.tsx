'use client';

import { useState, useEffect } from 'react';
import { TrackerItem, ItemCategory } from '../lib/types';
import { PlusCircle, DollarSign, Type, Link, X, Tag, Save, EuroIcon } from 'lucide-react';

interface AddItemFormProps {
    onSubmit: (item: TrackerItem) => void;
    onClose: () => void;
    initialData?: TrackerItem | null;
}

export default function AddItemForm({ onSubmit, onClose, initialData }: AddItemFormProps) {
    const [name, setName] = useState('');
    const [buyPrice, setBuyPrice] = useState('');
    const [marketUrl, setMarketUrl] = useState('');
    const [category, setCategory] = useState<ItemCategory>('Single');

    useEffect(() => {
        if (initialData) {
            setName(initialData.name);
            setBuyPrice(initialData.buyPrice.toString());
            setMarketUrl(initialData.marketUrl);
            setCategory(initialData.category || 'Single');
        } else {
            setName('');
            setBuyPrice('');
            setMarketUrl('');
            setCategory('Single');
        }
    }, [initialData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !buyPrice || !marketUrl) return;

        const modifiedItem: Partial<TrackerItem> & { name: string, category: ItemCategory, buyPrice: number, marketUrl: string } = {
            ...(initialData || {
                currentPrice: null,
                lastUpdated: null,
                isUpdating: false,
            }),
            name,
            category,
            buyPrice: parseFloat(buyPrice),
            marketUrl,
        };

        onSubmit(modifiedItem as TrackerItem); // casting as TrackerItem temporarily for compatibility

        // Form is usually closed externally by onClose, but clean up state just in case
        if (!initialData) {
            setName('');
            setBuyPrice('');
            setMarketUrl('');
            setCategory('Single');
        }
    };

    return (
        <div>
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>
                {initialData ? 'Edit Tracker Item' : 'Add New Card'}
            </h3>
            <button className="close-btn" onClick={onClose} aria-label="Close">
                <X size={24} />
            </button>

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label className="form-label"><Type size={16} className="inline-icon" /> Item Name</label>
                    <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Charizard Base Set"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                </div>

                <div className="form-group">
                    <label className="form-label"><Tag size={16} className="inline-icon" /> Category</label>
                    <select
                        className="form-control"
                        value={category}
                        onChange={(e) => setCategory(e.target.value as ItemCategory)}
                        required
                        style={{ appearance: 'auto' }}
                    >
                        <option value="Single">Single Card</option>
                        <option value="Booster Pack">Booster Pack</option>
                        <option value="Elite Trainer Box">Elite Trainer Box (ETB)</option>
                        <option value="Booster Bundle">Booster Bundle</option>
                        <option value="Other">Other Product</option>
                    </select>
                </div>

                <div className="form-group">
                    <label className="form-label"><EuroIcon size={16} className="inline-icon" /> Buy Price</label>
                    <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        placeholder="50.00"
                        value={buyPrice}
                        onChange={(e) => setBuyPrice(e.target.value)}
                        required
                    />
                </div>

                <div className="form-group">
                    <label className="form-label"><Link size={16} className="inline-icon" /> Market URL (TCGPlayer)</label>
                    <input
                        type="url"
                        className="form-control"
                        placeholder="https://www.tcgplayer.com/product/..."
                        value={marketUrl}
                        onChange={(e) => setMarketUrl(e.target.value)}
                        required
                    />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                    {initialData ? (
                        <><Save size={18} /> Save Changes</>
                    ) : (
                        <><PlusCircle size={18} /> Track Item</>
                    )}
                </button>
            </form>
        </div>
    );
}
