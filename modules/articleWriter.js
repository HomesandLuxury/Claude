/**
 * articleWriter.js — 3000-3500 word article via OpenRouter (Gemini 3.1 Pro)
 */
const { callAI } = require('./aiClient');
const fetch = require('node-fetch');
const { log } = require('./logger');

const BANNED_WORDS = [
  'moreover','furthermore','additionally','in conclusion','to summarize','in summary',
  'landscape','realm','unlock','harness','leverage','revolutionize','transform',
  'game-changer','it is important to note','it is worth noting','when it comes to',
  'at the end of the day','in today\'s world','in the digital age',
  'dive into','delve into','navigate the complexities',
  'robust','seamless','cutting-edge','empower','elevate','holistic','synergy',
  'studies show','experts agree','research indicates','it has been proven',
  'statistics show','according to industry data','industry experts say',
].join(', ');

function isProductKeyword(keyword) {
  const productSignals = [
    'best','top','review','buy','shop','product','kit','lamp','mirror','shelf','shelves',
    'stand','table','chair','sofa','ottoman','rug','curtain','planter','pot','gate','fence',
    'coop','cabinet','light','floor lamp','chandelier','candle','statue','figurine','print',
    'poster','frame','sign','organizer','storage','bench','desk','nightstand','dresser',
  ];
  return productSignals.some(s => keyword.toLowerCase().includes(s));
}

async function fetchCrossSiteLinks() {
  try {
    const res = await fetch('https://techsavvysolutions.org/sitemap_index.xml', { timeout: 6000 });
    if (!res.ok) return null;
    const xml  = await res.text();
    const subs = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);
    for (const url of subs) {
      if (url.includes('post')) {
        const r2    = await fetch(url, { timeout: 6000 });
        if (!r2.ok) continue;
        const xml2  = await r2.text();
        const pages = [...xml2.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);
        return pages.slice(0, 12).join('\n');
      }
    }
  } catch {}
  return null;
}

async function generateArticle(keyword, title, category, existingPosts = []) {
  log(`  Calling Gemini 3.1 Pro via OpenRouter...`);

  const today      = new Date().toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });
  const crossLinks = await fetchCrossSiteLinks();
  const AMAZON_TAG = process.env.AMAZON_TAG || 'homesandlux01-20';
  const isProduct  = isProductKeyword(keyword);
  const intCtx     = existingPosts.slice(0, 6).map(p => `- "${p.title}": ${p.url}`).join('\n') || '(No existing posts yet)';
  const crossCtx   = crossLinks ? crossLinks.slice(0, 500) : '(Unavailable)';

  const productSection = isProduct ? `
[PRODUCT KEYWORD DETECTED]
Include a dedicated H2: <h2>Pros and Cons of [Product Name]</h2>
With an HTML table (min 4 pros, 4 cons) and a closing recommendation paragraph. Place it as the 3rd or 4th H2.` : '';

  const prompt = `You are a senior home decor content writer for HomesAndLuxury.com.
Write warm, expert, aspirational articles that read like a knowledgeable human expert, not an AI.

ABSOLUTE RULES:
1. NEVER use em dashes or en dashes. Replace with comma, period, or restructure sentence.
2. NEVER use these banned phrases: ${BANNED_WORDS}
3. Only cite 2026 data (2025 as fallback). Never cite data older than 2025.
4. Always name the specific organization, year, and report title for every statistic.
5. Word count 3000 to 3500 is a firm requirement.
6. Return only valid JSON. No markdown fences.

ARTICLE DETAILS:
Title: "${title}"
Primary Keyword: "${keyword}"
Category: ${category}
Amazon Tag: ${AMAZON_TAG}
Date: ${today}

INTERNAL LINKS (use 2 to 3):
${intCtx}

CROSS-SITE LINKS (use 1 if relevant):
${crossCtx}
${productSection}

HUMANIZATION RULES:
- Use contractions: it's, you'll, that's, doesn't, you're
- Address reader as "you"
- Vary sentence length: short punchy sentences mixed with longer ones
- Ask rhetorical questions mid-section
- Reading level: 8th to 10th grade

REQUIRED STRUCTURE:
[1] Author byline: <p class="author-byline"><strong>By The Homes and Luxury Editorial Team</strong>, Home Decor and Interior Design Specialists<br>Published: ${today}</p>
[2] Affiliate disclosure paragraph
[3] Introduction (100-150 words): keyword in first 50 words, direct answer in second sentence, one named source
[4] Table of contents (nav element, 6-10 H2s, 40% as questions)
[5] 5-6 H2 sections (250-400 words each, 2-3 H3 subsections each):
    - First sentence = direct complete answer to heading
    - Named citations with year
    - At least 2 HTML comparison tables across article
    - [IMAGE_PLACEHOLDER_1], [IMAGE_PLACEHOLDER_2], [IMAGE_PLACEHOLDER_3] between sections
    - Amazon affiliate links max 5: <a href="https://www.amazon.com/s?k=TERM&tag=${AMAZON_TAG}" target="_blank" rel="nofollow sponsored">text</a>
    - 2-3 internal links to homesandluxury.com posts above
[6] Conclusion (200-250 words): reference opening, key insight, actionable steps, warm CTA
[7] FAQ section (7-10 H3 questions, each answer 60-100 words, first sentence = direct answer)
[8] Author bio: <h2>About the Author</h2><p>The Homes and Luxury Editorial Team...</p>
[9] Sources: <h2>Sources</h2><ol>numbered citations</ol>

HTML ONLY: h2, h3, p, ul, ol, li, table, thead, tbody, tr, th, td, strong, em, a, figure, nav
No markdown. No inline styles. No em dashes anywhere.

RETURN THIS JSON ONLY:
{
  "seo_title": "50-65 chars, keyword in first 4 words",
  "meta_description": "140-160 chars, compelling, includes keyword",
  "focus_keyword": "${keyword}",
  "slug": "url-friendly-slug",
  "tags": ["tag1","tag2","tag3","tag4","tag5","tag6","tag7","tag8","tag9","tag10"],
  "word_count_estimate": 3200,
  "is_product_post": ${isProduct},
  "html_content": "full HTML article 3000-3500 words",
  "faq_schema": {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [{"@type":"Question","name":"?","acceptedAnswer":{"@type":"Answer","text":"."}}]
  }
}`;

  const raw = await callAI(prompt, { temperature: 0.88, maxTokens: 8192 });

  let parsed;
  try { parsed = JSON.parse(raw); }
  catch {
    const m = raw.match(/\{[\s\S]*\}/);
    if (!m) throw new Error('AI returned invalid JSON for article');
    parsed = JSON.parse(m[0]);
  }

  if (parsed.html_content) {
    parsed.html_content = parsed.html_content
      .replace(/\u2014/g, ',')
      .replace(/\u2013/g, ' to ')
      .replace(/---/g, ',')
      .replace(/--/g, ',');
  }
  if (parsed.seo_title) {
    parsed.seo_title = parsed.seo_title.replace(/\u2014|\u2013|--|---/g, '');
  }

  log(`  Article ready: ~${parsed.word_count_estimate || '?'} words${isProduct ? ' [PRODUCT: Pros & Cons included]' : ''}`);
  return parsed;
}

module.exports = { generateArticle };
