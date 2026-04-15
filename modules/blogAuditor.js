/**
 * blogAuditor.js - 2026 SEO Audit Engine via OpenRouter
 */
const { callAI } = require('./aiClient');
const { getAllPosts, wpPatch } = require('./wpPublisher');
const { log, appendToLog } = require('./logger');

const BANNED_PHRASES = [
  'moreover','furthermore','additionally','in conclusion','to summarize','in summary',
  'unlock','harness','leverage','revolutionize','game-changer','dive into','delve into',
  'seamless','cutting-edge','empower','holistic','synergy','navigate the complexities',
];

function stripHtml(html) {
  return (html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function auditPost(post) {
  const html = post.content && post.content.rendered ? post.content.rendered : '';
  const text = stripHtml(html);
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const issues = [];
  let score = 0;

  if (wordCount >= 2000) score += 10;
  else if (wordCount >= 1200) { score += 6; issues.push('Word count ' + wordCount + ' (target 2000+)'); }
  else if (wordCount >= 800) { score += 3; issues.push('Low word count: ' + wordCount); }
  else issues.push('Very low word count: ' + wordCount);

  const h2s = (html.match(/<h2[^>]*>(.*?)<\/h2>/gi) || []).map(t => stripHtml(t).toLowerCase());
  const titleText = stripHtml(post.title && post.title.rendered ? post.title.rendered : '').toLowerCase();
  if (titleText.length > 3 && h2s.length >= 3) score += 10;
  else if (titleText.length > 3) { score += 6; issues.push('Only ' + h2s.length + ' H2 headings'); }
  else issues.push('Keyword structure unclear');

  const metaDesc = post.yoast_head_json && post.yoast_head_json.description ? post.yoast_head_json.description : '';
  if (metaDesc.length >= 140 && metaDesc.length <= 160) score += 10;
  else if (metaDesc.length > 60) { score += 5; issues.push('Meta desc ' + metaDesc.length + ' chars'); }
  else issues.push('Missing or short meta description');

  const citeRe = /according to|published by|reported by|study by|research from|data from/gi;
  const cites = (text.match(citeRe) || []).length;
  if (cites >= 5) score += 10;
  else if (cites >= 3) { score += 6; issues.push('Only ' + cites + ' citations'); }
  else if (cites >= 1) { score += 3; issues.push('Only ' + cites + ' citation(s)'); }
  else issues.push('No named external citations');

  const hasFaq = /faq|frequently asked/i.test(html) || (html.match(/<h3[^>]*>[^<]*\?[^<]*<\/h3>/gi) || []).length >= 3;
  if (hasFaq) score += 10;
  else issues.push('Missing FAQ section');

  const imgs = html.match(/<img[^>]+>/gi) || [];
  const missingAlt = imgs.filter(t => !(/alt=["'][^"']+["']/.test(t))).length;
  if (imgs.length === 0) { score += 5; issues.push('No images found'); }
  else if (missingAlt === 0) score += 10;
  else { score += Math.max(0, 10 - missingAlt * 2); issues.push(missingAlt + '/' + imgs.length + ' images missing alt'); }

  const intLinkRe = new RegExp('href="https?:\/\/homesandluxury\.com[^"]*"', 'gi');
  const intLinks = (html.match(intLinkRe) || []).length;
  if (intLinks >= 2 && intLinks <= 3) score += 10;
  else if (intLinks === 1) { score += 5; issues.push('Only 1 internal link'); }
  else if (intLinks > 3) { score += 7; issues.push(intLinks + ' internal links (max 3)'); }
  else issues.push('No internal links');

  const foundBanned = BANNED_PHRASES.filter(p => text.toLowerCase().includes(p));
  if (foundBanned.length === 0) score += 10;
  else if (foundBanned.length <= 2) { score += 6; issues.push('Banned phrases: ' + foundBanned.join(', ')); }
  else { score += 2; issues.push('Multiple banned phrases: ' + foundBanned.slice(0,4).join(', ')); }

  const h2Count = (html.match(/<h2/gi) || []).length;
  const h3Count = (html.match(/<h3/gi) || []).length;
  if (h2Count >= 5 && h3Count >= 5) score += 10;
  else if (h2Count >= 3 && h3Count >= 3) { score += 7; issues.push(h2Count + ' H2s, ' + h3Count + ' H3s'); }
  else if (h2Count >= 2) { score += 4; issues.push('Shallow headings'); }
  else issues.push('Poor heading structure');

  const hasAuthor = /editorial team|by .{5,50},|author/i.test(html);
  if (hasAuthor) score += 10;
  else { score += 4; issues.push('Missing author byline'); }

  return { score, wordCount, issues, metaDesc, imgCount: imgs.length, missingAlt, h2Count, h3Count };
}

async function applyLightFixes(post, issues) {
  const updates = {};
  const title = post.title && post.title.rendered ? post.title.rendered.replace(/<[^>]*>/g, '') : '';
  if (issues.some(i => /missing|short meta/i.test(i))) {
    try {
      const p = 'Write a compelling meta description (140-160 characters, includes topic keyword) for a home decor blog post titled: "' + title + '". Return only the meta description text.';
      const desc = await callAI(p, { temperature: 0.7, maxTokens: 200 });
      updates['_yoast_wpseo_metadesc'] = desc.slice(0, 160);
      updates['rank_math_description'] = desc.slice(0, 160);
      log('    Auto-generated meta desc for: ' + title.slice(0,40));
    } catch (e) { log('    Warning: meta desc failed: ' + e.message); }
  }
  if (Object.keys(updates).length > 0) {
    try { await wpPatch('posts', post.id, { meta: updates }); log('    Fixed post ID ' + post.id); }
    catch (e) { log('    Warning: could not fix post ' + post.id + ': ' + e.message); }
  }
}

async function runFullAudit() {
  log('[TASK 2] FULL BLOG AUDIT');
  const posts = await getAllPosts();
  const results = { good: [], updateNeeded: [], rewriteNeeded: [] };
  const lines = ['='.repeat(60), new Date().toISOString() + ' AUDIT (' + posts.length + ' posts)', '='.repeat(60)];

  for (const post of posts) {
    const title = post.title && post.title.rendered ? post.title.rendered.replace(/<[^>]*>/g, '') : '(no title)';
    const audit = auditPost(post);
    const { score, wordCount, issues, imgCount, missingAlt } = audit;
    let bucket;
    if (score >= 85) { bucket = 'GOOD'; results.good.push(post); }
    else if (score >= 60) { bucket = 'UPDATE NEEDED'; results.updateNeeded.push({ post, score, issues }); }
    else { bucket = 'REWRITE NEEDED'; results.rewriteNeeded.push({ post, score, issues }); }
    const icon = score >= 85 ? 'OK' : score >= 60 ? 'WARN' : 'FAIL';
    log('  [' + icon + '] [' + score + '/100] ' + bucket + ' "' + title.slice(0,50) + '"');
    issues.forEach(function(i) { log('    -> ' + i); });
    lines.push('[' + score + '/100] ' + bucket + ' | ' + title + ' | Words: ' + wordCount);
  }

  if (results.updateNeeded.length > 0) {
    log('  Applying fixes to ' + results.updateNeeded.length + ' post(s)...');
    for (var i = 0; i < results.updateNeeded.length; i++) {
      await applyLightFixes(results.updateNeeded[i].post, results.updateNeeded[i].issues);
    }
  }

  lines.push('SUMMARY: ' + results.good.length + ' GOOD | ' + results.updateNeeded.length + ' UPDATED | ' + results.rewriteNeeded.length + ' NEED REWRITE');
  await appendToLog('seo_audit_log.txt', lines.join('\n'));
  log('  AUDIT COMPLETE: ' + results.good.length + ' good, ' + results.updateNeeded.length + ' updated, ' + results.rewriteNeeded.length + ' need rewrite');
  return results;
}

module.exports = { auditPost, runFullAudit };
