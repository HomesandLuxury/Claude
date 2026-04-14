/**
 * imageHandler.js — Pexels image fetch + WordPress Media Library upload
 */
const fetch    = require('node-fetch');
const FormData = require('form-data');
const { log }  = require('./logger');

// ─── PEXELS FETCH ────────────────────────────────────────────────────────────
async function fetchPexelsImages(query, count = 5) {
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${count}&orientation=landscape&size=large`;
  const res = await fetch(url, { headers: { Authorization: process.env.PEXELS_API_KEY } });
  if (!res.ok) throw new Error(`Pexels API → ${res.status}`);
  const data = await res.json();
  return (data.photos || []).map(p => ({
    url          : p.src.large2x || p.src.large,
    thumbnail    : p.src.medium,
    alt          : p.alt || query,
    photographer : p.photographer,
    pexelsUrl    : p.url,
    width        : p.width,
    height       : p.height,
  }));
}

// ─── WORDPRESS UPLOAD ────────────────────────────────────────────────────────
function wpAuth() {
  return 'Basic ' + Buffer.from(`${process.env.WP_USERNAME}:${process.env.WP_APP_PASSWORD}`).toString('base64');
}

/**
 * @param {string} imageUrl      - Pexels image URL
 * @param {string} altText       - SEO alt text: "[Keyword] [Context] [Style]"
 * @param {string} title         - Image title (shown in WP media library)
 * @param {string} caption       - Image caption (credits)
 */
async function uploadImageToWP(imageUrl, altText, title, caption = '') {
  // Download image buffer
  const imgRes = await fetch(imageUrl, { timeout: 20000 });
  if (!imgRes.ok) throw new Error(`Image download failed: ${imgRes.status}`);
  const buffer = await imgRes.buffer();

  // Build safe filename
  const filename = (altText || 'image')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) + '.jpg';

  const form = new FormData();
  form.append('file', buffer, { filename, contentType: 'image/jpeg' });
  form.append('title',    title   || altText);
  form.append('alt_text', altText || '');
  form.append('caption',  caption || '');

  const uploadRes = await fetch(`${process.env.WP_SITE_URL}/wp-json/wp/v2/media`, {
    method  : 'POST',
    headers : { Authorization: wpAuth(), ...form.getHeaders() },
    body    : form,
    timeout : 30000,
  });
  if (!uploadRes.ok) {
    throw new Error(`Image upload → ${uploadRes.status}: ${await uploadRes.text()}`);
  }
  const media = await uploadRes.json();

  // Ensure alt text is set via PATCH (sometimes form-data alt is ignored)
  await fetch(`${process.env.WP_SITE_URL}/wp-json/wp/v2/media/${media.id}`, {
    method  : 'POST',
    headers : { Authorization: wpAuth(), 'Content-Type': 'application/json' },
    body    : JSON.stringify({ alt_text: altText, title: title || altText, caption }),
    timeout : 10000,
  });

  log(`    Image uploaded → ID ${media.id} | "${altText.slice(0, 60)}"`);
  return media;
}

module.exports = { fetchPexelsImages, uploadImageToWP };
