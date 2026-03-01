'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AddItemForm from '@/components/AddItemForm';
import ItemCard from '@/components/ItemCard';
import DashboardSummary from '@/components/DashboardSummary';
import { TrackerItem, ItemCategory } from '@/lib/types';
import { Plus, Loader2, ChevronDown } from 'lucide-react';
import { useSettings } from '@/components/SettingsProvider';

export default function Home() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [items, setItems] = useState<TrackerItem[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<TrackerItem | null>(null);
    const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
    const [sortBy, setSortBy] = useState<string>('date-desc');
    const { currency } = useSettings();
    const [isRefreshingAll, setIsRefreshingAll] = useState(false);
    const [refreshProgress, setRefreshProgress] = useState({ current: 0, total: 0 });

    const toggleCategory = (cat: string) => {
        setCollapsedCategories(prev => ({
            ...prev,
            [cat]: !prev[cat]
        }));
    };

    // Fetch items from the database on mount / when session exists
    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        } else if (status === 'authenticated') {
            fetch('/api/items')
                .then(res => res.json())
                .then(data => {
                    setItems(data);
                    setIsLoaded(true);
                })
                .catch(err => {
                    console.error('Failed to fetch items:', err);
                    setIsLoaded(true);
                });
        }
    }, [status, router]);

    const handleSubmitItem = async (submittedItem: TrackerItem) => {
        let isUrlChanged = false;

        if (editingItem && submittedItem.id !== editingItem.id) {
            // New uuid generation usually happens on new items, but edit doesn't change it.
        }

        if (editingItem) {
            // Editing an existing item in DB
            const res = await fetch(`/api/items/${submittedItem.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: submittedItem.name,
                    category: submittedItem.category,
                    buyPrice: submittedItem.buyPrice,
                    marketUrl: submittedItem.marketUrl,
                }),
            });

            if (res.ok) {
                const dbUpdatedItem = await res.json();
                setItems((prev) => prev.map(item => {
                    if (item.id === dbUpdatedItem.id) {
                        if (item.marketUrl !== dbUpdatedItem.marketUrl) isUrlChanged = true;
                        return dbUpdatedItem;
                    }
                    return item;
                }));
            }
        } else {
            // Adding a new item to DB
            const res = await fetch('/api/items', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: submittedItem.name,
                    category: submittedItem.category,
                    buyPrice: submittedItem.buyPrice,
                    marketUrl: submittedItem.marketUrl,
                }),
            });

            if (res.ok) {
                const dbNewItem = await res.json();
                setItems((prev) => [dbNewItem, ...prev]);
                isUrlChanged = true;
                submittedItem = dbNewItem; // sync IDs for the fetchPrice call downstream
            }
        }

        setIsModalOpen(false);
        setEditingItem(null);

        if (isUrlChanged) {
            await fetchPrice(submittedItem.id, submittedItem.marketUrl);
        }
    };

    const handleRemoveItem = async (id: number) => {
        if (confirm('Are you sure you want to remove this item?')) {
            const res = await fetch(`/api/items/${id}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                setItems((prev) => prev.filter((item) => item.id !== id));
            }
        }
    };

    const fetchPrice = async (id: number, url: string) => {
        setItems((prev) =>
            prev.map((item) => (item.id === id ? { ...item, isUpdating: true, error: undefined } : item))
        );

        try {
            // 1. Scrape price
            const response = await fetch('/api/scrape', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch price');
            }

            // 2. Save new price to Database
            const dbRes = await fetch(`/api/items/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentPrice: data.price,
                    imageUrl: data.imageUrl,
                })
            });
            const dbUpdatedItem = await dbRes.json();

            // 3. Update UI
            setItems((prev) =>
                prev.map((item) =>
                    item.id === id
                        ? {
                            ...item,
                            currentPrice: dbUpdatedItem.currentPrice,
                            imageUrl: dbUpdatedItem.imageUrl,
                            lastUpdated: dbUpdatedItem.lastUpdated,
                            isUpdating: false,
                            error: undefined,
                        }
                        : item
                )
            );
        } catch (err: any) {
            setItems((prev) =>
                prev.map((item) =>
                    item.id === id
                        ? {
                            ...item,
                            isUpdating: false,
                            error: err.message,
                        }
                        : item
                )
            );
        }
    };

    const handleRefreshAll = async () => {
        if (isRefreshingAll || items.length === 0) return;

        setIsRefreshingAll(true);
        setRefreshProgress({ current: 0, total: items.length });

        for (let i = 0; i < items.length; i++) {
            setRefreshProgress({ current: i + 1, total: items.length });
            await fetchPrice(items[i].id, items[i].marketUrl);

            // Wait 2 seconds before the next request to avoid rate-limiting
            if (i < items.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        setIsRefreshingAll(false);
    };

    // Sort items before grouping
    const sortedItems = [...items].sort((a, b) => {
        if (sortBy === 'value-desc') {
            const valA = a.currentPrice || a.buyPrice;
            const valB = b.currentPrice || b.buyPrice;
            return valB - valA;
        } else if (sortBy === 'name-asc') {
            return a.name.localeCompare(b.name);
        } else if (sortBy === 'profit-desc') {
            const profitA = a.currentPrice ? ((a.currentPrice - a.buyPrice) / a.buyPrice) : 0;
            const profitB = b.currentPrice ? ((b.currentPrice - b.buyPrice) / b.buyPrice) : 0;
            return profitB - profitA;
        }
        // default: date-desc (assume newer items are appended/prepended in DB, keeping original array order usually works
        // since we push new items to front in local state: `[dbNewItem, ...prev]`)
        return 0;
    });

    // Group items by category from the sorted array
    const groupedItems = sortedItems.reduce((acc, item) => {
        // Legacy support for older items that might not have a category
        const cat = item.category || 'Single';
        if (!acc[cat]) {
            acc[cat] = [];
        }
        acc[cat].push(item);
        return acc;
    }, {} as Record<ItemCategory | string, TrackerItem[]>);

    const categories: ItemCategory[] = ['Single', 'Booster Pack', 'Elite Trainer Box', 'Booster Bundle', 'Other'];

    if (status === 'loading' || !isLoaded) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh', flexDirection: 'column', gap: '1rem', color: 'var(--primary)' }}>
                <Loader2 size={48} className="spinning" />
                <h2>Loading Tracker...</h2>
            </div>
        );
    }

    if (status === 'unauthenticated') return null; // Avoid flicker while redirecting

    return (
        <section>

            {/* Dashboard Summary Metrics */}
            <DashboardSummary items={items} currency={currency} />

            {/* Top Action Bar */}
            {items.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <select
                            className="form-control"
                            style={{ appearance: 'auto', minWidth: '180px', margin: 0 }}
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                        >
                            <option value="date-desc">Newest Added (Default)</option>
                            <option value="value-desc">Highest Value</option>
                            <option value="profit-desc">Highest Profit %</option>
                            <option value="name-asc">Alphabetical (A-Z)</option>
                        </select>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button
                            className="btn btn-secondary"
                            onClick={handleRefreshAll}
                            disabled={isRefreshingAll}
                            title="Refresh all prices sequentially"
                            style={{ padding: '0.6rem 1.25rem', gap: '0.5rem', opacity: isRefreshingAll ? 0.7 : 1 }}
                        >
                            {isRefreshingAll ? (
                                <><Loader2 size={18} className="spinning" /> Refreshing {refreshProgress.current}/{refreshProgress.total}</>
                            ) : (
                                <>Refresh All Prices</>
                            )}
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={() => setIsModalOpen(true)}
                            title="Add New Tracked Item"
                            style={{ padding: '0.6rem 1.25rem', gap: '0.5rem' }}
                        >
                            <Plus size={18} /> Add Item
                        </button>
                    </div>
                </div>
            )}

            {/* Category Sections */}
            {items.length > 0 && categories.map((cat) => {
                const catItems = groupedItems[cat] || [];

                // Skip empty categories completely
                if (catItems.length === 0) return null;

                return (
                    <div key={cat} style={{ marginBottom: '4rem' }}>
                        <div
                            onClick={() => toggleCategory(cat)}
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '1.5rem',
                                borderBottom: '2px solid var(--border)',
                                paddingBottom: '0.5rem',
                                cursor: 'pointer',
                                userSelect: 'none'
                            }}
                        >
                            <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>
                                {cat}s
                            </h2>
                            <button className="icon-btn" style={{ padding: '0.2rem' }}>
                                <ChevronDown
                                    size={24}
                                    style={{
                                        transform: collapsedCategories[cat] ? 'rotate(-90deg)' : 'rotate(0deg)',
                                        transition: 'transform 300ms ease-in-out'
                                    }}
                                />
                            </button>
                        </div>

                        <div
                            style={{
                                display: 'grid',
                                gridTemplateRows: collapsedCategories[cat] ? '0fr' : '1fr',
                                transition: 'grid-template-rows 300ms ease-in-out',
                            }}
                        >
                            <div style={{ overflow: collapsedCategories[cat] ? 'hidden' : 'visible' }}>
                                <div className="grid" style={{
                                    visibility: collapsedCategories[cat] ? 'hidden' : 'visible',
                                    transition: 'visibility 300ms ease-in-out',
                                }}>
                                    {catItems.map((item) => (
                                        <ItemCard
                                            key={item.id}
                                            item={item}
                                            currency={currency}
                                            onRefresh={() => fetchPrice(item.id, item.marketUrl)}
                                            onRemove={handleRemoveItem}
                                            onEdit={(itemToEdit) => {
                                                setEditingItem(itemToEdit);
                                                setIsModalOpen(true);
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )
            })}

            {/* Put Add Button loose at the end if there were zero items tracking */}
            {items.length === 0 && (
                <div className="glass" style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Welcome to PokeTracker</h3>
                    <p style={{ maxWidth: '500px', margin: '0 auto 2.5rem' }}>Your tracker is currently empty. Start building your collection and tracking card values right away!</p>

                    <button
                        className="add-card-btn empty-state-btn"
                        onClick={() => setIsModalOpen(true)}
                        title="Add New Tracked Item"
                        style={{ margin: '0 auto', width: '100%', maxWidth: '300px' }}
                    >
                        <div className="plus-icon-wrapper">
                            <Plus size={32} />
                        </div>
                        <span className="empty-state-text">Add First Item</span>
                    </button>
                </div>
            )}

            {/* Modal Overlay */}
            <div className={`modal-overlay ${isModalOpen ? 'open' : ''}`} onClick={(e) => {
                if (e.target === e.currentTarget) {
                    setIsModalOpen(false);
                    setEditingItem(null);
                }
            }}>
                <div className="modal-content">
                    <AddItemForm
                        initialData={editingItem}
                        onSubmit={handleSubmitItem}
                        onClose={() => {
                            setIsModalOpen(false);
                            setEditingItem(null);
                        }}
                    />
                </div>
            </div>
        </section>
    );
}
