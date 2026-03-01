'use client';

import { useSession, signOut } from 'next-auth/react';
import { LogOut, User, Sun, Moon } from 'lucide-react';
import { useSettings } from './SettingsProvider';

export default function UserMenu() {
    const { data: session } = useSession();
    const { theme, setTheme, currency, setCurrency } = useSettings();

    if (!session || !session.user) return null;

    return (
        <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                <User size={16} />
                <span className="hide-on-mobile" style={{ fontWeight: 500 }}>{session.user.email}</span>
            </div>

            <button
                onClick={() => setCurrency(currency === 'EUR' ? 'USD' : 'EUR')}
                className="icon-btn"
                title="Zmeniť Menu"
                style={{ padding: '0.5rem', border: '1px solid var(--border)', fontWeight: 'bold', width: '36px', height: '36px' }}
            >
                {currency === 'EUR' ? '€' : '$'}
            </button>

            <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="icon-btn"
                title="Zmeniť Tému"
                style={{ padding: '0.5rem', border: '1px solid var(--border)', width: '36px', height: '36px' }}
            >
                {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
            </button>

            <button
                onClick={() => signOut()}
                className="icon-btn danger"
                title="Sign Out"
                style={{ padding: '0.5rem', border: '1px solid var(--border)', width: '36px', height: '36px' }}
            >
                <LogOut size={16} />
            </button>
        </div>
    );
}
