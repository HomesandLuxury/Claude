/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  HOMESANDLUXURY.COM — BLOG AUTOMATION AGENT v2026           ║
 * ║  Roles: SEO Manager · Content Writer · Developer · Auditor  ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * Cron schedule:
 *   Daily  10:00 AM — Publish new SEO post
 *   Daily  11:00 AM — Site health check
 *   Sunday  8:00 AM — Full blog audit + auto-fix
 *
 * Manual commands:
 *   node blog-automation.js --test          Run all tasks now
 *   node blog-automation.js --publish-now   Publish one post now
 *   node blog-automation.js --audit-now     Run full audit now
 *   node blog-automation.js --health-now    Run health check now
 */

require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const cron = require('node-cron');
const path = require('path');
const fs   = require('fs').promises;

const { log, appendToLog }          = require('./modules/logger');
const { generateTitle }             = require('./modules/titleGenerator');
const { generateArticle }           = require('./modules/articleWriter');
const { fetchPexelsImages, uploadImageToWP } = require('./modules/imageHandler');
const { publishPost, getRecentPosts, getOrCreateCategory, getOrCreateTags } = require('./modules/wpPublisher');
const { runFullAudit }              = require('./modules/blogAuditor');
const { runSiteHealthCheck }        = require('./modules/siteHealthChecker');

// ─── PATHS ────────────────────────────────────────────────────────────────────
const DATA_DIR     = path.join(__dirname, 'data');
const KW_FILE      = path.join(DATA_DIR, 'keywords.txt');
const KW_IDX_FILE  = path.join(DATA_DIR, 'keyword_index.txt');
const PUB_LOG      = path.join(DATA_DIR, 'published_log.txt');

// ─── KEYWORD MANAGEMENT ───────────────────────────────────────────────────────
async function getNextKeyword() {
  const raw   = await fs.readFile(KW_FILE, 'utf-8');
  const lines = raw.split('\n');

  let idx = 0;
  try { idx = parseInt((await fs.readFile(KW_IDX_FILE, 'utf-8')).trim()) || 0; } catch {}

  // Load published keyword set
  const published = new Set();
  try {
    (await fs.readFile(PUB_LOG, 'utf-8')).split('\n').forEach(line => {
      const m = line.match(/\|KEYWORD\|(.+?)\|/);
      if (m) published.add(m[1].trim().toLowerCase());
    });
  } catch {}

  let keyword = null, category = 'Home Decor Ideas', currentCat = 'Home Decor Ideas', foundIdx = idx;

  for (let i = 0; i < lines.length; i++) {
    const li   = (idx + i) % lines.length;
    const line = lines[li].trim();
    if (line.startsWith('# CATEGORY:')) { currentCat = line.replace('# CATEGORY:', '').trim(); continue; }
    if (!line || line.startsWith('#'))  continue;
    if (!published.has(line.toLowerCase())) {
      keyword = line; category = currentCat; foundIdx = li; break;
    }
  }

  if (!keyword) throw new Error('All keywords published! Add more keywords to data/keywords.txt');
  await fs.writeFile(KW_IDX_FILE, String(foundIdx + 1));
  return { keyword, category };
}

// ─── TASK 1: DAILY PUBLISH ────────────────────────────────────────────────────
async function runDailyPublish() {
  log('\n╔══════════════════════════════════════════════════════╗');
  log('║   TASK 1 — WRITE & PUBLISH NEW BLOG POST              ║');
  log('╚══════════════════════════════════════════════════════╝');

  // 1. Get keyword
  const { keyword, category } = await getNextKeyword();
  log(`  Keyword  : "${keyword}"`);
  log(`  Category : "${category}"`);

  // 2. Fetch images
  log('  Fetching Pexels images...');
  const images = await fetchPexelsImages(keyword, 5);
  log(`  Found ${images.length} images from Pexels`);

  // 3. Internal link context
  const recent = await getRecentPosts(8);
  const existingPosts = recent.map(p => ({
    title : p.title?.rendered?.replace(/<[^>]*>/g, '') || '',
    url   : p.link,
  }));

  // 4. Generate title
  const title = await generateTitle(keyword, category);

  // 5. Generate article
  const articleData = await generateArticle(keyword, title, category, existingPosts);

  // 6. Upload featured image
  let featuredMediaId = null;
  if (images.length > 0) {
    log('  Uploading featured image...');
    try {
      const altText  = `${keyword} - ${title}`.slice(0, 120);
      const uploaded = await uploadImageToWP(
        images[0].url, altText, title,
        `Photo by ${images[0].photographer} on Pexels`
      );
      featuredMediaId = uploaded.id;
    } catch (e) {
      log(`  Warning: featured image upload failed: ${e.message}`);
    }
  }

  // 7. Replace image placeholders (use images[1..3] in body; images[0] is featured)
  let content = articleData.html_content;
  for (let i = 1; i <= 3; i++) {
    const img = images[i] || images[i - 1]; // fallback to first if not enough
    if (img) {
      const altText = `${keyword} ${img.alt || ''}`.slice(0, 120);
      const imgBlock = `
<figure class="wp-block-image size-large aligncenter">
  <img src="${img.url}" alt="${altText}" loading="lazy" width="${img.width}" height="${img.height}" />
  <figcaption>Photo by <a href="${img.pexelsUrl}" target="_blank" rel="noopener noreferrer">${img.photographer}</a> on <a href="https://www.pexels.com" target="_blank" rel="noopener noreferrer">Pexels</a></figcaption>
</figure>`;
      content = content.replace(`[IMAGE_PLACEHOLDER_${i}]`, imgBlock);
    } else {
      content = content.replace(`[IMAGE_PLACEHOLDER_${i}]`, '');
    }
  }

  // 7b. Safety pass — strip any em/en dashes that slipped through Gemini output
  content = content
    .replace(/\u2014/g, ',')    // em dash → comma
    .replace(/\u2013/g, ' to ') // en dash → "to"
    .replace(/---/g, ',')
    .replace(/--/g, ',');

  // 8. Append FAQ JSON-LD schema
  if (articleData.faq_schema) {
    content += `\n\n<!-- FAQ Schema Markup -->\n<script type="application/ld+json">\n${JSON.stringify(articleData.faq_schema, null, 2)}\n</script>`;
  }

  // 9. Taxonomy
  const catId  = await getOrCreateCategory(category);
  const tagIds = await getOrCreateTags(articleData.tags);

  // 10. Publish
  log('  Publishing to WordPress...');
  const published = await publishPost({
    title   : articleData.seo_title,
    content : content,
    status  : 'publish',
    slug    : articleData.slug,
    ...(featuredMediaId && { featured_media: featuredMediaId }),
    ...(catId            && { categories: [catId] }),
    ...(tagIds.length    && { tags: tagIds }),
    meta: {
      // Yoast SEO
      _yoast_wpseo_title    : articleData.seo_title,
      _yoast_wpseo_metadesc : articleData.meta_description,
      _yoast_wpseo_focuskw  : articleData.focus_keyword || keyword,
      // RankMath SEO
      rank_math_title         : articleData.seo_title,
      rank_math_description   : articleData.meta_description,
      rank_math_focus_keyword : articleData.focus_keyword || keyword,
    },
  });

  // 11. Log success
  const logLine = `${new Date().toISOString()} |KEYWORD| ${keyword} |CATEGORY| ${category} |TITLE| ${articleData.seo_title} |URL| ${published.link}\n`;
  await fs.appendFile(PUB_LOG, logLine);

  log(`\n  ✅ PUBLISHED SUCCESSFULLY`);
  log(`     Title    : ${articleData.seo_title}`);
  log(`     URL      : ${published.link}`);
  log(`     Category : ${category}`);
  log(`     Tags     : ${(articleData.tags || []).slice(0,5).join(', ')}`);

  return published;
}

// ─── INIT FILES ───────────────────────────────────────────────────────────────
async function initFiles() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const logFiles = ['published_log.txt','seo_audit_log.txt','site_health_log.txt','rewrite_log.txt','audit_queue.txt'];
  for (const f of logFiles) {
    const fp = path.join(DATA_DIR, f);
    try { await fs.access(fp); } catch { await fs.writeFile(fp, ''); }
  }
}

// ─── FULL DAILY RUNNER ────────────────────────────────────────────────────────
async function runAll() {
  log('\n╔══════════════════════════════════════════════════════════╗');
  log('║    HOMESANDLUXURY.COM — DAILY AUTOMATION STARTED          ║');
  log(`║    ${new Date().toLocaleString().padEnd(52)}║`);
  log('╚══════════════════════════════════════════════════════════╝');

  await initFiles();

  try { await runDailyPublish(); }
  catch (e) { log(`TASK 1 FAILED: ${e.message}`); }

  try { await runSiteHealthCheck(); }
  catch (e) { log(`TASK 3 FAILED: ${e.message}`); }

  log('\n╔══════════════════════════════════════════════════════════╗');
  log('║    DAILY TASKS COMPLETE ✅                                 ║');
  log('╚══════════════════════════════════════════════════════════╝\n');
}

// ─── ENTRY POINT ──────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const tz   = process.env.TIMEZONE || 'America/New_York';

if (args.includes('--test')) {
  log('MODE: Full test run (all tasks)');
  initFiles().then(runAll).catch(e => { log(`FATAL: ${e.message}`); process.exit(1); });

} else if (args.includes('--publish-now')) {
  log('MODE: Publish one post now');
  initFiles().then(runDailyPublish).catch(e => { log(`FATAL: ${e.message}`); process.exit(1); });

} else if (args.includes('--audit-now')) {
  log('MODE: Full audit now');
  initFiles().then(runFullAudit).catch(e => { log(`FATAL: ${e.message}`); process.exit(1); });

} else if (args.includes('--health-now')) {
  log('MODE: Health check now');
  initFiles().then(runSiteHealthCheck).catch(e => { log(`FATAL: ${e.message}`); process.exit(1); });

} else {
  // ── Scheduled mode ──
  log(`\n╔══════════════════════════════════════════════════════════╗`);
  log(`║    HOMESANDLUXURY.COM AUTOMATION SCHEDULER ACTIVE         ║`);
  log(`╚══════════════════════════════════════════════════════════╝`);
  log(`  Timezone : ${tz}`);
  log(`  Schedule :`);
  log(`    Daily  10:00 AM — Publish new SEO blog post`);
  log(`    Daily  11:00 AM — Site health check`);
  log(`    Sunday  8:00 AM — Full blog audit`);
  log(`\n  Press Ctrl+C to stop.\n`);

  initFiles().catch(console.error);

  // Daily 10:00 AM — publish new post
  cron.schedule('0 10 * * *',
    () => runAll().catch(e => log(`CRON PUBLISH ERROR: ${e.message}`)),
    { timezone: tz }
  );

  // Daily 11:00 AM — site health
  cron.schedule('0 11 * * *',
    () => runSiteHealthCheck().catch(e => log(`CRON HEALTH ERROR: ${e.message}`)),
    { timezone: tz }
  );

  // Every Sunday 8:00 AM — full blog audit
  cron.schedule('0 8 * * 0',
    () => runFullAudit().catch(e => log(`CRON AUDIT ERROR: ${e.message}`)),
    { timezone: tz }
  );
}
