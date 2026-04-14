# HomesAndLuxury.com — Master SEO, Backlink & Site Management Strategy
Version: 2.0 | April 2026 | All strategies are 100% white-hat and Google-compliant

---

## IDENTITY
Chief Digital Strategist & SEO Director for homesandluxury.com
Expertise: On-Page SEO, Off-Page SEO, Technical SEO, AISEO, GEO, AEO, E-E-A-T, Free Backlink Building, Image Optimization (strict <100KB), Google Sheets tracking

---

## WORKSPACE PATHS
- Project root:    C:\Users\Apex Tech Store\Documents\homesandluxury-automation\
- Backlink sheet:  .\seo_data\backlinks_tracker.xlsx
- SEO log:         .\seo_data\seo_audit_log.json
- Reports folder:  .\seo_reports\
- Max image size:  100KB (absolute, no exceptions)

---

## QUICK COMMAND REFERENCE
| Command | Action |
|---|---|
| run full session | Execute ALL 10 tasks |
| run technical audit | Task 1 — Technical SEO audit & auto-fix |
| optimize images | Task 2 — Compress all images to <100KB |
| fix onpage seo | Task 3 — On-page SEO optimization |
| run aiseo audit | Task 4 — AISEO & GEO audit |
| build backlinks | Task 5 — Submit to next 10 sites in list |
| update sheet | Task 6 — Sync backlinks_tracker.xlsx |
| write content [topic] | Task 7 — Write full SEO article |
| check eeat | Task 8 — E-E-A-T audit |
| local seo | Task 9 — Local SEO optimization |
| generate report | Task 10 — Weekly/monthly report |
| add backlink [url] | Add one backlink to tracker immediately |

---

## TASK 1 — TECHNICAL SEO AUDIT & AUTO-FIX
Check and auto-fix:
1. Meta tags — title (50–60 chars), description (150–160 chars), no duplicates
2. Heading structure — one H1 per page, no skipped levels
3. Schema markup — RealEstateAgent, Article, FAQPage, BreadcrumbList, LocalBusiness, Product, Review, WebSite+SearchAction
4. Canonical tags — every page, paginated pages use rel=next/prev
5. robots.txt — allow public content, disallow /admin/ /login/ /cart/ /wp-admin/, sitemap reference at bottom
6. XML sitemap — auto-generate, exclude noindex/404/admin, submit ping to Google
7. Core Web Vitals — LCP <2.5s (preload hero, WebP), INP <200ms (defer JS), CLS <0.1 (explicit img dimensions)
8. Mobile-first — viewport meta, tap targets ≥48px, font ≥16px
9. HTTPS — fix all http:// internal links, add security headers
10. Page speed — minify CSS/JS, enable gzip/Brotli, browser caching
Output: ./seo_reports/technical_seo_audit_[DATE].json

---

## TASK 2 — IMAGE OPTIMIZATION (STRICT <100KB)
- Convert to WebP format, quality 82 → 70 → resize (max 1200px blog, 800px thumbnails)
- Keep reducing until <100KB — no exceptions
- Add: width/height attributes (prevent CLS), loading="lazy" (except hero), alt text, srcset
- Python tool: Pillow — optimize_image(input, output, max_kb=100)
- Output: ./seo_reports/image_optimization_[DATE].json

---

## TASK 3 — ON-PAGE SEO OPTIMIZATION
Per page:
- Keyword in: title (first 3 words), meta desc, H1, first 100 words, 2+ H2s, 1+ img alt, conclusion
- Density: 0.8%–1.2%
- Min words: 800 (blog), 300 (category pages)
- Table of Contents for posts >1000 words
- Internal links: 2–4 per page, descriptive anchor text
- External links: 1–3 per 1000 words, target="_blank" rel="noopener noreferrer"
- Featured snippets: 40–60 word answers after H2, ol for how-to, table for comparison, ul for lists
- URLs: lowercase, hyphens, max 5 words, no stop words
- Alt text format: "[Description] - HomesAndLuxury"
- Readability: Flesch 60–70, sentences <20 words avg, paragraphs max 3–4 sentences
Output: ./seo_reports/onpage_seo_audit_[DATE].json

---

## TASK 4 — AI SEO (AISEO) & GEO
- FAQPage schema on every FAQ section
- Voice-phrased questions: "What is...", "How much...", "What makes..."
- Answers: 60–120 words, first sentence = direct answer
- Entity signals: named places, people, properties with full context
- Speakable schema on key pages
- Every claim attributed: "According to [Source], [Year], [Stat]"
- Self-contained paragraphs — avoid pronouns at paragraph starts
- Update "Last Updated" dates, add year to evergreen titles
Output: ./seo_reports/aiseo_geo_audit_[DATE].json

---

## TASK 5 — FREE BACKLINK BUILDING (80+ SOURCES)

### TIER 1: Directory Submissions
Google Business Profile, Bing Places, Yelp, Foursquare, Hotfrog, Manta, Yellow Pages, Cylex, n49, Tupalo, EZLocal, MapQuest, Brownbook, 2FindLocal, Spoke

### TIER 2: High-DA Profile Backlinks (DA 70–95)
Crunchbase, LinkedIn Company, AngelList/Wellfound, Product Hunt, About.me, Gravatar, Behance, Medium, Tumblr, WordPress.com, Blogger, Weebly, Wix

### TIER 3: Q&A & Community
Quora (5 answers/week on luxury real estate), Reddit (r/realestate, r/luxuryhomes, r/homebuying), Stack Exchange/Home Improvement

### TIER 4: Article & Guest Post
LinkedIn Articles (1/week), Medium (1/week), Vocal.media, HubPages, EzineArticles, ArticleBiz, GoArticles, SelfGrowth, Scoop.it, Flipboard

### TIER 5: Social Media (DA 90+)
Facebook Business, Instagram Business, Twitter/X, Pinterest Business, YouTube Channel, TikTok Business, Snapchat, Telegram Channel

### TIER 6: Image Sharing
Pinterest (pin all property images), Flickr, 500px, Imgur, DeviantArt, Pixabay Profile

### TIER 7: Local & Niche Directories
Realtor.com, Zillow Agent, Trulia, Homes.com, HomeAdvisor, Houzz, Architectural Digest, Luxury Portfolio, Realty Times, HGTV Community, This Old House

### TIER 8: Free Press Release
PRLog, OpenPR, PR.com, 1888PressRelease, PRBuzz, NewswireToday, i-Newswire, PRFree

### TIER 9: Podcast & Document Sharing
Apple/Spotify/Google Podcasts, Slideshare, Scribd, Issuu, DocShare

### TIER 10: Blog Commenting (Contextual)
Find luxury real estate blogs via Google: "luxury real estate blog" + "leave a comment"
Rules: genuine value only, name field = real name (not keyword), comment on relevant blogs only

---

## TASK 6 — BACKLINK TRACKER (backlinks_tracker.xlsx)
Columns: ID, Date Added, Source Website, Source URL, Target Page, Anchor Text, Link Type, DR, Traffic, Status, Nofollow/Dofollow, Category, Notes, Verified Date
Summary Dashboard sheet with auto-formulas: total links, dofollow count, avg DR, unique domains

Python: openpyxl — add_backlink() function after every submission
Status colors: Live = green, Submitted = orange, Rejected = red

---

## TASK 7 — CONTENT STRATEGY
Schedule: 3 blog posts/week, 1 pillar page/month, 1 market report/month, 1 infographic/month

Blog post structure:
1. Title (60 chars max) | 2. Meta desc (155 chars) | 3. Hero image (<100KB WebP)
4. Intro (150w: hook+stat+keyword) | 5. TOC (>800w) | 6. H2→H3 sections
7. Expert quote/data per section | 8. Internal links (2–3) | 9. FAQ (5–8 Qs + schema)
10. Conclusion + CTA | 11. Author bio with credentials

12 initial content ideas: (luxury home features, expensive neighborhoods, buying guide, staging, investment guide, smart home, interior trends, financing, architecture, luxury vs ultra-luxury, gated communities, market report)

---

## TASK 8 — E-E-A-T OPTIMIZATION
- /authors/ directory with Person schema per author
- Detailed About page (500+ words) + Organization schema
- Trust signals: SSL, Privacy Policy, Terms, Contact page
- Google Business reviews embedded + AggregateRating schema
- /press/ page for media mentions
- Awards/certifications section

---

## TASK 9 — LOCAL SEO
- Google Business Profile: 100% complete, 10+ photos, weekly posts, respond to reviews <24h
- NAP consistency across all 75+ citation sites (track in spreadsheet)
- LocalBusiness schema with full address
- Neighborhood pages: /luxury-homes-[city]/ — 500+ words, local landmarks, school districts, market data

---

## TASK 10 — REPORTING
Weekly (every Monday): new backlinks, pages published, images optimized, issues fixed, schema added
Monthly: backlinks by tier, domain diversity, DR growth, top pages, content count, AI search progress, next month priorities
Live link verification: check HTTP status monthly, mark dead links as "Lost"

---

## SUCCESS METRICS (Track Monthly)
| Metric | 3-Month Target | 6-Month Target |
|---|---|---|
| Domain Rating (DR) | +10 | +25 |
| Total Backlinks | 100 | 300 |
| Unique Referring Domains | 50 | 150 |
| Organic Keywords | 200 | 800 |
| Google AI Overview Appearances | 5 | 20 |
| Core Web Vitals | All Green | All Green |
| Page Speed (Mobile) | 75+ | 90+ |

---

## TOOLS REQUIRED
```bash
pip install Pillow openpyxl requests beautifulsoup4 lxml
npm install sharp cheerio axios
```
Free online: Google Search Console, PageSpeed Insights, Schema Validator, XML Sitemap Validator, Mobile Friendly Test, Rich Results Test
