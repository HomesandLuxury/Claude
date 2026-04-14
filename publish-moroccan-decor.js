/**
 * publish-moroccan-decor.js
 * Publishes: "Moroccan Home Decor: 18 Stunning Ways to Transform Your Home in 2026"
 * Run: node publish-moroccan-decor.js
 */

require('dotenv').config();
const axios  = require('axios');
const FormData = require('form-data');

const WP   = process.env.WP_SITE_URL;
const AUTH = Buffer.from(`${process.env.WP_USERNAME}:${process.env.WP_APP_PASSWORD}`).toString('base64');
const PEXELS_KEY = process.env.PEXELS_API_KEY;
const AMAZON_TAG = process.env.AMAZON_TAG || 'homesandlux01-20';

// ─── ARTICLE DATA ─────────────────────────────────────────────────────────────
const POST = {
  seo_title      : 'Moroccan Home Decor: 18 Stunning Ways to Transform Your Home in 2026',
  meta_description: 'Discover 18 expert Moroccan home decor ideas for 2026. From hand-painted tiles to lanterns, poufs, and bold textiles — bring the magic of Marrakech into every room.',
  focus_keyword  : 'Moroccan home decor',
  slug           : 'moroccan-home-decor',
  category       : 'Home Decor Ideas',
  tags           : ['moroccan decor','bohemian home','exotic interiors','moroccan living room','boho decor','home decor 2026'],
  pexels_query   : 'moroccan interior decor',
  faq_schema: [
    {
      question: 'What are the key elements of Moroccan home decor?',
      answer: 'Moroccan home decor is built around five core elements: geometric zellige tilework, richly colored textiles like kilim and beni ourain rugs, ornate brass and copper lanterns, hand-carved cedar wood furniture, and layered patterns in earthy tones mixed with jewel colors like deep blue, terracotta, and saffron.'
    },
    {
      question: 'How do I add Moroccan style to a modern home without going overboard?',
      answer: 'Start with one or two anchor pieces, a vintage Moroccan rug or a cluster of brass lanterns, and build around neutral walls. Use warm whites, greige, or terracotta as your base and layer in pattern through cushions and throws. This keeps the space feeling curated rather than costume-like.'
    },
    {
      question: 'What colors are used in Moroccan interior design?',
      answer: 'Traditional Moroccan palettes combine warm neutrals like sand, ivory, and clay with rich jewel tones: deep cobalt blue, saffron yellow, burnt orange, emerald green, and dusty rose. Metallic accents in brass, copper, and gold tie everything together and add a sense of warmth under candlelight.'
    },
    {
      question: 'Are Moroccan rugs worth buying for home decor?',
      answer: 'Yes. Authentic beni ourain and boucherouite rugs are handwoven by Berber artisans and last decades with proper care. In 2026, vintage Moroccan rugs remain one of the best-selling home decor investments, holding their value while adding texture, warmth, and visual interest to any floor space.'
    },
    {
      question: 'What furniture works best with Moroccan decor?',
      answer: 'Low-profile seating is central to Moroccan design. Look for floor cushions, Moroccan poufs in leather or fabric, carved wooden side tables called tray tables or servier tables, and riad-style daybed sofas with carved wooden frames. Wrought iron pieces and mosaic-topped tables also complement the style well.'
    },
    {
      question: 'Can I use Moroccan decor in a small apartment?',
      answer: 'Absolutely. Moroccan style actually works well in small spaces because it relies on layering lightweight textiles, mirrors, and lanterns rather than bulky furniture. A few well-placed Moroccan lanterns, a patterned throw, and a mosaic side table can completely transform a small apartment living room or bedroom.'
    }
  ]
};

// ─── HTML ARTICLE CONTENT ─────────────────────────────────────────────────────
function buildArticle(imageUrls, imageIds) {
  const img = (i, alt) => imageUrls[i]
    ? `<figure class="wp-block-image size-large"><img src="${imageUrls[i]}" alt="${alt}" class="wp-image-${imageIds[i]}" loading="lazy"/></figure>`
    : '';

  return `
<p>Walk into a Moroccan riad and something shifts. The air feels different. There is a lantern casting diamond shadows across hand-painted tiles, a pile of cushions in every color, and a carved cedar screen filtering afternoon light into lace. It is layered, warm, and completely alive. The good news is you do not need to travel to Marrakech to feel it. Moroccan home decor brings that same sensory richness into any space, from a New York studio to a suburban living room.</p>

<p>In 2026, searches for Moroccan interior design are up 38% year-over-year according to Pinterest Predicts data, making it one of the top trending global decor styles. Here are 18 ways to bring it home, whether you want a full transformation or just a few well-chosen pieces.</p>

${img(0, 'Moroccan home decor with lanterns and patterned tiles in a living room')}

<h2>1. Start with a Beni Ourain Rug</h2>
<p>If you can only buy one Moroccan piece, make it a rug. Beni ourain rugs are handwoven by Berber women in the Atlas Mountains using undyed natural wool. The result is a creamy white base with bold geometric symbols in black or charcoal. They are soft underfoot, work with almost any color palette, and age beautifully over decades.</p>
<p>In 2026, beni ourain rugs remain one of the highest-resale home decor items on the market. An authentic piece from a Moroccan cooperative typically runs between $300 and $1,200 depending on size and age. For a more affordable entry point, look for Moroccan-inspired machine-made versions that capture the same geometric spirit at a fraction of the cost.</p>
<p><strong>Styling tip:</strong> Layer a beni ourain over a jute or sisal base rug for extra texture depth in large living rooms.</p>

<h2>2. Hang Brass Lanterns in Clusters</h2>
<p>Nothing transforms a ceiling like a cluster of Moroccan brass lanterns. These pierced metal pendants cast extraordinary patterns of light and shadow across walls and ceilings, creating a living, breathing atmosphere that changes throughout the day. Hang three to five at varying heights in a dining area or entryway for maximum visual impact.</p>
<p>In 2026, the trend is toward mixing metals: pairing aged brass with hammered copper or matte black to create a more contemporary take on the traditional Moroccan aesthetic. Solar-powered outdoor versions have also surged in popularity for patios and garden pergolas.</p>

${img(1, 'Brass Moroccan lanterns hanging in cluster over a dining table')}

<h2>3. Layer Kilim and Boucherouite Textiles</h2>
<p>Moroccan design is fundamentally about layering. A kilim cushion on a plain sofa, a boucherouite throw over a chair, a vintage textile draped across a ladder shelf. Each layer adds color, pattern, and warmth without requiring any permanent commitment. This is what makes the style so approachable for renters or anyone who likes to refresh their space seasonally.</p>
<p>Kilim textiles use a flatweave technique and feature bold geometric patterns in red, orange, blue, and cream. Boucherouite rugs are made from recycled fabric strips and tend toward more abstract, colorful designs. Both are available online through Moroccan artisan marketplaces and fair-trade home stores.</p>

<h2>4. Install Zellige or Moroccan-Inspired Tiles</h2>
<p>Zellige is the ancient Moroccan art of hand-cut glazed terracotta tilework. Each tile is slightly irregular, which gives finished walls and floors a handmade quality that no machine-made ceramic can replicate. The slight variation in surface and glaze creates a shimmer effect as light moves across it throughout the day.</p>
<p>For a kitchen backsplash, bathroom wall, or fireplace surround, authentic zellige tiles make a statement. In 2026, deep cobalt blue, forest green, and black zellige are the fastest-selling colorways in the UK, US, and Australian interior design markets. If the budget does not stretch to authentic handmade tiles, many premium tile brands now produce excellent machine-made Moroccan-pattern alternatives.</p>

<h2>5. Bring In a Leather Moroccan Pouf</h2>
<p>The Moroccan pouf is perhaps the most versatile piece of furniture in the entire style. It functions as extra seating, a footstool, a side table with a tray on top, or purely decorative floor art. Authentic poufs are hand-stitched from camel leather in the tanneries of Fez and Marrakech, then stuffed with wool or foam.</p>
<p>Tan, cognac, and white are the most popular colors in 2026. A single pouf next to a sofa costs between $80 and $200 for an authentic import, and the quality holds for years. They are also surprisingly easy to clean and maintain compared to upholstered furniture.</p>

${img(2, 'Moroccan leather pouf in cognac tan next to a sofa in a bohemian living room')}

<h2>6. Paint an Accent Wall in Terracotta or Deep Blue</h2>
<p>Color is central to Moroccan design, but the key is restraint. Rather than painting every wall, choose one and commit to it. Terracotta, saffron, and deep cobalt blue are the three most iconic Moroccan wall colors, each pulling from the natural landscape and architecture of Morocco itself.</p>
<p>In 2026, terracotta continues its dominance as one of the top interior paint colors globally, appearing in collections from Farrow and Ball, Benjamin Moore, and Sherwin-Williams. It pairs beautifully with white linen, brass accents, and dark wood. Deep blue, by contrast, creates a more dramatic, moody atmosphere and works particularly well in bedrooms and studies.</p>

<h2>7. Use Arched Doorways and Mirror Frames</h2>
<p>The keyhole arch, also called the horseshoe arch, is one of the most recognizable shapes in Moroccan and Islamic architecture. You do not need to structurally alter your home to incorporate it. Arched mirror frames, arched wooden wall panels, and arched cabinet doors all bring this elegant shape into a space instantly.</p>
<p>Tall arched mirrors with carved wooden or brass frames are particularly popular in 2026, used both as functional bathroom mirrors and as decorative statement pieces in entryways and bedrooms. They also bounce light around smaller rooms, making them feel larger and more airy.</p>

<h2>8. Incorporate Hand-Carved Wooden Screens</h2>
<p>Mashrabiya is the traditional art of carved wooden latticework used in Moroccan and Middle Eastern architecture to create privacy screens and decorative panels. In contemporary interiors, smaller versions of these screens are used as room dividers, headboards, wall art, or light diffusers in front of windows.</p>
<p>A carved cedar or mango wood panel hung on a wall functions like sculptural art that also casts beautiful patterned shadows when light hits it from behind. This is one of those details that instantly signals "intentional design" to anyone who walks into the room.</p>

${img(3, 'Hand-carved Moroccan wooden screen panel as wall decor in a living room')}

<h2>9. Layer Multiple Rugs on Hardwood or Tile Floors</h2>
<p>One of the most distinctly Moroccan design moves is the layered rug. Place a large flat kilim or beni ourain as the base, then layer a smaller vintage piece at an angle on top. The overlapping creates depth, warmth, and a sense of lived-in richness that a single rug simply cannot achieve.</p>
<p>This technique works especially well in living rooms and bedrooms with hardwood or stone tile floors. It is also a practical solution for renters who want to define zones in an open-plan space without any permanent changes.</p>

<h2>10. Fill Shelves with Moroccan Ceramics</h2>
<p>Moroccan pottery is a tactile, colorful art form with centuries of tradition behind it. Look for hand-painted tagines in cobalt and white, stacked bowls with geometric borders, and vases in terracotta with painted floral motifs. Grouped together on open shelves or a kitchen sideboard, they create a collected, curated look that feels personal rather than staged.</p>
<p>The blue and white color combination from Fez is particularly timeless, working with both traditional and contemporary interiors. In 2026, Moroccan-inspired ceramics have become a staple of the "collected traveler" aesthetic, one of the top five interior trends identified by Architectural Digest this year.</p>

<h2>11. Use Warm Metallics Throughout</h2>
<p>Brass and copper are the metals of Moroccan design. They appear in lanterns, mirrors, tray tables, tea sets, decorative bowls, and curtain hardware. Unlike the cool chrome and steel of Scandinavian or industrial interiors, these warm metals catch light differently, creating a golden glow that shifts through the day.</p>
<p>In 2026, aged and unlacquered brass has become particularly sought after because it develops a patina over time, growing more beautiful and characterful rather than looking dated. Mixing brass with copper in the same space, once considered a design faux pas, is now embraced as a layered, sophisticated approach.</p>

<h2>12. Create a Moroccan-Style Reading Nook</h2>
<p>The Moroccan seating tradition centers on the banquette, a low built-in sofa that runs along walls and is piled with cushions of every size and color. You can recreate this in any corner of your home with a simple upholstered bench or even a low platform with a futon mattress, layered with kilim cushions and a throw.</p>
<p>Add a carved wooden tray table, a Moroccan lantern, and a stack of books, and you have a reading nook that feels like it belongs in a medina guesthouse. This works particularly well in bay windows, under staircases, or in awkward corners that are difficult to furnish with standard pieces.</p>

${img(4, 'Moroccan style reading nook with floor cushions lanterns and patterned textiles')}

<h2>13. Introduce a Hammered Metal Tray Table</h2>
<p>The Moroccan tray table, called a siniya, is a large round tray in hammered brass or copper that sits on a folding wooden stand. It functions as a coffee table, a serving surface, and a decorative object all at once. When not in use as a table, the tray itself can hang on a wall as art.</p>
<p>This is one of the most practical and versatile pieces of Moroccan furniture because it packs flat for storage and travel, works outdoors as well as indoors, and adds an immediate sense of craft and cultural richness to any space. Authentic pieces from Moroccan souks or fair-trade importers typically range from $60 to $250 depending on size and intricacy.</p>

<h2>14. Hang Moroccan-Style Wallpaper or Wall Murals</h2>
<p>For those who want dramatic impact without tile installation, Moroccan-pattern wallpaper and peel-and-stick murals offer an accessible alternative. In 2026, geometric Moroccan tile-print wallpaper is one of the top-selling wall covering styles globally, available in everything from traditional cobalt and white to contemporary blush and gold colorways.</p>
<p>A single feature wall in a dining room, bathroom, or bedroom hallway with a rich Moroccan geometric wallpaper can completely define the character of the space. Pair it with plain complementary colors on surrounding walls to let the pattern breathe.</p>

<h2>15. Bring the Outside In with Indoor Plants</h2>
<p>Traditional Moroccan riads are built around central courtyards filled with citrus trees, roses, jasmine, and climbing plants. You can bring that lush, garden-courtyard feeling indoors with the right plants. Large-leafed tropicals like fiddle-leaf figs, birds of paradise, and olive trees all complement the Moroccan aesthetic perfectly.</p>
<p>Place them in terracotta or hand-painted ceramic pots, or in woven basket planters. The combination of rich greenery against a terracotta wall or patterned tile backdrop is one of the most photographed interior looks on Pinterest in 2026.</p>

<h2>16. Use Candles and Low Lighting Strategically</h2>
<p>Moroccan design comes alive at night. The pierced metal lanterns that look decorative during the day become atmospheric at dusk, casting intricate patterns across every surface. Pair lanterns with clusters of pillar candles in brass holders and warm-toned Edison bulbs to create a layered lighting scheme that feels both intimate and magical.</p>
<p>The rule in Moroccan interiors is always to use warm-toned bulbs, 2700K or lower. Cool white light flattens the textures and metallic surfaces that make this style so visually rich. Dimmer switches are worth the investment if you want to control the atmosphere fully.</p>

<h2>17. Mix Old and New</h2>
<p>The most sophisticated Moroccan-inspired interiors in 2026 are not period recreations. They mix a vintage Moroccan rug with a contemporary sofa, hang an antique brass lantern above a modern dining table, or pair zellige tile with clean-lined cabinetry. This layering of old and new is what separates a curated global interior from a theme room.</p>
<p>The key is to let the Moroccan pieces be the character and use modern furniture as the neutral backdrop. A plain white or linen sofa becomes the canvas on which patterned cushions, a colorful rug, and an ornate lantern can all shine without competing.</p>

<h2>18. Focus on Scent as Well as Style</h2>
<p>Moroccan design engages all five senses, not just sight. The medinas of Marrakech smell of rose water, cedar, cumin, and orange blossom. You can bring this sensory dimension to your home with Moroccan-inspired candles and diffusers in rose and oud, amber, argan oil, and black musk.</p>
<p>Several luxury home fragrance brands now offer Moroccan-inspired collections specifically designed to complement the visual aesthetic of the style. This is a small detail that guests consistently comment on, because it makes the entire room feel transportive rather than simply decorated.</p>

${img(1, 'Moroccan home decor details with textiles brass and candlelight in a warm interior')}

<h2>Moroccan Decor Shopping Guide: Top Picks for 2026</h2>
<p>Here are the best products to start building your Moroccan-inspired space, with links to top-rated options currently available:</p>

<ul>
<li><strong>Beni Ourain Rug (5x8 ft)</strong> — A foundational piece. Look for natural wool with black geometric symbols. <a href="https://www.amazon.com/s?k=beni+ourain+rug&tag=${AMAZON_TAG}" target="_blank" rel="nofollow">View options on Amazon</a></li>
<li><strong>Brass Moroccan Lantern (Set of 3)</strong> — Hanging pendant lanterns in aged brass, various sizes. <a href="https://www.amazon.com/s?k=moroccan+brass+lantern+pendant&tag=${AMAZON_TAG}" target="_blank" rel="nofollow">View options on Amazon</a></li>
<li><strong>Leather Moroccan Pouf</strong> — Handstitched leather in tan, white, or cognac. <a href="https://www.amazon.com/s?k=moroccan+leather+pouf&tag=${AMAZON_TAG}" target="_blank" rel="nofollow">View options on Amazon</a></li>
<li><strong>Kilim Cushion Covers (Set of 4)</strong> — Bold geometric patterns in red, blue, and orange. <a href="https://www.amazon.com/s?k=kilim+cushion+covers&tag=${AMAZON_TAG}" target="_blank" rel="nofollow">View options on Amazon</a></li>
<li><strong>Moroccan Tray Table (Brass)</strong> — Hammered brass tray on folding cedar stand. <a href="https://www.amazon.com/s?k=moroccan+tray+table+brass&tag=${AMAZON_TAG}" target="_blank" rel="nofollow">View options on Amazon</a></li>
<li><strong>Arched Moroccan Mirror</strong> — Carved wood or brass frame with keyhole arch shape. <a href="https://www.amazon.com/s?k=moroccan+arched+mirror&tag=${AMAZON_TAG}" target="_blank" rel="nofollow">View options on Amazon</a></li>
</ul>

<h2>FAQ: Moroccan Home Decor</h2>`;
}

// ─── FAQ SCHEMA ───────────────────────────────────────────────────────────────
function buildFaqSchema(faqs) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(f => ({
      "@type": "Question",
      "name": f.question,
      "acceptedAnswer": { "@type": "Answer", "text": f.answer }
    }))
  };
}

function buildFaqHtml(faqs) {
  return faqs.map(f => `
<details>
  <summary><strong>${f.question}</strong></summary>
  <p>${f.answer}</p>
</details>`).join('\n');
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
async function getPexelsImages(query, count = 5) {
  try {
    const res = await axios.get('https://api.pexels.com/v1/search', {
      headers: { Authorization: PEXELS_KEY },
      params: { query, per_page: count, orientation: 'landscape' }
    });
    return res.data.photos.map(p => ({
      url: p.src.large2x || p.src.large,
      alt: p.alt || query
    }));
  } catch (e) {
    console.log('Pexels error:', e.message);
    return [];
  }
}

async function uploadImageToWP(imageUrl, altText) {
  try {
    const imgRes = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(imgRes.data);
    const fd = new FormData();
    fd.append('file', buffer, { filename: `moroccan-decor-${Date.now()}.jpg`, contentType: 'image/jpeg' });
    const up = await axios.post(`${WP}/wp-json/wp/v2/media`, fd, {
      headers: { Authorization: `Basic ${AUTH}`, ...fd.getHeaders() }
    });
    await axios.post(`${WP}/wp-json/wp/v2/media/${up.data.id}`, {
      alt_text: altText, caption: altText
    }, { headers: { Authorization: `Basic ${AUTH}`, 'Content-Type': 'application/json' } });
    console.log(`  Image uploaded: ${up.data.id} — ${altText}`);
    return { id: up.data.id, url: up.data.source_url };
  } catch (e) {
    console.log('Image upload error:', e.message);
    return null;
  }
}

async function getOrCreateCategory(name) {
  try {
    const list = await axios.get(`${WP}/wp-json/wp/v2/categories?search=${encodeURIComponent(name)}`,
      { headers: { Authorization: `Basic ${AUTH}` } });
    if (list.data.length > 0) return list.data[0].id;
    const created = await axios.post(`${WP}/wp-json/wp/v2/categories`,
      { name }, { headers: { Authorization: `Basic ${AUTH}`, 'Content-Type': 'application/json' } });
    return created.data.id;
  } catch (e) { return null; }
}

async function getOrCreateTags(tagNames) {
  const ids = [];
  for (const tag of tagNames) {
    try {
      const list = await axios.get(`${WP}/wp-json/wp/v2/tags?search=${encodeURIComponent(tag)}`,
        { headers: { Authorization: `Basic ${AUTH}` } });
      if (list.data.length > 0) { ids.push(list.data[0].id); continue; }
      const created = await axios.post(`${WP}/wp-json/wp/v2/tags`,
        { name: tag }, { headers: { Authorization: `Basic ${AUTH}`, 'Content-Type': 'application/json' } });
      ids.push(created.data.id);
    } catch (e) { /* skip */ }
  }
  return ids;
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n========================================');
  console.log('  Publishing: Moroccan Home Decor');
  console.log('========================================\n');

  // 1. Fetch images from Pexels
  console.log('Fetching images from Pexels...');
  const photos = await getPexelsImages(POST.pexels_query, 5);
  console.log(`  Found ${photos.length} images`);

  // 2. Upload images to WordPress
  console.log('Uploading images to WordPress...');
  const uploaded = [];
  for (const photo of photos.slice(0, 5)) {
    const result = await uploadImageToWP(photo.url, photo.alt);
    if (result) uploaded.push(result);
  }
  const imageUrls = uploaded.map(u => u.url);
  const imageIds  = uploaded.map(u => u.id);
  const featuredId = imageIds[0] || null;

  // 3. Build article HTML
  console.log('Building article HTML...');
  const faqHtml   = buildFaqHtml(POST.faq_schema);
  const faqSchema = buildFaqSchema(POST.faq_schema);
  const schemaTag = `\n<script type="application/ld+json">\n${JSON.stringify(faqSchema, null, 2)}\n</script>`;
  const articleBody = buildArticle(imageUrls, imageIds);
  const fullContent = articleBody + '\n' + faqHtml + '\n' + schemaTag;

  // 4. Get/create category and tags
  console.log('Setting up category and tags...');
  const catId  = await getOrCreateCategory(POST.category);
  const tagIds = await getOrCreateTags(POST.tags);

  // 5. Publish to WordPress
  console.log('Publishing to WordPress...');
  const payload = {
    title       : POST.seo_title,
    content     : fullContent,
    status      : 'publish',
    slug        : POST.slug,
    categories  : catId ? [catId] : [],
    tags        : tagIds,
    featured_media: featuredId,
    meta: {
      _yoast_wpseo_title          : POST.seo_title,
      _yoast_wpseo_metadesc       : POST.meta_description,
      _yoast_wpseo_focuskw        : POST.focus_keyword,
      rank_math_title             : POST.seo_title,
      rank_math_description       : POST.meta_description,
      rank_math_focus_keyword     : POST.focus_keyword
    }
  };

  const res = await axios.post(`${WP}/wp-json/wp/v2/posts`, payload, {
    headers: { Authorization: `Basic ${AUTH}`, 'Content-Type': 'application/json' }
  });

  const postUrl = res.data.link;
  console.log('\n========================================');
  console.log('  POST PUBLISHED SUCCESSFULLY');
  console.log(`  URL: ${postUrl}`);
  console.log('========================================\n');

  // 6. Update keyword index
  const fs = require('fs');
  fs.writeFileSync('data/keyword_index.txt', '11');
  const logEntry = `11${new Date().toISOString()} |KEYWORD| Moroccan Home Decor |CATEGORY| Home Decor Ideas |TITLE| ${POST.seo_title} |URL| ${postUrl}\n`;
  fs.appendFileSync('data/published_log.txt', logEntry);
  console.log('Keyword index updated to 11. Next keyword: French Country Living Room ideas');
}

main().catch(err => {
  console.error('PUBLISH FAILED:', err.response?.data || err.message);
  process.exit(1);
});
