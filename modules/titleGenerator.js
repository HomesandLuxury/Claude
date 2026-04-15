/**
 * titleGenerator.js — SEO title generation via OpenRouter (Gemini 3.1 Pro)
 */
const { callAI } = require('./aiClient');
const { log } = require('./logger');

async function generateTitle(keyword, category) {
  log(`  Generating title options for: "${keyword}"`);

  const prompt = `You are a senior SEO strategist for HomesAndLuxury.com.

TARGET KEYWORD: "${keyword}"
CATEGORY: ${category}

Generate exactly 5 blog title options then pick the best one.

TITLE RULES:
1. NO dashes, NO hyphens, NO em dashes, NO en dashes anywhere
2. Natural conversational language
3. 8 to 15 words
4. 50 to 60 characters
5. Primary keyword in first 3 to 5 words
6. Use question words (What, How, Why, When, Which) for voice search
7. No clickbait. No banned phrases: unlock, revolutionize, game-changer, seamless, cutting-edge

Return ONLY this JSON:
{
  "options": [
    {"title": "...", "chars": 55, "words": 9, "targets": ["voice","snippet"]},
    {"title": "...", "chars": 58, "words": 11, "targets": ["discover","llm"]},
    {"title": "...", "chars": 52, "words": 10, "targets": ["voice","numbers"]},
    {"title": "...", "chars": 60, "words": 12, "targets": ["comparison","snippet"]},
    {"title": "...", "chars": 57, "words": 9, "targets": ["voice","ai_overview"]}
  ],
  "selected": "The single best title here"
}`;

  const raw  = await callAI(prompt, { temperature: 0.82, maxTokens: 1200 });
  const data = JSON.parse(raw);

  data.selected = data.selected
    .replace(/\u2014/g, '')
    .replace(/\u2013/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  log(`  Selected: "${data.selected}" (${data.selected.length} chars)`);
  return data.selected;
}

module.exports = { generateTitle };
