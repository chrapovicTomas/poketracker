import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

// Add the stealth plugin to avoid detection
puppeteer.use(StealthPlugin());

export async function POST(req: Request) {
    try {
        const { url } = await req.json();

        if (!url || typeof url !== 'string') {
            return NextResponse.json({ error: 'Invalid URL provided' }, { status: 400 });
        }

        // Launch the browser with minimal args, let stealth plugin do the heavy lifting
        const browser = await puppeteer.launch({
            headless: true, // Run headlessly so the browser window stays hidden
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox'
            ]
        });

        const page = await browser.newPage();

        // Moderate viewport
        await page.setViewport({ width: 1280, height: 800 });

        // Navigate to the URL
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });

        // Wait up to 10 seconds for Cloudflare to verify the "real" browser
        await new Promise(r => setTimeout(r, 10000));

        // Extract the HTML content so we can parse it
        const html = await page.content();
        await browser.close();

        let foundPrice: number | null = null;
        let foundImage: string | null = null;
        // Use the final page URL in case of redirects (e.g., PokemonTCG API prices URL)
        const finalUrl = page.url();
        const urlLower = finalUrl.toLowerCase();

        const cheerio = await import('cheerio');
        const $ = cheerio.load(html);

        // Extract Image
        foundImage = $('meta[property="og:image"]').attr('content') || $('meta[name="twitter:image"]').attr('content') || null;

        // 1. Cardmarket Specific Logic
        if (urlLower.includes('cardmarket.com')) {
            // Look for the "From" or "Trend Price" on Cardmarket
            const trendPriceText = $('dt:contains("Trend Price")').next('dd').text().trim() ||
                $('dt:contains("30-days average price")').next('dd').text().trim() ||
                $('div.price-container span.color-primary').text().trim();

            if (trendPriceText) {
                const parsed = extractPriceFromText(trendPriceText);
                if (parsed !== null) foundPrice = parsed;
            }
        }

        // 2. TCGPlayer Specific Logic (Target "Market Price")
        if (foundPrice === null && urlLower.includes('tcgplayer.com')) {
            // Specifically look for the "Market Price" label and grab the next span or price near it
            let marketPriceText = '';

            // Try explicit label sibling
            $('span, div, h2, h3').each((i, el) => {
                const text = $(el).text().trim();
                if (text === 'Market Price') {
                    // Try to find the price in the next sibling or parent's sibling
                    marketPriceText = $(el).next().text().trim() || $(el).parent().next().text().trim();
                }
            });

            // Fallback classes for TCGPlayer if explicit traversal fails
            if (!marketPriceText) {
                marketPriceText = $('.price-point--market .price-point__data').text().trim() ||
                    $('.spotlight__price').text().trim() ||
                    $('.product-details__market-price .price').text().trim();
            }

            if (marketPriceText) {
                const parsed = extractPriceFromText(marketPriceText);
                if (parsed !== null) foundPrice = parsed;
            }
        }

        // 3. Generic Regex Fallback over the whole DOM
        if (foundPrice === null) {
            const regexPatterns = [
                /marketprice[a-z_]*["':\s]+([0-9]+\.[0-9]{2})/i,
                /price[a-z_]*["':\s]+\$([0-9,]+\.[0-9]{2})/i,
                /price[a-z_]*["':\s]+€?([0-9,]+\.[0-9]{2})/i,
                /€\s?([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})?)/,
                /\$([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})?)/,
                /([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})?)\s?€/
            ];

            for (const pattern of regexPatterns) {
                const match = html.match(pattern);
                if (match && match[1]) {
                    const parsed = extractPriceFromText(match[1]);
                    if (parsed !== null) {
                        foundPrice = parsed;
                        break;
                    }
                }
            }
        }

        if (foundPrice !== null) {
            let finalPrice = foundPrice;

            // Convert USD to EUR for TCGPlayer
            if (urlLower.includes('tcgplayer.com')) {
                try {
                    const rateRes = await fetch('https://open.er-api.com/v6/latest/USD');
                    if (rateRes.ok) {
                        const rateData = await rateRes.json();
                        const eurRate = rateData.rates?.EUR;
                        if (eurRate) {
                            finalPrice = parseFloat((foundPrice * eurRate).toFixed(2));
                        }
                    }
                } catch (e) {
                    console.error('Failed to fetch currency conversion rate', e);
                }
            }

            return NextResponse.json({
                price: finalPrice,
                currency: 'EUR',
                imageUrl: foundImage,
                success: true
            });
        }

        // If we missed everything, maybe Cloudflare still caught us
        if (html.includes('cf-browser-verification') || html.includes('Wait a moment') || html.includes('Enable JavaScript and cookies')) {
            return NextResponse.json({ error: 'Browser blocked by Cloudflare verification.' }, { status: 403 });
        }

        return NextResponse.json({ error: 'Could not find a price element on the page.' }, { status: 404 });

    } catch (error: any) {
        console.error('Scraping Error:', error);
        return NextResponse.json({ error: 'Failed to process the URL.' }, { status: 500 });
    }
}

// Helpers
function extractPriceFromText(text: string): number | null {
    // Matches €123,45, 123,45 €, $123.45, 1,234.56
    // Cardmarket uses european format: 12,34 €
    // Replace comma with dot for parsing
    const formatted = text.replace(',', '.');
    const regex = /[\$€]\s?(?:[0-9]{1,3}(?:\.[0-9]{3})+|[0-9]+)(?:\.[0-9]{2})?|(?:[0-9]{1,3}(?:\.[0-9]{3})+|[0-9]+)(?:\.[0-9]{2})?\s?[\$€]/;
    const match = formatted.match(regex);
    if (match) {
        const cleanStr = match[0].replace(/[^0-9.]/g, '');
        const num = parseFloat(cleanStr);
        return isNaN(num) ? null : num;
    }

    // Direct fallback
    const cleanStrFallback = formatted.replace(/[^0-9.]/g, '');
    if (cleanStrFallback) {
        const numFallback = parseFloat(cleanStrFallback);
        return isNaN(numFallback) ? null : numFallback;
    }
    return null;
}
