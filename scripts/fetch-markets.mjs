#!/usr/bin/env node

/**
 * Jabalpuriya.com - Indian Stock Market & Business News Aggregator
 *
 * Authentic Free Sources:
 * - Exchange Market Data: Yahoo Finance NSE/BSE public chart feed (no API key)
 * - Indian Business & Market News RSS:
 *   1. The Economic Times (Markets)
 *   2. Mint / LiveMint (Markets)
 *   3. Moneycontrol (Business)
 *   4. Google News India (Business & Stock Market — English & Hindi)
 */

import { writeFileSync, readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const MARKETS_DATA_FILE = join(__dirname, '..', 'src', 'data', 'markets.json');

const MARKET_INDICES = [
  { symbol: '^NSEI', name: 'NIFTY 50', hindiName: 'निफ्टी 50', exchange: 'NSE', prefix: '' },
  { symbol: '^BSESN', name: 'BSE SENSEX', hindiName: 'बीएसई सेंसेक्स', exchange: 'BSE', prefix: '' },
  { symbol: '^NSEBANK', name: 'NIFTY BANK', hindiName: 'निफ्टी बैंक', exchange: 'NSE', prefix: '' },
  { symbol: '^CNXIT', name: 'NIFTY IT', hindiName: 'निफ्टी आईटी', exchange: 'NSE', prefix: '' },
  { symbol: '^NSEMDCP50', name: 'NIFTY MIDCAP 50', hindiName: 'निफ्टी मिडकैप 50', exchange: 'NSE', prefix: '' },
  { symbol: 'INR=X', name: 'USD / INR', hindiName: 'डॉलर / रुपया', exchange: 'FOREX', prefix: '₹' }
];

const BLUECHIP_STOCKS = [
  { symbol: 'RELIANCE.NS', ticker: 'RELIANCE', name: 'Reliance Industries', sector: 'Energy & Retail' },
  { symbol: 'TCS.NS', ticker: 'TCS', name: 'Tata Consultancy Services', sector: 'IT Services' },
  { symbol: 'HDFCBANK.NS', ticker: 'HDFCBANK', name: 'HDFC Bank', sector: 'Banking' },
  { symbol: 'BHARTIARTL.NS', ticker: 'BHARTIARTL', name: 'Bharti Airtel', sector: 'Telecom' },
  { symbol: 'ICICIBANK.NS', ticker: 'ICICIBANK', name: 'ICICI Bank', sector: 'Banking' },
  { symbol: 'SBIN.NS', ticker: 'SBIN', name: 'State Bank of India', sector: 'PSU Bank' },
  { symbol: 'INFY.NS', ticker: 'INFY', name: 'Infosys', sector: 'IT Services' },
  { symbol: 'LT.NS', ticker: 'LT', name: 'Larsen & Toubro', sector: 'Infrastructure' },
  { symbol: 'ITC.NS', ticker: 'ITC', name: 'ITC Limited', sector: 'FMCG' },
  { symbol: 'HINDUNILVR.NS', ticker: 'HINDUNILVR', name: 'Hindustan Unilever', sector: 'FMCG' }
];

const BUSINESS_RSS_FEEDS = [
  {
    name: 'The Economic Times',
    url: 'https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms',
    category: 'Stock Market',
    lang: 'en'
  },
  {
    name: 'Mint (LiveMint)',
    url: 'https://www.livemint.com/rss/markets',
    category: 'Stock Market',
    lang: 'en'
  },
  {
    name: 'Moneycontrol',
    url: 'https://www.moneycontrol.com/rss/business.xml',
    category: 'India Business',
    lang: 'en'
  },
  {
    name: 'Google News Business (Hindi)',
    url: 'https://news.google.com/rss/search?q=%E0%A4%B6%E0%A5%87%E0%A4%AF%E0%A4%B0+%E0%A4%AC%E0%A4%BE%E0%A4%9C%E0%A4%BE%E0%A4%B0+%E0%A4%B8%E0%A5%87%E0%A4%82%E0%A4%B8%E0%A5%87%E0%A4%95%E0%A5%8D%E0%A4%B8+%E0%A4%A8%E0%A4%BF%E0%A4%AB%E0%A5%8D%E0%A4%9F%E0%A5%80+when:3d&hl=hi&gl=IN&ceid=IN:hi',
    category: 'हिंदी बिजनेस',
    lang: 'hi'
  },
  {
    name: 'Google News India Economy',
    url: 'https://news.google.com/rss/search?q=India+economy+RBI+Sensex+Nifty+business+when:3d&hl=en-IN&gl=IN&ceid=IN:en',
    category: 'India Business',
    lang: 'en'
  }
];

function cleanText(text) {
  if (!text) return '';
  let str = String(text)
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec));

  str = str.replace(/<[^>]*>?/gm, ' ');
  str = str
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return str;
}

function formatExcerpt(rawExcerpt, title, sourceName) {
  const cleaned = cleanText(rawExcerpt);
  const titleNorm = cleanText(title).toLowerCase().slice(0, 35);
  const isDuplicate = cleaned.toLowerCase().startsWith(titleNorm);
  const isBroken = cleaned.includes('http://') || cleaned.includes('https://') || cleaned.length < 35;

  if (!cleaned || isDuplicate || isBroken) {
    const isHindi = /[\u0900-\u097F]/.test(title);
    return isHindi
      ? `${title} — भारतीय शेयर बाजार और व्यापार जगत की ताज़ा रिपोर्ट (${sourceName})।`
      : `${title} — Latest Indian stock market, corporate, and economy coverage reported by ${sourceName}.`;
  }

  return cleaned.length > 210 ? cleaned.slice(0, 207).trim() + '...' : cleaned;
}

async function fetchYahooQuote(symbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=5d`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; JabalpuriyaMarketsBot/1.0)' },
    signal: AbortSignal.timeout(9000)
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  const result = data?.chart?.result?.[0];
  if (!result || !result.meta) throw new Error('Invalid Yahoo payload');

  const meta = result.meta;
  const closes = (result.indicators?.quote?.[0]?.close || []).filter((v) => typeof v === 'number' && !Number.isNaN(v));
  const price = typeof meta.regularMarketPrice === 'number' ? meta.regularMarketPrice : closes[closes.length - 1];
  const prevClose = closes.length >= 2 ? closes[closes.length - 2] : (meta.chartPreviousClose || price);
  const change = price - prevClose;
  const changePercent = prevClose ? (change / prevClose) * 100 : 0;

  return {
    price: Number(price.toFixed(2)),
    prevClose: Number(prevClose.toFixed(2)),
    change: Number(change.toFixed(2)),
    changePercent: Number(changePercent.toFixed(2)),
    dayHigh: typeof meta.regularMarketDayHigh === 'number' ? Number(meta.regularMarketDayHigh.toFixed(2)) : Number(price.toFixed(2)),
    dayLow: typeof meta.regularMarketDayLow === 'number' ? Number(meta.regularMarketDayLow.toFixed(2)) : Number(price.toFixed(2)),
    week52High: typeof meta.fiftyTwoWeekHigh === 'number' ? Number(meta.fiftyTwoWeekHigh.toFixed(2)) : null,
    week52Low: typeof meta.fiftyTwoWeekLow === 'number' ? Number(meta.fiftyTwoWeekLow.toFixed(2)) : null,
    marketTime: meta.regularMarketTime ? new Date(meta.regularMarketTime * 1000).toISOString() : new Date().toISOString()
  };
}

function parseBusinessRss(xml, feed) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;
  let count = 0;

  while ((match = itemRegex.exec(xml)) !== null && count < 8) {
    const block = match[1];
    const titleMatch = block.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
    const linkMatch = block.match(/<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i);
    const descMatch = block.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i);
    const dateMatch = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/i);
    const sourceMatch = block.match(/<source[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/source>/i);

    let rawTitle = titleMatch ? cleanText(titleMatch[1]) : '';
    const link = linkMatch ? cleanText(linkMatch[1]) : '';
    const sourceName = sourceMatch ? cleanText(sourceMatch[1]) : feed.name;

    // Strip redundant trailing " - Publisher" from Google News titles
    if (feed.name.startsWith('Google News') && sourceMatch) {
      rawTitle = rawTitle.replace(new RegExp(`\\s*-\\s*${sourceName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'), '').trim();
    }

    if (!rawTitle || rawTitle.length < 18 || !link) continue;

    let publishedAt = new Date().toISOString();
    if (dateMatch) {
      const parsed = new Date(dateMatch[1]);
      if (!Number.isNaN(parsed.getTime())) publishedAt = parsed.toISOString();
    }

    const excerpt = formatExcerpt(descMatch ? descMatch[1] : '', rawTitle, sourceName);

    items.push({
      id: `biz-${Buffer.from(rawTitle.slice(0, 40)).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 12)}-${count}`,
      title: rawTitle,
      excerpt,
      source: sourceName,
      sourceUrl: link,
      category: feed.category,
      lang: /[\u0900-\u097F]/.test(rawTitle) ? 'hi' : feed.lang,
      publishedAt
    });
    count++;
  }

  return items;
}

export async function fetchMarketsData() {
  console.log('📈 [Jabalpuriya Markets] Fetching Indian Stock Market & Business News...');

  let existing = { indices: [], stocks: [], news: [] };
  if (existsSync(MARKETS_DATA_FILE)) {
    try {
      existing = JSON.parse(readFileSync(MARKETS_DATA_FILE, 'utf-8'));
    } catch {}
  }

  // 1. Fetch Market Indices
  const indices = await Promise.all(
    MARKET_INDICES.map(async (idx) => {
      try {
        const quote = await fetchYahooQuote(idx.symbol);
        return { ...idx, ...quote };
      } catch (err) {
        console.warn(`⚠️ Failed to fetch index ${idx.symbol}: ${err.message}`);
        const prev = (existing.indices || []).find((x) => x.symbol === idx.symbol);
        return prev || { ...idx, price: 0, prevClose: 0, change: 0, changePercent: 0, dayHigh: 0, dayLow: 0, marketTime: new Date().toISOString() };
      }
    })
  );

  // 2. Fetch Blue-Chip NSE Stocks
  const stocks = await Promise.all(
    BLUECHIP_STOCKS.map(async (st) => {
      try {
        const quote = await fetchYahooQuote(st.symbol);
        return { ...st, ...quote };
      } catch (err) {
        console.warn(`⚠️ Failed to fetch stock ${st.symbol}: ${err.message}`);
        const prev = (existing.stocks || []).find((x) => x.symbol === st.symbol);
        return prev || { ...st, price: 0, prevClose: 0, change: 0, changePercent: 0, dayHigh: 0, dayLow: 0, week52High: null, week52Low: null, marketTime: new Date().toISOString() };
      }
    })
  );

  // 3. Fetch India Business & Stock Market RSS News
  const newsPool = [];
  for (const feed of BUSINESS_RSS_FEEDS) {
    try {
      const res = await fetch(feed.url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; JabalpuriyaMarketsBot/1.0; +https://jabalpuriya.com)' },
        signal: AbortSignal.timeout(10000)
      });
      if (!res.ok) continue;
      const xml = await res.text();
      const parsed = parseBusinessRss(xml, feed);
      console.log(`✅ [Markets RSS] ${feed.name}: ${parsed.length} stories`);
      newsPool.push(...parsed);
    } catch (err) {
      console.warn(`⚠️ Failed RSS ${feed.name}: ${err.message}`);
    }
  }

  // Deduplicate news by normalized title prefix
  const seen = new Set();
  const dedupedNews = [];
  for (const item of newsPool) {
    const key = item.title.toLowerCase().replace(/[^a-z0-9\u0900-\u097F]/g, '').slice(0, 40);
    if (!seen.has(key)) {
      seen.add(key);
      dedupedNews.push(item);
    }
  }

  dedupedNews.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  const finalNews = dedupedNews.length > 0 ? dedupedNews.slice(0, 24) : (existing.news || []);

  const payload = {
    lastUpdated: new Date().toISOString(),
    sources: [
      { name: 'NSE / BSE Exchange Data (via Yahoo Finance)', type: 'Market Indices & Equities' },
      { name: 'The Economic Times Markets RSS', type: 'Stock Market News' },
      { name: 'Mint (LiveMint) Markets RSS', type: 'Financial News' },
      { name: 'Moneycontrol Business RSS', type: 'Corporate & Economy' },
      { name: 'Google News India (English & Hindi)', type: 'Aggregated Business Headlines' }
    ],
    indices,
    stocks,
    news: finalNews
  };

  writeFileSync(MARKETS_DATA_FILE, JSON.stringify(payload, null, 2), 'utf-8');
  console.log(`🎉 [Jabalpuriya Markets] Saved ${indices.length} indices, ${stocks.length} stocks, and ${finalNews.length} business stories to src/data/markets.json`);
  return payload;
}

// Allow direct CLI execution
if (process.argv[1] === __filename) {
  fetchMarketsData().catch((err) => {
    console.error('❌ Markets fetch failed:', err);
    process.exit(1);
  });
}
