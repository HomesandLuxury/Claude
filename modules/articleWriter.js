/**
 * articleWriter.js — 3000–3500 word article generation via Google Gemini (FREE)
 *
 * RULES IN EFFECT (per user preferences):
 *  - 2026 data only (2025 as fallback). Never cite data older than 2025.
 *  - ZERO em dashes (—) or en dashes (–) anywhere. Ever.
 *  - Humanized tone: contractions, rhetorical questions, varied rhythm
 *  - Product keywords: always include Pros and Cons section
 *  - Points and comparison tables throughout
 *  - Named sources only. No "studies show", "experts agree", "research indicates"
 */
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fetch = require('node-fetch');
const { log } = require('./logger');

// ─── BANNED PHRASES ───────────────────────────────────────────────────────────
const BANNED_WORDS = [
  'moreover','furthermore','additionally','in conclusion','to summarize','in summary',
  'landscape','realm','unlock','harness','leverage','revolutionize','transform',
  'game-changer','it is important to note','it is worth noting','when it comes to',
  'at the end of the day','in today\'s world','in the digital age',
  'dive into','delve into','navigate the complexities',
  'robust','seamless','cutting-edge','empower','elevate','holistic','synergy',
  // banned source phrases
  'studies show','experts agree','research indicates','it has been proven',
  'statistics show','according to industry data','industry experts say',
].join(', ');

function getModel() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
    generationConfig: {
      temperature     : 0.88,
      maxOutputTokens : 8192,
      responseMimeType: 'application/json',
    },
    systemInstruction: `You are a senior home decor content writer for HomesAndLuxury.com.
You write warm, expert, aspirational 3000 to 3500 word articles that read like they were written by a knowledgeable, personable human expert.

ABSOLUTE RULES:
1. NEVER use em dashes (—) or en dashes (–). Replace with a comma, a period, or restructure the sentence.
2. NEVER use these banned phrases: ${BANNED_WORDS}
3. DATA: Only cite 2026 data. If 2026 data is unavailable, use 2025 data only. Never cite data older than 2025. State the year in every citation.
4. NEVER use vague source phrases. Always name the specific organization, year, and report title.
5. Word count 3000 to 3500 is a firm requirement. Fully develop every section.
6. Return only valid JSON. No markdown fences around the JSON.`,
  });
}

// ─── DETECT PRODUCT KEYWORD ───────────────────────────────────────────────────
function isProductKeyword(keyword) {
  const productSignals = [
    'best','top','review','buy','shop','product','kit','lamp','mirror','shelf','shelves',
    'stand','table','chair','sofa','ottoman','rug','curtain','planter','pot','gate','fence',
    'coop','cabinet','light','floor lamp','chandelier','candle','statue','figurine','print',
    'poster','frame','sign','organizer','storage','bench','desk','nightstand','dresser',
  ];
  const kw = keyword.toLowerCase();
  return productSignals.some(s => kw.includes(s));
}

// ─── FETCH CROSS-SITE LINKS ───────────────────────────────────────────────────
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

// ─── MAIN GENERATOR ───────────────────────────────────────────────────────────
async function generateArticle(keyword, title, category, existingPosts = []) {
  log(`  Calling Gemini — generating 3000 to 3500 word article...`);

  const today      = new Date().toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });
  const crossLinks = await fetchCrossSiteLinks();
  const AMAZON_TAG = process.env.AMAZON_TAG || 'homesandlux01-20';
  const isProduct  = isProductKeyword(keyword);

  const intCtx   = existingPosts.slice(0, 6).map(p => `- "${p.title}": ${p.url}`).join('\n') || '(No existing posts yet)';
  const crossCtx = crossLinks ? crossLinks.slice(0, 500) : '(Unavailable)';

  const productSection = isProduct ? `

[PRODUCT KEYWORD DETECTED — REQUIRED EXTRA SECTION]
Because this keyword relates to a product or product category, you MUST include a dedicated H2 section titled exactly:
<h2>Pros and Cons of [Product/Category Name]</h2>
Inside this section, include:
- An introductory paragraph (2 to 3 sentences) explaining what this comparison is based on
- A clear HTML table with two columns: Pros and Cons
  <table><thead><tr><th>Pros</th><th>Cons</th></tr></thead><tbody>...</tbody></table>
  Minimum 4 pros and 4 cons. Each point must be specific and honest. Cons must be genuine limitations, not vague.
- A brief closing paragraph with a recommendation on who this is best for
Place this section as the third or fourth H2 in the article.` : '';

  const prompt = `Write a complete, 3000 to 3500 word blog post. Every section must be fully written. No truncation. No summaries. No placeholders.

ARTICLE DETAILS:
Title: "${title}"
Primary Keyword: "${keyword}"
Category: ${category}
Amazon Tag: ${AMAZON_TAG}
Date: ${today}

INTERNAL LINKS from homesandluxury.com (use 2 to 3, never link to tools or calculators):
${intCtx}

CROSS-SITE LINKS from techsavvysolutions.org (add 1 if topically relevant):
${crossCtx}
${productSection}

━━━ HUMANIZATION RULES (critical) ━━━
These rules make the article feel written by a real person, not a machine:
- Use contractions naturally throughout: it's, you'll, that's, doesn't, you're, they're, isn't, can't
- Address the reader as "you" in practical sections
- Vary paragraph length: most are 2 to 3 sentences, but occasionally use a single punchy sentence for emphasis
- Ask rhetorical questions mid-section to draw the reader in
- Never write two sentences of the same length back to back
- Use specific names, real numbers, and vivid scenarios
- Include an occasional phrase a knowledgeable friend would use
- Avoid perfectly parallel bullet point phrasing (vary the sentence structure within lists)
- Mix short sentences (5 to 10 words) with medium sentences (15 to 25 words) throughout
- Reading level: 8th to 10th grade. Authoritative but never stiff.

━━━ DATA AND CITATION RULES ━━━
- Only cite 2026 data as your primary source. If 2026 data is unavailable, use 2025 data only.
- Never cite data older than 2025.
- Every statistic needs: "According to [Organization Name]'s [Year] [Report Title], [specific data point]."
- Minimum 8 named citations throughout the article.
- Tier 1 sources preferred: .gov agencies, academic institutions, peer-reviewed journals, named experts with credentials
- Tier 2 acceptable: reputable industry associations, named journalists at major publications

━━━ REQUIRED STRUCTURE ━━━

[1] AUTHOR BYLINE:
<p class="author-byline"><strong>By The Homes and Luxury Editorial Team</strong>, Home Decor and Interior Design Specialists<br>Published: ${today} | Last Updated: ${today}</p>

[2] AFFILIATE DISCLOSURE:
<p class="affiliate-disclosure"><em>This article contains affiliate links. If you purchase through these links, we may earn a small commission at no extra cost to you.</em></p>

[3] INTRODUCTION (100 to 150 words):
- Open with a specific relatable scenario OR a cited 2025 or 2026 statistic
- Primary keyword appears in the first 50 words
- Second or third sentence gives a direct, complete answer to the title (AEO optimization)
- One credibility signal from a named source
- Promise the reader what they will specifically gain from this article
- Use a contraction in the opening paragraph

[4] TABLE OF CONTENTS (HTML nav element):
- 6 to 10 H2 headings listed
- 40 to 50 percent of headings phrased as questions
- Include long-tail keyword variations in at least 3 headings

[5] MAIN CONTENT: 5 to 6 H2 sections (each 250 to 400 words, with 2 to 3 H3 subsections):

Formula for every H2:
a) First sentence directly and completely answers the heading. This sentence must stand alone as a featured snippet answer.
b) 2 to 3 paragraphs with named citations (2025 or 2026 data only)
c) 1 to 2 paragraphs of practical application with specific numbers and real scenarios
d) Optional: a second voice: "Interior designers often note that [specific observation]. According to [Named Source's 2025/2026 Report], [specific data]."

Additional content requirements across the full article:
- At least 2 HTML comparison tables (not just bullet lists)
- [IMAGE_PLACEHOLDER_1], [IMAGE_PLACEHOLDER_2], [IMAGE_PLACEHOLDER_3] placed naturally between sections
- Amazon affiliate links where products naturally mentioned (max 5 total, never in intro or conclusion):
  <a href="https://www.amazon.com/s?k=PRODUCT+SEARCH+TERM&tag=${AMAZON_TAG}" target="_blank" rel="nofollow sponsored">descriptive link text</a>
- 2 to 3 internal links to homesandluxury.com posts listed above, with descriptive natural anchor text
- 1 cross-site link to techsavvysolutions.org if a page there is genuinely topically relevant${isProduct ? '\n- Include the Pros and Cons section described above as the 3rd or 4th H2' : ''}

[6] CONCLUSION (200 to 250 words):
- Paragraph 1 (3 to 4 sentences): Reference back to the opening scenario or statistic. Summarize the key insight with a fresh angle. Include the primary keyword. Prove the article delivered what it promised.
- Paragraph 2 (3 to 4 sentences): Give a clear, actionable roadmap. Specific next steps the reader can take today.
- Paragraph 3 (2 to 3 sentences): Close with genuine warmth. Use one of these CTAs only:
  "Have questions about your specific [topic]? Share them in the comments below."
  OR "Bookmark this guide for future reference."
  OR "Know someone redesigning their home? Share this resource with them."
  NEVER use: "Contact us today", "Download our free guide", "Click here to learn more"

[7] FAQ SECTION (7 to 10 questions as H3 tags):
- Questions phrased exactly as someone would speak them aloud (voice search)
- Use question words: What, How, Why, When, Where, Which, Who
- Each answer: 60 to 100 words total
- First sentence = direct complete answer (extractable as featured snippet)
- Include one named 2025 or 2026 citation per answer
- Primary keyword appears naturally in 2 to 3 answers

[8] AUTHOR BIO:
<h2>About the Author</h2>
<p>The Homes and Luxury Editorial Team brings together home decor specialists, interior design consultants, and lifestyle writers with over a decade of combined expertise. Our team has published hundreds of guides covering luxury home styling, decor trends, and product recommendations across North America and Europe.</p>

[9] SOURCES:
<h2>Sources</h2>
<ol>[number every citation used, with organization, year, title]</ol>

━━━ HTML FORMAT ━━━
Use only these HTML tags: h2, h3, p, ul, ol, li, table, thead, tbody, tr, th, td, strong, em, a, figure, figcaption, nav
No markdown. No inline styles. No em dashes (—) anywhere. Ready to paste directly into WordPress.

━━━ RETURN THIS JSON ONLY ━━━
{
  "seo_title": "(50 to 65 chars, keyword in first 4 words, no em dashes)",
  "meta_description": "(140 to 160 chars, compelling, includes keyword)",
  "focus_keyword": "${keyword}",
  "slug": "url-friendly-slug",
  "tags": ["tag1","tag2","tag3","tag4","tag5","tag6","tag7","tag8","tag9","tag10"],
  "word_count_estimate": 3200,
  "is_product_post": ${isProduct},
  "html_content": "...(full HTML article, 3000 to 3500 words)...",
  "faq_schema": {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {"@type":"Question","name":"Question text?","acceptedAnswer":{"@type":"Answer","text":"Answer text."}}
    ]
  }
}`;

  const result = await getModel().generateContent(prompt);
  const raw    = result.response.text().trim()
    .replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

  let parsed;
  try { parsed = JSON.parse(raw); }
  catch {
    const m = raw.match(/\{[\s\S]*\}/);
    if (!m) throw new Error('Gemini returned invalid JSON for article');
    parsed = JSON.parse(m[0]);
  }

  // Post-process: strip any em/en dashes that slipped through
  if (parsed.html_content) {
    parsed.html_content = parsed.html_content
      .replace(/\u2014/g, ',')   // em dash → comma
      .replace(/\u2013/g, ' to ') // en dash → "to"
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
