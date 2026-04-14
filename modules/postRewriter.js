/**
 * postRewriter.js — Full rewrite engine for posts scoring < 60/100
 * Preserves URL slug. Generates fresh 3000–3500 word article.
 */
const { generateTitle }             = require('./titleGenerator');
const { generateArticle }           = require('./articleWriter');
const { fetchPexelsImages, uploadImageToWP } = require('./imageHandler');
const { wpPatch, getRecentPosts, getOrCreateTags } = require('./wpPublisher');
const { log, appendToLog }          = require('./logger');

async function rewritePost(post) {
  const oldTitle = post.title?.rendered?.replace(/<[^>]*>/g, '').trim() || '';
  log(`\n  Rewriting: "${oldTitle}"`);

  // Extract primary keyword from existing title (use as-is)
  const keyword  = oldTitle;
  const category = 'Home Decor Ideas'; // default; ideally detect from existing categories

  try {
    // Get existing posts for internal linking (exclude this post)
    const recent = await getRecentPosts(8);
    const linking = recent
      .filter(p => p.id !== post.id)
      .map(p => ({ title: p.title?.rendered?.replace(/<[^>]*>/g, ''), url: p.link }));

    // Generate new title
    const newTitle = await generateTitle(keyword, category);

    // Generate full article
    const articleData = await generateArticle(keyword, newTitle, category, linking);

    // Fetch and upload new featured image
    const images = await fetchPexelsImages(keyword, 3);
    let featuredMediaId = null;
    if (images.length > 0) {
      try {
        const uploaded = await uploadImageToWP(
          images[0].url,
          `${keyword} - featured image`,
          newTitle,
          `Photo by ${images[0].photographer} on Pexels`
        );
        featuredMediaId = uploaded.id;
      } catch (e) {
        log(`  Warning: image upload failed: ${e.message}`);
      }
    }

    // Replace image placeholders
    let content = articleData.html_content;
    for (let i = 1; i <= 3; i++) {
      if (images[i - 1]) {
        const img = images[i - 1];
        content = content.replace(`[IMAGE_PLACEHOLDER_${i}]`,
          `<figure class="wp-block-image size-large aligncenter">
  <img src="${img.url}" alt="${keyword} ${img.alt || ''}".slice(0,120) loading="lazy" />
  <figcaption>Photo by <a href="${img.pexelsUrl}" target="_blank" rel="noopener noreferrer">${img.photographer}</a> on Pexels</figcaption>
</figure>`
        );
      } else {
        content = content.replace(`[IMAGE_PLACEHOLDER_${i}]`, '');
      }
    }

    // Append FAQ schema
    if (articleData.faq_schema) {
      content += `\n\n<script type="application/ld+json">\n${JSON.stringify(articleData.faq_schema, null, 2)}\n</script>`;
    }

    const tagIds = await getOrCreateTags(articleData.tags);

    // Update post — preserve slug
    await wpPatch('posts', post.id, {
      title   : articleData.seo_title,
      content : content,
      ...(featuredMediaId && { featured_media: featuredMediaId }),
      ...(tagIds.length   && { tags: tagIds }),
      meta: {
        _yoast_wpseo_title      : articleData.seo_title,
        _yoast_wpseo_metadesc   : articleData.meta_description,
        _yoast_wpseo_focuskw    : articleData.focus_keyword,
        rank_math_title         : articleData.seo_title,
        rank_math_description   : articleData.meta_description,
        rank_math_focus_keyword : articleData.focus_keyword,
      },
    });

    const entry = `${new Date().toISOString()} | REWRITTEN | "${oldTitle}" → "${articleData.seo_title}" | ${post.link}\n`;
    await appendToLog('rewrite_log.txt', entry);
    log(`  ✅ Rewrite complete: "${articleData.seo_title}"`);
    return true;

  } catch (e) {
    log(`  ❌ Rewrite failed for "${oldTitle}": ${e.message}`);
    return false;
  }
}

module.exports = { rewritePost };
