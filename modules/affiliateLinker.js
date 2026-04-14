/**
 * affiliateLinker.js — Amazon affiliate link utilities
 */

function buildAmazonLink(searchTerms, linkText, tag) {
  const encoded = encodeURIComponent(searchTerms);
  const affTag  = tag || process.env.AMAZON_TAG || 'homesandlux01-20';
  return `<a href="https://www.amazon.com/s?k=${encoded}&tag=${affTag}" target="_blank" rel="nofollow sponsored">${linkText}</a>`;
}

function affiliateDisclosure() {
  return `<p class="affiliate-disclosure"><em><strong>Affiliate Disclosure:</strong> This article contains affiliate links. If you purchase through these links, we may earn a small commission at no extra cost to you.</em></p>`;
}

module.exports = { buildAmazonLink, affiliateDisclosure };
