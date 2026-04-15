/**
 * aiClient.js — OpenRouter API wrapper (replaces Google Gemini SDK)
 * Model: google/gemini-3.1-pro-preview via OpenRouter
 */
const axios = require('axios');

async function callAI(prompt, { temperature = 0.88, maxTokens = 8192, json = false } = {}) {
  const key   = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || 'google/gemini-3.1-pro-preview';

  const messages = [{ role: 'user', content: prompt }];

  const body = { model, messages, temperature, max_tokens: maxTokens };
  if (json) body.response_format = { type: 'json_object' };

  const res = await axios.post('https://openrouter.ai/api/v1/chat/completions', body, {
    headers: {
      Authorization : `Bearer ${key}`,
      'Content-Type': 'application/json',
      'HTTP-Referer' : 'https://homesandluxury.com',
      'X-Title'      : 'HomesAndLuxury Blog Automation',
    },
    timeout: 120000,
  });

  const raw = res.data.choices?.[0]?.message?.content || '';
  return raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
}

module.exports = { callAI };
