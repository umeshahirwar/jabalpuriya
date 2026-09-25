# Jabalpuriya.com (जबलपुरिया)
> Fast, lightweight, modern news & community information portal dedicated to Jabalpur, Madhya Pradesh.

---

## 🏗️ Architecture & Tech Stack

- **Framework**: [Astro 4+](https://astro.build/) (Static Site Generation / SSG for sub-second page loads and zero runtime JS overhead)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with a custom Jabalpur color palette (Narmada Blue `#0c3f6e`, Terracotta `#e05a2b`, Heritage Gold `#d4af37`)
- **Hosting**: Netlify with strict HTTP Content-Security-Policy (CSP), security headers, and asset caching configured in [`netlify.toml`](file:///Users/umeshahirwar/AntiGravity%20/Jabalpuriya/netlify.toml).
- **SEO & GEO Optimization**:
  - Full OpenGraph & Twitter Card metadata in [`src/layouts/Layout.astro`](file:///Users/umeshahirwar/AntiGravity%20/Jabalpuriya/src/layouts/Layout.astro).
  - Schema.org JSON-LD structured data (`WebSite`, `NewsMediaOrganization`, `NewsArticle`).
  - Local GEO tags for Jabalpur (`IN-MP`, coordinates `23.1815, 79.9864`).
- **News Aggregation Engine**:
  - Standalone script [`scripts/fetch-news.mjs`](file:///Users/umeshahirwar/AntiGravity%20/Jabalpuriya/scripts/fetch-news.mjs) fetching Google News RSS & MP local wire streams.
  - Brand safety blacklist, spam word filter, and Levenshtein/Dice title deduplication.
  - Data output stored in [`src/data/news.json`](file:///Users/umeshahirwar/AntiGravity%20/Jabalpuriya/src/data/news.json).
- **Automation**:
  - [`.github/workflows/fetch-and-deploy.yml`](file:///Users/umeshahirwar/AntiGravity%20/Jabalpuriya/.github/workflows/fetch-and-deploy.yml) runs every 3 hours via GitHub Actions cron to refresh stories and trigger Netlify builds.

---

## 📁 Directory Structure

```
Jabalpuriya/
├── .github/
│   └── workflows/
│       └── fetch-and-deploy.yml    # 3-hourly cron news aggregation pipeline
├── public/
│   ├── favicon.svg                 # Jabalpur themed SVG icon
│   ├── robots.txt                  # Search & AI crawler directives
│   └── sitemap.xml                 # XML sitemap for SEO
├── scripts/
│   └── fetch-news.mjs              # RSS aggregator, brand safety & deduplication
├── src/
│   ├── components/
│   │   ├── CommunitySpotlight.astro # Jabalpur heritage & tourism cards
│   │   ├── Footer.astro            # Links, city helplines, newsletter
│   │   ├── Header.astro            # Responsive navigation & breaking ticker
│   │   ├── NewsCard.astro          # Zero-CLS responsive news card component
│   │   └── WeatherWidget.astro     # Jabalpur weather & air quality metrics
│   ├── data/
│   │   └── news.json               # Structured Jabalpur news database
│   ├── layouts/
│   │   └── Layout.astro            # Master layout with Schema.org & GEO tags
│   ├── pages/
│   │   └── index.astro             # Homepage hero, category filter & news feed
│   └── styles/
│       └── global.css              # Global styling & Tailwind directives
├── astro.config.mjs                # Astro configuration
├── netlify.toml                    # Netlify security headers & build config
├── package.json                    # Scripts and dependencies
└── tailwind.config.mjs             # Tailwind theme extensions
```

---

## 🚀 Quick Start Guide

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Local Development Server
```bash
npm run dev
```
Visit `http://localhost:4321` in your browser.

### 3. Fetch Fresh Jabalpur News Stories
```bash
npm run fetch-news
```

### 4. Build Static Site for Production
```bash
npm run build
```
Output will be generated in the `/dist` directory.

---

## 🔒 Security & Brand Safety

1. **Strict Content-Security-Policy (CSP)**: Defined in `netlify.toml` protecting users against XSS and clickjacking.
2. **Zero Hardcoded Secrets**: All automation uses standard GitHub Actions environment secrets (`NETLIFY_BUILD_HOOK`, `GITHUB_TOKEN`).
3. **Curated Domain Filter**: Unverified or spam domain sources are automatically discarded in the aggregation pipeline.
