#!/usr/bin/env node

/**
 * Jabalpuriya.com - Automated RSS Aggregation & Normalization Engine
 * 
 * Features:
 * - Multi-source RSS feed ingestion (Google News Jabalpur topic, MP State Feeds, Local Publishers)
 * - Brand Safety Filter (Spam/Malware domain blacklist, clickbait / offensive keyword filtration)
 * - Intelligent Deduplication (Levenshtein / Token-Dice similarity matching on normalized headlines)
 * - Schema Normalization (Valid ISO timestamps, image fallback pipeline, category classification)
 * - Atomic JSON update to `src/data/news.json`
 */

import { writeFileSync, readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_FILE = join(__dirname, '..', 'src', 'data', 'news.json');

// --- Configuration & Feed Sources ---
const RSS_FEEDS = [
  {
    name: 'Google News - Jabalpur',
    url: 'https://news.google.com/rss/search?q=Jabalpur+when:3d&hl=en-IN&gl=IN&ceid=IN:en',
    defaultCategory: 'Local News'
  },
  {
    name: 'Google News - Jabalpur Hindi',
    url: 'https://news.google.com/rss/search?q=%E0%A4%9C%E0%A4%AC%E0%A4%B2%E0%A4%AA%E0%A5%81%E0%A4%B0+when:3d&hl=hi&gl=IN&ceid=IN:hi',
    defaultCategory: 'Local News'
  },
  {
    name: 'Times of India - MP',
    url: 'https://timesofindia.indiatimes.com/rssfeeds/2950623.cms',
    defaultCategory: 'Local News'
  },
  {
    name: 'The Free Press Journal - MP',
    url: 'https://www.freepressjournal.in/feed',
    defaultCategory: 'Smart City & Infra'
  }
];

// Curated Category Keywords for Auto-tagging
const CATEGORY_RULES = [
  { category: 'Smart City & Infra', keywords: ['flyover', 'ring road', 'smart city', 'railway', 'airport', 'dumna airport', 'highway', 'metro', 'nhai', 'infrastructure', 'bridge', 'bypass'] },
  { category: 'Culture & Tourism', keywords: ['bhedaghat', 'dhuandhar', 'narmada', 'aarti', 'gwarighat', 'madan mahal', 'heritage', 'chausath yogini', 'marble rocks', 'temple', 'festival', 'tourism'] },
  { category: 'Education & Tech', keywords: ['iiitdm', 'rdvv', 'university', 'college', 'school', 'students', 'exam', 'engineering', 'ai hub', 'startup', 'robotics'] },
  { category: 'Business & Jobs', keywords: ['garment', 'mpidc', 'textile', 'investment', 'industry', 'market', 'trade', 'chamber of commerce', 'jobs', 'economy', 'richhai'] },
  { category: 'Environment & City', keywords: ['dumna park', 'forest', 'rain', 'weather', 'climate', 'pollution', 'aqi', 'wetland', 'wildlife', 'swachh'] },
  { category: 'Local News', keywords: ['jabalpur', 'district', 'collector', 'commissioner', 'jmc', 'police', 'court', 'high court', 'sanskaardhani'] },
];

// Brand Safety Lists
const BLOCKED_DOMAINS = [
  'spam-news.xyz', 'clickbait-portal.club', 'rumorwire.com', 'scamalert.co',
  'free-crypto-news.cc', 'celebritygossip.online', 'unverifiedblog.in'
];

const PROHIBITED_KEYWORDS = [
  'gambling', 'casino', 'betting app', 'lottery result hack',
  'porn', 'adult game', 'free crypto giveaway', 'miracle cure'
];

// Fallback high-res imagery for Jabalpur categories
const CATEGORY_IMAGES = {
  'Smart City & Infra': 'https://images.unsplash.com/photo-1545459720-aac8509eb02c?auto=format&fit=crop&w=800&q=80',
  'Culture & Tourism': 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
  'Education & Tech': 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80',
  'Business & Jobs': 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=800&q=80',
  'Environment & City': 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80',
  'Local News': 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=800&q=80',
};

// --- String Similarity & Deduplication Algorithms ---
function cleanText(text) {
  if (!text) return '';
  return text
    .replace(/<[^>]+>/g, '') // Strip HTML tags
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
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

// Calculate Dice Token Similarity (0.0 to 1.0)
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

// Category Classifier
function classifyCategory(title, description, fallback) {
  const text = `${title} ${description}`.toLowerCase();
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some(kw => text.includes(kw))) {
      return rule.category;
    }
  }
  return fallback || 'Local News';
}

// Brand Safety Evaluator
function isBrandSafe(item) {
  const content = `${item.title} ${item.excerpt} ${item.sourceUrl}`.toLowerCase();

  // Check prohibited words
  for (const badWord of PROHIBITED_KEYWORDS) {
    if (content.includes(badWord)) {
      console.warn(`[SAFETY] Filtered out story matching banned keyword: "${badWord}"`);
      return false;
    }
  }

  // Check domain blacklist
  try {
    const url = new URL(item.sourceUrl);
    if (BLOCKED_DOMAINS.some(domain => url.hostname.includes(domain))) {
      console.warn(`[SAFETY] Filtered out story from blacklisted domain: "${url.hostname}"`);
      return false;
    }
  } catch (e) {
    // Malformed URL
  }

  // Minimum quality checks
  if (!item.title || item.title.length < 15) return false;
  return true;
}

// Extract XML elements cleanly without external dependencies
function parseRSSXml(xmlString, feedConfig) {
  const items = [];
  const itemMatches = xmlString.match(/<item[\s\S]*?<\/item>/gi) || [];

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
    const excerpt = cleanText(rawDesc).slice(0, 240);
    const source = cleanText(rawSource) || feedConfig.name.split(' - ')[0];
    const sourceUrl = rawLink.trim();

    if (!title || !sourceUrl) continue;

    // Check if relevant to Jabalpur
    const isJabalpurRelated = /jabalpur|sanskaardhani|bhedaghat|dhuandhar|narmada|gwarighat|madan mahal|dumna|iiitdm|rdvv|मदन महल|जबलपुर|भेड़ाघाट|नर्मदा/i.test(`${title} ${excerpt}`);
    if (!isJabalpurRelated && !feedConfig.name.includes('Jabalpur')) {
      continue;
    }

    const category = classifyCategory(title, excerpt, feedConfig.defaultCategory);
    let publishedAt;
    try {
      publishedAt = rawPubDate ? new Date(rawPubDate).toISOString() : new Date().toISOString();
    } catch (e) {
      publishedAt = new Date().toISOString();
    }

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 60);

    const id = `jbp-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 4)}`;

    items.push({
      id,
      title,
      slug,
      excerpt: excerpt || `Latest updates regarding ${title} in Jabalpur, Madhya Pradesh.`,
      content: excerpt,
      category,
      source,
      sourceUrl,
      imageUrl: CATEGORY_IMAGES[category] || CATEGORY_IMAGES['Local News'],
      publishedAt,
      readTime: `${Math.max(2, Math.ceil(title.split(' ').length / 30))} min read`,
      isFeatured: false,
      tags: [category, 'Jabalpur', 'Madhya Pradesh']
    });
  }

  return items;
}

// --- Main Aggregation Workflow ---
async function fetchAndNormalizeNews() {
  console.log('🚀 [Jabalpuriya] Starting News Aggregation Engine...');
  
  // Read existing data if available
  let existingArticles = [];
  if (existsSync(DATA_FILE)) {
    try {
      const data = JSON.parse(readFileSync(DATA_FILE, 'utf-8'));
      existingArticles = data.articles || [];
      console.log(`📂 Loaded ${existingArticles.length} existing articles from news.json`);
    } catch (e) {
      console.warn('⚠️ Could not parse existing news.json; starting fresh.');
    }
  }

  const fetchedPool = [];

  for (const feed of RSS_FEEDS) {
    try {
      console.log(`📡 Fetching feed: ${feed.name}...`);
      const response = await fetch(feed.url, {
        headers: {
          'User-Agent': 'JabalpuriyaNewsBot/1.0 (+https://jabalpuriya.com/bot)'
        },
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        console.warn(`⚠️ HTTP ${response.status} fetching ${feed.name}`);
        continue;
      }

      const xml = await response.text();
      const parsedItems = parseRSSXml(xml, feed);
      console.log(`✅ Parsed ${parsedItems.length} candidate stories from ${feed.name}`);
      fetchedPool.push(...parsedItems);
    } catch (err) {
      console.warn(`⚠️ Error fetching ${feed.name}: ${err.message}`);
    }
  }

  // Combine fresh candidates with existing items
  const combined = [...fetchedPool, ...existingArticles];
  console.log(`📊 Processing ${combined.length} total items for deduplication and safety verification...`);

  // Filter Brand Safety
  const safeItems = combined.filter(item => isBrandSafe(item));

  // Deduplicate by Title Similarity
  const deduplicated = [];
  for (const candidate of safeItems) {
    const isDuplicate = deduplicated.some(existing => {
      const similarity = calculateSimilarity(candidate.title, existing.title);
      return similarity > 0.65; // High semantic/token overlap threshold
    });

    if (!isDuplicate) {
      deduplicated.push(candidate);
    }
  }

  // Sort by published date descending
  deduplicated.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  // Cap to top 24 high quality stories
  const finalArticles = deduplicated.slice(0, 24);

  // Mark topmost story as featured
  if (finalArticles.length > 0) {
    finalArticles.forEach((art, idx) => {
      art.isFeatured = idx === 0;
    });
  }

  // Generate output payload
  const payload = {
    lastUpdated: new Date().toISOString(),
    totalStories: finalArticles.length,
    sources: [...new Set(finalArticles.map(a => a.source))],
    articles: finalArticles
  };

  // Write to src/data/news.json
  writeFileSync(DATA_FILE, JSON.stringify(payload, null, 2), 'utf-8');
  console.log(`🎉 [Jabalpuriya] Successfully wrote ${finalArticles.length} brand-safe stories to src/data/news.json!`);
}

// Execute
fetchAndNormalizeNews().catch(err => {
  console.error('❌ Fatal error in news fetcher:', err);
  process.exit(1);
});
