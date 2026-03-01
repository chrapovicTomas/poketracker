export function formatCurrency(value: number | null, currency: 'EUR' | 'USD' = 'EUR'): string {
    if (value === null || value === undefined) return 'N/A';

    // Fixed conversion rate based on plan
    const convertedValue = currency === 'USD' ? value * 1.05 : value;

    return new Intl.NumberFormat(currency === 'EUR' ? 'sk-SK' : 'en-US', {
        style: 'currency',
        currency: currency,
    }).format(convertedValue);
}

export function calculateProfit(buyPrice: number, currentPrice: number | null) {
    if (currentPrice === null) return { absolute: 0, percentage: 0 };
    const absolute = currentPrice - buyPrice;
    const percentage = (absolute / buyPrice) * 100;
    return { absolute, percentage };
}
