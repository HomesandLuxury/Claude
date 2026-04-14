/**
 * titleGenerator.js — SEO title generation via Google Gemini (FREE)
 *
 * Rules enforced:
 *  - No em dashes, en dashes, or hyphens in titles
 *  - 8 to 15 words for voice search compatibility
 *  - 50 to 60 characters for SERP display
 *  - Keyword front-loaded in first 3 to 5 words
 *  - Question words for voice/AI optimization
 */
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { log } = require('./logger');

function getModel() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
    generationConfig: {
      temperature     : 0.82,
      maxOutputTokens : 1200,
      responseMimeType: 'application/json',
    },
  });
}

async function generateTitle(keyword, category) {
  log(`  Generating title options for: "${keyword}"`);

  const prompt = `You are a senior SEO strategist for HomesAndLuxury.com — a premium home decor and luxury lifestyle blog.

TARGET KEYWORD: "${keyword}"
CATEGORY: ${category}

Generate exactly 5 blog title options.

TITLE RULES (every title must follow ALL of these):
1. NO dashes, NO hyphens, NO em dashes, NO en dashes anywhere in any title
2. Fully humanized, natural conversational language only
3. 8 to 15 words for voice search compatibility
4. 50 to 60 characters for SERP display
5. Primary keyword in the first 3 to 5 words where natural
6. Include question words (What, How, Why, When, Where, Which) for voice and AI formats
7. No clickbait, no vague promises, signal clear answer-ability for AI Overviews
8. No banned phrases: unlock, revolutionize, game-changer, seamless, cutting-edge, holistic, synergy
9. Use power words where natural: Guide, Explained, Simple, Complete, Essential, Best, Ideas
10. Each title targets at least 2 of these: voice search, AI Overviews, Featured Snippets, Google Discover, LLM citation

For each title output:
1. Title text
2. Character count
3. Word count
4. Which optimization targets it hits

Then pick the single best option overall.

Return ONLY this JSON:
{
  "options": [
    {"title": "...", "chars": 55, "words": 9, "targets": ["voice","ai_overview","snippet"]},
    {"title": "...", "chars": 58, "words": 11, "targets": ["discover","llm","snippet"]},
    {"title": "...", "chars": 52, "words": 10, "targets": ["voice","numbers"]},
    {"title": "...", "chars": 60, "words": 12, "targets": ["comparison","snippet"]},
    {"title": "...", "chars": 57, "words": 9,  "targets": ["voice","ai_overview"]}
  ],
  "selected": "The single best title here"
}`;

  const result = await getModel().generateContent(prompt);
  const raw    = result.response.text().trim()
    .replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

  const data = JSON.parse(raw);

  // Safety: strip any dashes that slipped through
  data.selected = data.selected
    .replace(/\u2014/g, '')  // em dash
    .replace(/\u2013/g, '')  // en dash
    .replace(/\s{2,}/g, ' ')
    .trim();

  log(`  Selected: "${data.selected}" (${data.selected.length} chars)`);
  return data.selected;
}

module.exports = { generateTitle };
