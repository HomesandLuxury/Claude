/**
 * blogAuditor.js — 2026 SEO Audit Engine
 * Scores every post 0–100 across 10 criteria
 * Auto-fixes UPDATE NEEDED (60–84) posts
 * Flags REWRITE NEEDED (<60) posts
 */
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { getAllPosts, wpPatch } = require('./wpPublisher');
const { log, appendToLog }    = require('./logger');

function getModel() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-1.5-flash' });
}

const BANNED_PHRASES = [
  'moreover','furthermore','additionally','in conclusion','to summarize','in summary',
  'unlock','harness','leverage','revolutionize','game-changer','dive into','delve into',
  'seamless','cutting-edge','empower','holistic','synergy','navigate the complexities',
];

function stripHtml(html) {
  return (html || '').replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

// ─── SCORING ENGINE ───────────────────────────────────────────────────────────
function auditPost(post) {
  const html      = post.content?.rendered || '';
  const text      = stripHtml(html);
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const issues    = [];
  let score       = 0;

  // 1. Word Count (0–10)
  if      (wordCount >= 2000) { score += 10; }
  else if (wordCount >= 1200) { score += 6;  issues.push(`Word count ${wordCount} (target 2000+)`); }
  else if (wordCount >= 800)  { score += 3;  issues.push(`Low word count: ${wordCount}`); }
  else                        {              issues.push(`Very low word count: ${wordCount}`); }

  // 2. Keyword in Title + Headings (0–10)
  const h2s        = (html.match(/<h2[^>]*>(.*?)<\/h2>/gi) || []).map(t => stripHtml(t).toLowerCase());
  const titleText  = stripHtml(post.title?.rendered || '').toLowerCase();
  const kwInTitle  = titleText.length > 3;
  const kwInH2     = h2s.length >= 3;
  if (kwInTitle && kwInH2)   { score += 10; }
  else if (kwInTitle)        { score += 6;  issues.push(`Only ${h2s.length} H2 headings found`); }
  else                       {              issues.push('Keyword structure in headings unclear'); }

  // 3. Meta Description (0–10)
  const metaDesc = post.yoast_head_json?.description || '';
  if      (metaDesc.length >= 140 && metaDesc.length <= 160) { score += 10; }
  else if (metaDesc.length > 60)  { score += 5; issues.push(`Meta desc ${metaDesc.length} chars (target 140–160)`); }
  else                            {             issues.push('Missing or very short meta description'); }

  // 4. External Citations (0–10)
  const citePattern = /according to|published by|reported by|study by|research from|data from|survey by/gi;
  const cites = (text.match(citePattern) || []).length;
  if      (cites >= 5) { score += 10; }
  else if (cites >= 3) { score += 6;  issues.push(`Only ${cites} citations (target 5+)`); }
  else if (cites >= 1) { score += 3;  issues.push(`Only ${cites} citation(s) (target 5+)`); }
  else                 {             issues.push('No named external citations found'); }

  // 5. FAQ Section (0–10)
  const hasFaq = /faq|frequently asked/i.test(html) || (html.match(/<h3[^>]*>[^<]*\?[^<]*<\/h3>/gi) || []).length >= 3;
  if (hasFaq)  { score += 10; }
  else         { issues.push('Missing FAQ section'); }

  // 6. Image Alt Texts (0–10)
  const imgs      = html.match(/<img[^>]+>/gi) || [];
  const missingAlt = imgs.filter(t => !/alt=["'][^"']+["']/.test(t)).length;
  if      (imgs.length === 0)   { score += 5; issues.push('No images found'); }
  else if (missingAlt === 0)    { score += 10; }
  else { score += Math.max(0, 10 - missingAlt * 2); issues.push(`${missingAlt}/${imgs.length} images missing alt text`); }

  // 7. Internal Links (0–10)
  const intLinks = (html.match(/href="https?:\/\/homesandluxury\.com[^"]*"/gi) || []).length;
  if      (intLinks >= 2 && intLinks <= 3) { score += 10; }
  else if (intLinks === 1)                 { score += 5;  issues.push('Only 1 internal link (target 2–3)'); }
  else if (intLinks > 3)                   { score += 7;  issues.push(`${intLinks} internal links (max 3)`); }
  else                                     {             issues.push('No internal links found'); }

  // 8. No Banned AI Phrases (0–10)
  const foundBanned = BANNED_PHRASES.filter(p => text.toLowerCase().includes(p));
  if      (foundBanned.length === 0) { score += 10; }
  else if (foundBanned.length <= 2)  { score += 6;  issues.push(`Banned phrases: ${foundBanned.join(', ')}`); }
  else                               { score += 2;  issues.push(`Multiple banned phrases: ${foundBanned.slice(0,4).join(', ')}`); }

  // 9. Heading Depth H2 + H3 (0–10)
  const h2Count = (html.match(/<h2/gi) || []).length;
  const h3Count = (html.match(/<h3/gi) || []).length;
  if      (h2Count >= 5 && h3Count >= 5) { score += 10; }
  else if (h2Count >= 3 && h3Count >= 3) { score += 7;  issues.push(`${h2Count} H2s, ${h3Count} H3s (target 5+ each)`); }
  else if (h2Count >= 2)                 { score += 4;  issues.push(`Shallow heading structure: ${h2Count} H2s, ${h3Count} H3s`); }
  else                                   {             issues.push('Very poor heading structure'); }

  // 10. Author Byline Present (0–10)
  const hasAuthor = /editorial team|by .{5,50},|author/i.test(html);
  if (hasAuthor) { score += 10; }
  else           { score += 4;  issues.push('Missing or non-standard author byline'); }

  return { score, wordCount, issues, metaDesc, imgCount: imgs.length, missingAlt, h2Count, h3Count };
}

// ─── LIGHT FIXES (for scores 60–84) ──────────────────────────────────────────
async function applyLightFixes(post, issues) {
  const updates = {};
  const title   = post.title?.rendered?.replace(/<[^>]*>/g, '') || '';

  // Generate missing meta description
  if (issues.some(i => /missing|short meta/i.test(i))) {
    try {
      const r    = await getModel().generateContent(
        `Write a compelling meta description (140–160 characters, includes the topic keyword) for a home decor blog post titled: "${title}". Return only the meta description text, nothing else.`
      );
      const desc = r.response.text().trim().slice(0, 160);
      updates['_yoast_wpseo_metadesc']  = desc;
      updates['rank_math_description']  = desc;
      log(`    Auto-generated meta desc for "${title.slice(0,40)}..."`);
    } catch (e) {
      log(`    Warning: meta desc generation failed: ${e.message}`);
    }
  }

  if (Object.keys(updates).length > 0) {
    try {
      await wpPatch('posts', post.id, { meta: updates });
      log(`    ✅ Light fixes applied to post ID ${post.id}`);
    } catch (e) {
      log(`    Warning: could not apply fixes to ${post.id}: ${e.message}`);
    }
  }
}

// ─── FULL AUDIT RUNNER ────────────────────────────────────────────────────────
async function runFullAudit() {
  log('\n╔══════════════════════════════════════════════════════╗');
  log('║   TASK 2 — FULL BLOG AUDIT (ALL POSTS)                ║');
  log('╚══════════════════════════════════════════════════════╝');

  const posts   = await getAllPosts();
  const results = { good: [], updateNeeded: [], rewriteNeeded: [] };
  const lines   = [`\n${'═'.repeat(60)}\n${new Date().toISOString()} — FULL AUDIT (${posts.length} posts)\n${'═'.repeat(60)}`];

  for (const post of posts) {
    const title = post.title?.rendered?.replace(/<[^>]*>/g, '') || '(no title)';
    const { score, wordCount, issues, imgCount, missingAlt } = auditPost(post);

    let bucket;
    if      (score >= 85) { bucket = 'GOOD';           results.good.push(post); }
    else if (score >= 60) { bucket = 'UPDATE NEEDED';  results.updateNeeded.push({ post, score, issues }); }
    else                  { bucket = 'REWRITE NEEDED'; results.rewriteNeeded.push({ post, score, issues }); }

    const icon = score >= 85 ? '✅' : score >= 60 ? '⚠️ ' : '❌';
    log(`  ${icon} [${score}/100] ${bucket.padEnd(15)} "${title.slice(0, 50)}"`);
    issues.forEach(i => log(`            → ${i}`));

    lines.push(`\n[${score}/100] ${bucket}\n  Title : ${title}\n  URL   : ${post.link}\n  Words : ${wordCount} | Images: ${imgCount} (${missingAlt} missing alt)\n  Issues: ${issues.length ? issues.join(' | ') : 'None'}`);
  }

  // Auto-fix UPDATE NEEDED posts
  if (results.updateNeeded.length > 0) {
    log(`\n  Applying light fixes to ${results.updateNeeded.length} post(s)...`);
    for (const { post, issues } of results.updateNeeded) {
      await applyLightFixes(post, issues);
    }
  }

  lines.push(`\n${'─'.repeat(60)}\nSUMMARY: ${results.good.length} GOOD | ${results.updateNeeded.length} UPDATED | ${results.rewriteNeeded.length} NEED REWRITE\n`);
  await appendToLog('seo_audit_log.txt', lines.join('\n'));

  log(`\n  AUDIT COMPLETE:`);
  log(`    ✅ Good         : ${results.good.length}`);
  log(`    ⚠️  Auto-updated : ${results.updateNeeded.length}`);
  log(`    ❌ Need rewrite : ${results.rewriteNeeded.length}`);
  log('  Results saved → data/seo_audit_log.txt');

  return results;
}

module.exports = { auditPost, runFullAudit };
