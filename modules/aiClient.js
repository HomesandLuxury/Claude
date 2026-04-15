/**
 * aiClient.js - OpenRouter API wrapper (free Gemma 4 31B)
 */
const axios = require('axios');

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function callAI(prompt, opts, _retries) {
  opts     = opts || {};
  _retries = _retries || 0;

  const temperature = opts.temperature !== undefined ? opts.temperature : 0.88;
  const maxTokens   = opts.maxTokens || 8192;
  const key         = process.env.OPENROUTER_API_KEY;
  const model       = process.env.OPENROUTER_MODEL || 'google/gemma-4-31b-it:free';

  let res;
  try {
    res = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model,
      messages   : [{ role: 'user', content: prompt }],
      temperature,
      max_tokens : maxTokens
    }, {
      headers: {
        'Authorization': 'Bearer ' + key,
        'Content-Type' : 'application/json',
        'HTTP-Referer' : 'https://homesandluxury.com',
        'X-Title'      : 'HomesAndLuxury Blog Automation'
      },
      timeout: 120000
    });
  } catch (err) {
    const status = err.response && err.response.status;
    if ((status === 429 || status === 503) && _retries < 4) {
      const wait = ((_retries + 1) * 15000);
      console.log('  Rate limited — waiting ' + (wait / 1000) + 's before retry ' + (_retries + 1) + '/4...');
      await sleep(wait);
      return callAI(prompt, opts, _retries + 1);
    }
    throw err;
  }

  let raw = '';
  if (res.data.choices && res.data.choices[0] && res.data.choices[0].message) {
    raw = res.data.choices[0].message.content || '';
  }

  // Strip markdown code fences
  raw = raw.trim();
  if (raw.startsWith('```')) {
    raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }

  // Extract JSON if prefixed with thinking/reasoning text
  if (raw && raw[0] !== '{' && raw[0] !== '[') {
    const objMatch = raw.match(/\{[\s\S]*\}/);
    const arrMatch = raw.match(/\[[\s\S]*\]/);
    if (objMatch) raw = objMatch[0];
    else if (arrMatch) raw = arrMatch[0];
  }

  return raw;
}

module.exports = { callAI };
