/**
 * siteHealthChecker.js — Daily site health check
 * Checks: homepage load time, REST API, 404s on last 10 posts
 */
const fetch              = require('node-fetch');
const { wpGet }          = require('./wpPublisher');
const { log, appendToLog } = require('./logger');

async function runSiteHealthCheck() {
  log('\n╔══════════════════════════════════════════════════════╗');
  log('║   TASK 3 — SITE HEALTH CHECK                          ║');
  log('╚══════════════════════════════════════════════════════╝');

  const result = {
    timestamp  : new Date().toISOString(),
    siteUp     : false,
    apiUp      : false,
    loadTimeMs : null,
    errors404  : [],
    issues     : [],
  };

  // ── 1. Homepage load time ──
  try {
    const t0  = Date.now();
    const res = await fetch(process.env.WP_SITE_URL, { timeout: 15000 });
    result.loadTimeMs = Date.now() - t0;
    result.siteUp     = res.ok;
    const speedNote   = result.loadTimeMs > 3000 ? ` ⚠️  SLOW` : ' ✅ Fast';
    log(`  Homepage   : ${res.ok ? '✅ OK' : '❌ DOWN'} (${res.status}) — ${result.loadTimeMs}ms${speedNote}`);
    if (result.loadTimeMs > 3000) result.issues.push(`Slow load: ${result.loadTimeMs}ms (target <3000ms)`);
  } catch (e) {
    result.issues.push(`Homepage unreachable: ${e.message}`);
    log(`  Homepage   : ❌ ${e.message}`);
  }

  // ── 2. WordPress REST API ──
  try {
    const res = await fetch(`${process.env.WP_SITE_URL}/wp-json/wp/v2/`, { timeout: 10000 });
    result.apiUp = res.ok;
    log(`  REST API   : ${res.ok ? '✅ Accessible' : '❌ Unavailable'} (${res.status})`);
    if (!res.ok) result.issues.push(`REST API returned ${res.status}`);
  } catch (e) {
    result.apiUp = false;
    result.issues.push(`REST API: ${e.message}`);
    log(`  REST API   : ❌ ${e.message}`);
  }

  // ── 3. Check last 10 posts for 404s ──
  try {
    const posts = await wpGet('posts?per_page=10&status=publish&_fields=title,link');
    log(`  Checking ${posts.length} post URLs for 404s...`);
    for (const post of posts) {
      try {
        const r = await fetch(post.link, { timeout: 8000 });
        if (r.status === 404) {
          result.errors404.push(post.link);
          log(`  404 ❌      : ${post.link}`);
        }
      } catch (e) {
        result.issues.push(`Could not check: ${post.link}`);
      }
    }
    if (!result.errors404.length) log('  404 Check  : ✅ All post URLs OK');
  } catch (e) {
    log(`  404 Check  : ⚠️  ${e.message}`);
    result.issues.push(`Post check failed: ${e.message}`);
  }

  // ── Log report ──
  const report = [
    `\n${'═'.repeat(60)}`,
    `${result.timestamp} — HEALTH CHECK`,
    `${'═'.repeat(60)}`,
    `  Site Up    : ${result.siteUp}`,
    `  API Up     : ${result.apiUp}`,
    `  Load Time  : ${result.loadTimeMs ?? 'N/A'}ms`,
    `  404 Errors : ${result.errors404.length ? result.errors404.join('\n              ') : 'None'}`,
    `  Issues     : ${result.issues.length ? result.issues.join(' | ') : 'None'}`,
    '',
  ].join('\n');

  await appendToLog('site_health_log.txt', report);
  log('  Report saved → data/site_health_log.txt');
  return result;
}

module.exports = { runSiteHealthCheck };
