/**
 * aiClient.js - OpenRouter API wrapper
 */
const axios = require('axios');

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function cleanJson(raw) {
  // Strip markdown fences
  raw = raw.trim();
  if (raw.startsWith('```')) {
    raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }

  // Extract JSON object if prefixed with reasoning/thinking text
  if (raw && raw[0] !== '{' && raw[0] !== '[') {
    const objMatch = raw.match(/\{[\s\S]*\}/);
    const arrMatch = raw.match(/\[[\s\S]*\]/);
    if (objMatch) raw = objMatch[0];
    else if (arrMatch) raw = arrMatch[0];
  }

  // Fix bad escaped characters that break JSON.parse
  // Only fix escapes inside JSON string values
  raw = raw
    .replace(/\\'/g, "'")           // \' is not valid JSON escape
    .replace(/\\"/g, '\\"')         // keep valid
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '') // strip control chars
    .replace(/\t/g, '\\t')          // tabs inside strings
    .replace(/\r/g, '\\r');         // carriage returns

  // Try parsing; if it still fails, do aggressive cleanup
  try {
    JSON.parse(raw);
    return raw;
  } catch (e) {
    // Find the html_content value and sanitize it
    raw = raw.replace(/"html_content"\s*:\s*"([\s\S]*?)(?=",\s*"faq_schema"|"\s*\})/g, function(match, html) {
      const safe = html
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t');
      return '"html_content":"' + safe;
    });
    return raw;
  }
}

async function callAI(prompt, opts, _retries) {
  opts     = opts || {};
  _retries = _retries || 0;

  const temperature = opts.temperature !== undefined ? opts.temperature : 0.88;
  const maxTokens   = opts.maxTokens || 8192;
  const key         = process.env.OPENROUTER_API_KEY;
  const model       = process.env.OPENROUTER_MODEL || 'openai/gpt-oss-120b:free';

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
      const wait = (_retries + 1) * 15000;
      console.log('  Rate limited — waiting ' + (wait / 1000) + 's then retrying...');
      await sleep(wait);
      return callAI(prompt, opts, _retries + 1);
    }
    throw err;
  }

  let raw = '';
  if (res.data.choices && res.data.choices[0] && res.data.choices[0].message) {
    raw = res.data.choices[0].message.content || '';
  }

  return cleanJson(raw);
}

module.exports = { callAI };
