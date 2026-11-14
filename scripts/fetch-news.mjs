#!/usr/bin/env node

/**
 * Jabalpuriya.com - High-Performance Automated RSS Aggregator & Content Engine
 * 
 * Features:
 * - Permanent URL retention: NEVER deletes historical articles, ensuring all /news/[slug] URLs live forever
 * - Multi-pattern image extraction with vibrant Jabalpur photography fallback
 * - Robust entity decoding & clean excerpt generation (no broken Google redirect URLs)
 * - Automated XML Sitemap & Google News Sitemap generation
 * - Hindi & English keyword enrichment for maximum local search visibility
 */

import { writeFileSync, readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_FILE = join(__dirname, '..', 'src', 'data', 'news.json');
const SITEMAP_FILE = join(__dirname, '..', 'public', 'sitemap.xml');
const SITEMAP_NEWS_FILE = join(__dirname, '..', 'public', 'sitemap-news.xml');

// --- RSS Feed Sources ---
const RSS_FEEDS = [
  {
    name: 'Google News - Jabalpur',
    url: 'https://news.google.com/rss/search?q=Jabalpur+when:7d&hl=en-IN&gl=IN&ceid=IN:en',
    defaultCategory: 'Local News'
  },
  {
    name: 'Google News - Jabalpur Hindi',
    url: 'https://news.google.com/rss/search?q=%E0%A4%9C%E0%A4%AC%E0%A4%B2%E0%A4%AA%E0%A5%81%E0%A4%B0+when:7d&hl=hi&gl=IN&ceid=IN:hi',
    defaultCategory: 'Local News'
  },
  {
    name: 'Times of India - MP',
    url: 'https://timesofindia.indiatimes.com/rssfeeds/2950623.cms',
    defaultCategory: 'Smart City & Infra'
  },
  {
    name: 'The Free Press Journal - MP',
    url: 'https://www.freepressjournal.in/feed',
    defaultCategory: 'Culture & Tourism'
  }
];

// Rich Curated Category-Specific Jabalpur Photography Pool
const CURATED_JABALPUR_IMAGES = {
  'Smart City & Infra': [
    'https://images.unsplash.com/photo-1545459720-aac8509eb02c?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1590486803833-1c5dc8ddd4c8?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=1000&q=80'
  ],
  'Culture & Tourism': [
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1609743522653-52354461cf27?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1000&q=80'
  ],
  'Education & Tech': [
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1000&q=80'
  ],
  'Business & Jobs': [
    'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1444653614773-995cb1ef9028?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1000&q=80'
  ],
  'Environment & City': [
    'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1000&q=80'
  ],
  'Local News': [
    'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1000&q=80'
  ]
};

// Category Keywords Mapping
const CATEGORY_RULES = [
  { category: 'Smart City & Infra', keywords: ['flyover', 'ring road', 'smart city', 'railway', 'airport', 'dumna airport', 'highway', 'metro', 'nhai', 'infrastructure', 'bridge', 'bypass', 'traffic', 'vande bharat'] },
  { category: 'Culture & Tourism', keywords: ['bhedaghat', 'dhuandhar', 'narmada', 'aarti', 'gwarighat', 'madan mahal', 'heritage', 'chausath yogini', 'marble rocks', 'temple', 'festival', 'tourism', 'garba', 'navratri', 'mela', 'tilwara'] },
  { category: 'Education & Tech', keywords: ['iiitdm', 'rdvv', 'university', 'college', 'school', 'students', 'exam', 'engineering', 'ai hub', 'startup', 'robotics', 'result', 'admission'] },
  { category: 'Business & Jobs', keywords: ['garment', 'mpidc', 'textile', 'investment', 'industry', 'market', 'trade', 'chamber of commerce', 'jobs', 'economy', 'richhai', 'gold rate', 'business', 'mandi'] },
  { category: 'Environment & City', keywords: ['dumna park', 'forest', 'rain', 'weather', 'climate', 'pollution', 'aqi', 'wetland', 'wildlife', 'swachh', 'river', 'bargi dam'] },
  { category: 'Local News', keywords: ['jabalpur', 'district', 'collector', 'commissioner', 'jmc', 'police', 'court', 'high court', 'sanskaardhani', 'shahar', 'जबलपुर'] },
];

const BLOCKED_DOMAINS = [
  'spam-news.xyz', 'clickbait-portal.club', 'rumorwire.com', 'scamalert.co',
  'free-crypto-news.cc', 'celebritygossip.online', 'unverifiedblog.in'
];

const PROHIBITED_KEYWORDS = [
  'gambling', 'casino', 'betting app', 'lottery result hack',
  'porn', 'adult game', 'free crypto giveaway', 'miracle cure'
];

/**
 * Proper HTML Entity Decoder & Tag Stripper
 */
function cleanText(text) {
  if (!text) return '';
  let str = String(text)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ');

  // Second pass in case of double-escaped HTML
  str = str
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  // Strip all HTML tags
  str = str.replace(/<[^>]+>/g, '');
  return str.replace(/\s+/g, ' ').trim();
}

/**
 * Clean & Human-Friendly Story Excerpt Generator
 */
function formatCleanExcerpt(rawDesc, title, source, category) {
  let cleaned = cleanText(rawDesc);

  // If description contains source, clean it off the end
  if (source && cleaned.endsWith(source)) {
    cleaned = cleaned.slice(0, -source.length).trim();
  }
  cleaned = cleaned.replace(/^[-\s|•]+|[-\s|•]+$/g, '').trim();

  const isDuplicateOfTitle = cleaned.toLowerCase() === title.toLowerCase();
  const isUrlOrBroken = cleaned.includes('news.google.com') || cleaned.startsWith('http') || cleaned.length < 25;

  if (!cleaned || isDuplicateOfTitle || isUrlOrBroken) {
    const isHindi = /[\u0900-\u097F]/.test(title);
    if (isHindi) {
      return `${title} - संस्कारधानी जबलपुर और मध्य प्रदेश की ताज़ा व प्रामाणिक रिपोर्ट। विस्तार से जानें पूरा घटनाक्रम।`;
    } else {
      return `${title} - Verified local news report, infrastructure update, and civic development coverage from Jabalpur, Madhya Pradesh.`;
    }
  }

  // Ensure proper end punctuation
  if (!/[.!?।]$/.test(cleaned)) {
    cleaned += '.';
  }

  return cleaned.slice(0, 300);
}

function normalizeTitleForComparison(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 2)
    .sort()
    .join(' ');
}

function calculateSimilarity(str1, str2) {
  const norm1 = normalizeTitleForComparison(str1);
  const norm2 = normalizeTitleForComparison(str2);
  if (norm1 === norm2) return 1.0;
  if (!norm1 || !norm2) return 0.0;

  const set1 = new Set(norm1.split(' '));
  const set2 = new Set(norm2.split(' '));
  let intersection = 0;
  for (const item of set1) {
    if (set2.has(item)) intersection++;
  }
  return (2 * intersection) / (set1.size + set2.size);
}

function classifyCategory(title, description, fallback) {
  const text = `${title} ${description}`.toLowerCase();
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some(kw => text.includes(kw))) {
      return rule.category;
    }
  }
  return fallback || 'Local News';
}

function isBrandSafe(item) {
  const content = `${item.title} ${item.excerpt} ${item.sourceUrl}`.toLowerCase();
  for (const badWord of PROHIBITED_KEYWORDS) {
    if (content.includes(badWord)) return false;
  }
  try {
    const url = new URL(item.sourceUrl);
    if (BLOCKED_DOMAINS.some(domain => url.hostname.includes(domain))) return false;
  } catch (e) {}
  if (!item.title || item.title.length < 15) return false;
  return true;
}

// Extract image from RSS item XML
function extractImageUrl(itemXml, category, index) {
  // 1. Check media:content
  const mediaContent = itemXml.match(/<media:content[^>]+url=["']([^"']+)["']/i);
  if (mediaContent && mediaContent[1] && mediaContent[1].startsWith('http')) {
    return mediaContent[1];
  }

  // 2. Check enclosure url
  const enclosure = itemXml.match(/<enclosure[^>]+url=["']([^"']+)["']/i);
  if (enclosure && enclosure[1] && enclosure[1].startsWith('http') && !enclosure[1].includes('.mp3')) {
    return enclosure[1];
  }

  // 3. Check media:thumbnail
  const mediaThumbnail = itemXml.match(/<media:thumbnail[^>]+url=["']([^"']+)["']/i);
  if (mediaThumbnail && mediaThumbnail[1] && mediaThumbnail[1].startsWith('http')) {
    return mediaThumbnail[1];
  }

  // 4. Check img src in description / CDATA
  const imgSrc = itemXml.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgSrc && imgSrc[1] && imgSrc[1].startsWith('http')) {
    return imgSrc[1];
  }

  // 5. High-resolution thematic photography rotation
  const pool = CURATED_JABALPUR_IMAGES[category] || CURATED_JABALPUR_IMAGES['Local News'];
  return pool[index % pool.length];
}

/**
 * Generate Permanent, SEO-Friendly Slugs
 */
function generateSlug(title, existingSlugs = new Set()) {
  let baseSlug = title
    .toLowerCase()
    .replace(/\s*-\s*[^-]+$/, '') // remove trailing source e.g. " - Dainik Bhaskar"
    .replace(/[^\w\s\u0900-\u097F-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 75)
    .replace(/^-+|-+$/g, '');

  if (!baseSlug || baseSlug.length < 3) {
    baseSlug = 'jabalpur-samachar-' + Date.now().toString(36);
  }

  let slug = baseSlug;
  let counter = 2;
  while (existingSlugs.has(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  return slug;
}

function parseRSSXml(xmlString, feedConfig, existingSlugs) {
  const items = [];
  const itemMatches = xmlString.match(/<item[\s\S]*?<\/item>/gi) || [];

  let idx = 0;
  for (const itemXml of itemMatches) {
    const titleMatch = itemXml.match(/<title>(?:<!\[CDATA\[(.*?)\]\]>|(.*?))<\/title>/i);
    const linkMatch = itemXml.match(/<link>(?:<!\[CDATA\[(.*?)\]\]>|(.*?))<\/link>/i);
    const pubDateMatch = itemXml.match(/<pubDate>(?:<!\[CDATA\[(.*?)\]\]>|(.*?))<\/pubDate>/i);
    const descMatch = itemXml.match(/<description>(?:<!\[CDATA\[(.*?)\]\]>|(.*?))<\/description>/i);
    const sourceMatch = itemXml.match(/<source[^>]*>(?:<!\[CDATA\[(.*?)\]\]>|(.*?))<\/source>/i);

    const rawTitle = titleMatch ? (titleMatch[1] || titleMatch[2] || '') : '';
    const rawLink = linkMatch ? (linkMatch[1] || linkMatch[2] || '') : '';
    const rawPubDate = pubDateMatch ? (pubDateMatch[1] || pubDateMatch[2] || '') : '';
    const rawDesc = descMatch ? (descMatch[1] || descMatch[2] || '') : '';
    const rawSource = sourceMatch ? (sourceMatch[1] || sourceMatch[2] || '') : '';

    const title = cleanText(rawTitle);
    const source = cleanText(rawSource) || feedConfig.name.split(' - ')[0];
    const sourceUrl = rawLink.trim();

    if (!title || !sourceUrl) continue;

    const isJabalpurRelated = /jabalpur|sanskaardhani|bhedaghat|dhuandhar|narmada|gwarighat|madan mahal|dumna|iiitdm|rdvv|मदन महल|जबलपुर|भेड़ाघाट|नर्मदा|तिलवारा/i.test(`${title} ${rawDesc}`);
    if (!isJabalpurRelated && !feedConfig.name.includes('Jabalpur')) {
      continue;
    }

    const category = classifyCategory(title, rawDesc, feedConfig.defaultCategory);
    const excerpt = formatCleanExcerpt(rawDesc, title, source, category);

    let publishedAt;
    try {
      publishedAt = rawPubDate ? new Date(rawPubDate).toISOString() : new Date().toISOString();
    } catch (e) {
      publishedAt = new Date().toISOString();
    }

    const slug = generateSlug(title, existingSlugs);
    existingSlugs.add(slug);

    const id = `jbp-${Date.now().toString(36)}-${idx}-${Math.random().toString(36).substr(2, 4)}`;
    const imageUrl = extractImageUrl(itemXml, category, idx);

    items.push({
      id,
      title,
      slug,
      excerpt,
      content: excerpt,
      category,
      source,
      sourceUrl,
      imageUrl,
      publishedAt,
      readTime: `${Math.max(2, Math.ceil(title.split(' ').length / 26))} min read`,
      isFeatured: false,
      tags: [category, 'Jabalpur', 'Madhya Pradesh']
    });

    idx++;
  }

  return items;
}

/**
 * Generate XML Sitemaps Automatically (Standard + Google News)
 */
function generateSitemaps(articles) {
  const baseUrl = 'https://jabalpuriya.com';
  const nowIso = new Date().toISOString();

  // 1. Static & Evergreen Guide Pages
  const staticPages = [
    { loc: `${baseUrl}/`, priority: '1.0', changefreq: 'hourly', lastmod: nowIso },
    { loc: `${baseUrl}/bhedaghat-guide`, priority: '0.9', changefreq: 'weekly', lastmod: nowIso },
    { loc: `${baseUrl}/gwarighat-aarti`, priority: '0.9', changefreq: 'weekly', lastmod: nowIso },
    { loc: `${baseUrl}/helplines`, priority: '0.9', changefreq: 'weekly', lastmod: nowIso },
    { loc: `${baseUrl}/rashifal`, priority: '0.9', changefreq: 'daily', lastmod: nowIso },
    { loc: `${baseUrl}/mandi-bhav`, priority: '0.9', changefreq: 'daily', lastmod: nowIso },
    { loc: `${baseUrl}/about`, priority: '0.7', changefreq: 'monthly', lastmod: '2026-11-14T00:00:00.000Z' },
    { loc: `${baseUrl}/contact`, priority: '0.7', changefreq: 'monthly', lastmod: '2026-11-14T00:00:00.000Z' },
    { loc: `${baseUrl}/privacy-policy`, priority: '0.5', changefreq: 'monthly', lastmod: '2026-11-14T00:00:00.000Z' },
    { loc: `${baseUrl}/terms`, priority: '0.5', changefreq: 'monthly', lastmod: '2026-11-14T00:00:00.000Z' }
  ];

  let sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  for (const page of staticPages) {
    sitemapXml += `  <url>\n    <loc>${page.loc}</loc>\n    <lastmod>${page.lastmod}</lastmod>\n    <changefreq>${page.changefreq}</changefreq>\n    <priority>${page.priority}</priority>\n  </url>\n`;
  }

  // Add all permanent news article URLs
  for (const article of articles) {
    if (!article.slug) continue;
    sitemapXml += `  <url>\n    <loc>${baseUrl}/news/${encodeURIComponent(article.slug)}</loc>\n    <lastmod>${article.publishedAt}</lastmod>\n    <changefreq>never</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
  }

  sitemapXml += `</urlset>\n`;
  writeFileSync(SITEMAP_FILE, sitemapXml, 'utf-8');
  console.log(`🗺️ [Sitemap] Generated public/sitemap.xml with ${staticPages.length + articles.length} permanent URLs`);

  // 2. Google News Sitemap (Last 48 Hours)
  const twoDaysAgo = Date.now() - 48 * 60 * 60 * 1000;
  const recentArticles = articles.filter(a => new Date(a.publishedAt).getTime() > twoDaysAgo);

  let newsSitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">\n`;

  for (const article of recentArticles) {
    const isHindi = /[\u0900-\u097F]/.test(article.title);
    const escapedTitle = article.title
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

    newsSitemapXml += `  <url>\n    <loc>${baseUrl}/news/${encodeURIComponent(article.slug)}</loc>\n    <news:news>\n      <news:publication>\n        <news:name>Jabalpuriya</news:name>\n        <news:language>${isHindi ? 'hi' : 'en'}</news:language>\n      </news:publication>\n      <news:publication_date>${article.publishedAt}</news:publication_date>\n      <news:title>${escapedTitle}</news:title>\n    </news:news>\n  </url>\n`;
  }

  newsSitemapXml += `</urlset>\n`;
  writeFileSync(SITEMAP_NEWS_FILE, newsSitemapXml, 'utf-8');
  console.log(`📰 [Google News] Generated public/sitemap-news.xml with ${recentArticles.length} recent stories`);
}

async function fetchAndNormalizeNews() {
  console.log('🚀 [Jabalpuriya] Starting High-Performance News Aggregator...');

  // 1. Load existing articles (they must be preserved FOREVER!)
  let existingArticles = [];
  if (existsSync(DATA_FILE)) {
    try {
      const data = JSON.parse(readFileSync(DATA_FILE, 'utf-8'));
      existingArticles = data.articles || [];
      console.log(`📂 Loaded ${existingArticles.length} existing articles from archive`);
    } catch (e) {}
  }

  // Sanitize existing articles' excerpts & ensure slug exists
  const existingSlugs = new Set();
  for (const art of existingArticles) {
    if (!art.slug) {
      art.slug = generateSlug(art.title, existingSlugs);
    }
    existingSlugs.add(art.slug);

    // Clean existing excerpt if it has raw html/google tracking url
    art.excerpt = formatCleanExcerpt(art.excerpt, art.title, art.source, art.category);
    art.content = art.excerpt;
  }

  const fetchedPool = [];

  for (const feed of RSS_FEEDS) {
    try {
      console.log(`📡 Ingesting: ${feed.name}...`);
      const response = await fetch(feed.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; JabalpuriyaBot/3.0; +https://jabalpuriya.com)'
        },
        signal: AbortSignal.timeout(12000)
      });

      if (!response.ok) continue;

      const xml = await response.text();
      const parsedItems = parseRSSXml(xml, feed, existingSlugs);
      console.log(`✅ Extracted ${parsedItems.length} items from ${feed.name}`);
      fetchedPool.push(...parsedItems);
    } catch (err) {
      console.warn(`⚠️ Warning fetching ${feed.name}: ${err.message}`);
    }
  }

  const safeFetched = fetchedPool.filter(item => isBrandSafe(item));

  // Deduplicate newly fetched against each other AND against existing articles
  const newUniqueArticles = [];
  for (const candidate of safeFetched) {
    const isDupOfNew = newUniqueArticles.some(existing => calculateSimilarity(candidate.title, existing.title) > 0.65);
    const isDupOfOld = existingArticles.some(existing => calculateSimilarity(candidate.title, existing.title) > 0.65);

    if (!isDupOfNew && !isDupOfOld) {
      newUniqueArticles.push(candidate);
    }
  }

  console.log(`✨ Found ${newUniqueArticles.length} brand new unique stories`);

  // Combine NEW stories with ALL EXISTING stories (Permanent Archive: Never delete old URLs!)
  const combinedAll = [...newUniqueArticles, ...existingArticles];

  // Sort descending by publication date
  combinedAll.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  if (combinedAll.length > 0) {
    combinedAll.forEach((art, idx) => {
      art.isFeatured = idx === 0;
    });
  }

  const payload = {
    lastUpdated: new Date().toISOString(),
    totalStories: combinedAll.length,
    sources: [...new Set(combinedAll.map(a => a.source))],
    articles: combinedAll
  };

  writeFileSync(DATA_FILE, JSON.stringify(payload, null, 2), 'utf-8');
  console.log(`🎉 [Jabalpuriya] Successfully saved ${combinedAll.length} permanent stories to src/data/news.json!`);

  // Generate sitemaps
  generateSitemaps(combinedAll);
}

fetchAndNormalizeNews().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
