'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'light' | 'dark' | 'system';
type Currency = 'EUR' | 'USD';

interface SettingsContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    currency: Currency;
    setCurrency: (currency: Currency) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>('system');
    const [currency, setCurrency] = useState<Currency>('EUR');
    const [mounted, setMounted] = useState(false);

    // Initialize from localStorage on mount
    useEffect(() => {
        setMounted(true);
        const storedTheme = localStorage.getItem('poketracker-theme') as Theme | null;
        if (storedTheme) setTheme(storedTheme);

        const storedCurrency = localStorage.getItem('poketracker-currency') as Currency | null;
        if (storedCurrency) setCurrency(storedCurrency);
    }, []);

    // Apply theme to document element
    useEffect(() => {
        if (!mounted) return;

        const root = window.document.documentElement;

        root.classList.remove('light', 'dark');
        root.removeAttribute('data-theme');

        if (theme === 'system') {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            root.setAttribute('data-theme', systemTheme);
        } else {
            root.setAttribute('data-theme', theme);
        }

        localStorage.setItem('poketracker-theme', theme);
    }, [theme, mounted]);

    // Persist currency
    useEffect(() => {
        if (!mounted) return;
        localStorage.setItem('poketracker-currency', currency);
    }, [currency, mounted]);

    // Listen for system theme changes if set to system
    useEffect(() => {
        if (theme !== 'system') return;

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e: MediaQueryListEvent) => {
            const root = window.document.documentElement;
            root.setAttribute('data-theme', e.matches ? 'dark' : 'light');
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [theme]);

    return (
        <SettingsContext.Provider value={{ theme, setTheme, currency, setCurrency }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
}
