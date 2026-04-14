/**
 * wpPublisher.js — WordPress REST API client
 * Handles: GET, POST, PATCH, paginated post fetching, category/tag management
 */
const fetch = require('node-fetch');
const { log } = require('./logger');

const BASE = () => (process.env.WP_SITE_URL || '').replace(/\/$/, '');

function authHeader() {
  return 'Basic ' + Buffer.from(`${process.env.WP_USERNAME}:${process.env.WP_APP_PASSWORD}`).toString('base64');
}
function jsonHeaders() {
  return { Authorization: authHeader(), 'Content-Type': 'application/json' };
}

async function wpGet(endpoint) {
  const res = await fetch(`${BASE()}/wp-json/wp/v2/${endpoint}`, { headers: jsonHeaders(), timeout: 15000 });
  if (!res.ok) throw new Error(`WP GET ${endpoint} → ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

async function wpPost(endpoint, body) {
  const res = await fetch(`${BASE()}/wp-json/wp/v2/${endpoint}`, {
    method: 'POST', headers: jsonHeaders(), body: JSON.stringify(body), timeout: 30000,
  });
  if (!res.ok) throw new Error(`WP POST ${endpoint} → ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return res.json();
}

async function wpPatch(endpoint, id, body) {
  const res = await fetch(`${BASE()}/wp-json/wp/v2/${endpoint}/${id}`, {
    method: 'POST', headers: jsonHeaders(), body: JSON.stringify(body), timeout: 30000,
  });
  if (!res.ok) throw new Error(`WP PATCH ${endpoint}/${id} → ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return res.json();
}

// Fetch ALL published posts (paginated)
async function getAllPosts(perPage = 20) {
  let page = 1, all = [];
  while (true) {
    const batch = await wpGet(
      `posts?per_page=${perPage}&page=${page}&status=publish&_fields=id,title,link,content,yoast_head_json,date,modified`
    );
    if (!batch.length) break;
    all = all.concat(batch);
    if (batch.length < perPage) break;
    page++;
  }
  log(`  Fetched ${all.length} posts total`);
  return all;
}

// Fetch recent posts (for internal linking context)
async function getRecentPosts(count = 8) {
  return wpGet(`posts?per_page=${count}&status=publish&_fields=id,title,link`);
}

// Get or create a category by name
async function getOrCreateCategory(name) {
  try {
    const cats = await wpGet(`categories?search=${encodeURIComponent(name)}&per_page=10`);
    const existing = cats.find(c => c.name.toLowerCase() === name.toLowerCase());
    if (existing) return existing.id;
    const created = await wpPost('categories', { name });
    log(`  Category created: "${name}" (ID ${created.id})`);
    return created.id;
  } catch (e) {
    log(`  Warning: category "${name}" → ${e.message}`);
    return null;
  }
}

// Get or create tags, return array of IDs
async function getOrCreateTags(tagNames) {
  const ids = [];
  for (const name of (tagNames || [])) {
    try {
      const tags = await wpGet(`tags?search=${encodeURIComponent(name)}&per_page=10`);
      const existing = tags.find(t => t.name.toLowerCase() === name.toLowerCase());
      if (existing) { ids.push(existing.id); continue; }
      const created = await wpPost('tags', { name });
      ids.push(created.id);
    } catch {}
  }
  return ids;
}

async function publishPost(postData) {
  return wpPost('posts', postData);
}

async function updatePost(id, postData) {
  return wpPatch('posts', id, postData);
}

module.exports = { wpGet, wpPost, wpPatch, getAllPosts, getRecentPosts, getOrCreateCategory, getOrCreateTags, publishPost, updatePost };
