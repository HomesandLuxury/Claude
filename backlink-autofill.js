/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  HOMESANDLUXURY.COM — BACKLINK AUTO-FILLER                   ║
 * ║  Playwright script: opens sites, fills forms, you click      ║
 * ║  Submit + solve CAPTCHAs only                                ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * Usage:
 *   node backlink-autofill.js              → interactive menu
 *   node backlink-autofill.js --site=yelp  → run one site directly
 *   node backlink-autofill.js --tier=1     → run all Tier 1 sites
 */

require('dotenv').config();
const { chromium } = require('playwright');
const readline     = require('readline');
const { execSync } = require('child_process');
const path         = require('path');
const fs           = require('fs');

// ─── BUSINESS INFO (edit .env to change) ─────────────────────────────────────
const B = {
  name      : 'HomesAndLuxury',
  url       : 'https://homesandluxury.com',
  email     : process.env.CONTACT_EMAIL    || '',
  phone     : process.env.CONTACT_PHONE    || '',
  city      : process.env.CONTACT_CITY     || '',
  country   : process.env.CONTACT_COUNTRY  || '',
  category  : 'Home Decor',
  keywords  : 'home decor ideas, luxury home decor, interior design inspiration, wall decor, farmhouse decor, luxury living',
  shortDesc : 'HomesAndLuxury is a premium home decor and luxury lifestyle blog featuring expert interior design ideas, room styling guides, product reviews, and decor inspiration for homeowners who want beautiful, curated living spaces.',
  longDesc  : 'HomesAndLuxury.com is your go-to destination for premium home decor ideas, luxury interior design inspiration, and expert lifestyle content. We cover everything from farmhouse and rustic decor to modern luxury living, wall art, gardening, kitchen design, and seasonal decorating. Our editorial team of home decor specialists and interior design consultants publishes in-depth guides, product reviews with honest pros and cons, and trend forecasts to help homeowners create spaces they truly love. Whether you are decorating a small apartment or a luxury home, HomesAndLuxury provides the expert guidance, product recommendations, and visual inspiration you need to bring your vision to life. Explore hundreds of guides covering furniture selection, color palettes, lighting design, outdoor spaces, and the best home decor products available today.',
};

// ─── ALL 80 SITES ─────────────────────────────────────────────────────────────
const SITES = [
  // TIER 1 — Directories
  { id:'google',      tier:1, name:'Google Business Profile', url:'https://business.google.com/create',                                   note:'Sign in with Google first, then script fills business details' },
  { id:'yelp',        tier:1, name:'Yelp Business',           url:'https://biz.yelp.com/signup',                                          note:'Creates account then fills business form' },
  { id:'bing',        tier:1, name:'Bing Places',             url:'https://www.bingplaces.com/',                                          note:'Sign in with Microsoft, script fills listing' },
  { id:'foursquare',  tier:1, name:'Foursquare',              url:'https://foursquare.com/venue/new',                                     note:'Creates venue listing' },
  { id:'hotfrog',     tier:1, name:'Hotfrog',                 url:'https://www.hotfrog.com/AddBusiness.aspx',                             note:'Fills registration + business form' },
  { id:'manta',       tier:1, name:'Manta',                   url:'https://www.manta.com/add-your-business',                              note:'Fills business registration' },
  { id:'yellowpages', tier:1, name:'Yellow Pages',            url:'https://www.yellowpages.com/add-listing',                              note:'Fills listing form' },
  { id:'cylex',       tier:1, name:'Cylex',                   url:'https://www.cylex.us.com/add-company.html',                            note:'Simple form fill' },
  { id:'brownbook',   tier:1, name:'Brownbook',               url:'https://www.brownbook.net/add-business/',                              note:'Fills add business form' },
  { id:'ezlocal',     tier:1, name:'EZLocal',                 url:'https://www.ezlocal.com/add-business',                                 note:'Fills listing form' },
  { id:'n49',         tier:1, name:'n49',                     url:'https://www.n49.com/biz/add/',                                         note:'Fills business listing' },
  { id:'tupalo',      tier:1, name:'Tupalo',                  url:'https://tupalo.com/en/users/sign_up',                                  note:'Signup + add venue' },
  { id:'mapquest',    tier:1, name:'MapQuest',                url:'https://www.mapquest.com/add-a-place',                                 note:'Fills place form' },
  { id:'2findlocal',  tier:1, name:'2FindLocal',              url:'https://www.2findlocal.com/Set/Business/Add',                          note:'Fills business form' },
  { id:'spoke',       tier:1, name:'Spoke',                   url:'https://www.spoke.com',                                               note:'Creates company profile' },
  // TIER 2 — High-DA Profiles
  { id:'crunchbase',  tier:2, name:'Crunchbase',              url:'https://www.crunchbase.com/login',                                    note:'Sign in, then add organization profile' },
  { id:'linkedin',    tier:2, name:'LinkedIn Company Page',   url:'https://www.linkedin.com/company/setup/new/',                         note:'Sign in to LinkedIn, script fills company details' },
  { id:'angelist',    tier:2, name:'AngelList/Wellfound',     url:'https://wellfound.com/company/new',                                   note:'Fills startup profile' },
  { id:'producthunt', tier:2, name:'Product Hunt',            url:'https://www.producthunt.com/posts/new',                               note:'Sign in, script fills product submission' },
  { id:'aboutme',     tier:2, name:'About.me',                url:'https://about.me/signup',                                             note:'Creates profile with website link' },
  { id:'gravatar',    tier:2, name:'Gravatar',                url:'https://gravatar.com/connect/',                                       note:'Creates Gravatar profile' },
  { id:'behance',     tier:2, name:'Behance',                 url:'https://www.behance.net/onboarding/adobe',                            note:'Creates portfolio with site link' },
  { id:'medium',      tier:2, name:'Medium',                  url:'https://medium.com/m/signin',                                         note:'Signs in, creates publication with website' },
  { id:'tumblr',      tier:2, name:'Tumblr',                  url:'https://www.tumblr.com/register',                                     note:'Creates blog with website link' },
  { id:'wordpresscom',tier:2, name:'WordPress.com',           url:'https://wordpress.com/start/user',                                    note:'Creates branded blog' },
  { id:'blogger',     tier:2, name:'Blogger',                 url:'https://www.blogger.com/new-blog',                                    note:'Creates blog with site link' },
  { id:'weebly',      tier:2, name:'Weebly',                  url:'https://www.weebly.com/signup',                                       note:'Creates free site with backlink' },
  { id:'wix',         tier:2, name:'Wix',                     url:'https://users.wix.com/signin',                                        note:'Creates free site with backlink' },
  // TIER 3 — Q&A
  { id:'quora',       tier:3, name:'Quora Profile',           url:'https://www.quora.com/profile/edit',                                  note:'Updates profile bio with website link' },
  { id:'reddit',      tier:3, name:'Reddit Profile',          url:'https://www.reddit.com/settings/profile',                             note:'Adds website to Reddit profile' },
  // TIER 4 — Article Platforms
  { id:'vocal',       tier:4, name:'Vocal.media',             url:'https://vocal.media/new',                                             note:'Creates article with backlink' },
  { id:'hubpages',    tier:4, name:'HubPages',                url:'https://hubpages.com/register',                                       note:'Registers account with website' },
  { id:'scoopit',     tier:4, name:'Scoop.it',                url:'https://www.scoop.it/user/registration',                              note:'Creates curation account' },
  { id:'flipboard',   tier:4, name:'Flipboard',               url:'https://flipboard.com/signup',                                        note:'Creates magazine with website' },
  // TIER 5 — Social Media
  { id:'facebook',    tier:5, name:'Facebook Business Page',  url:'https://www.facebook.com/pages/create',                               note:'Sign in to Facebook, script fills page details' },
  { id:'pinterest',   tier:5, name:'Pinterest Business',      url:'https://www.pinterest.com/business/create/',                          note:'Creates business account with website' },
  { id:'youtube',     tier:5, name:'YouTube Channel',         url:'https://www.youtube.com/create_channel',                              note:'Sign in to Google, adds channel description + website' },
  // TIER 6 — Image Sharing
  { id:'flickr',      tier:6, name:'Flickr',                  url:'https://www.flickr.com/signup',                                       note:'Creates profile with website link' },
  { id:'px500',       tier:6, name:'500px',                   url:'https://500px.com/signup',                                            note:'Creates portfolio with website' },
  // TIER 7 — Niche
  { id:'houzz',       tier:7, name:'Houzz',                   url:'https://www.houzz.com/for-pros',                                      note:'Creates professional profile' },
  { id:'homeadvisor', tier:7, name:'HomeAdvisor',             url:'https://pro.homeadvisor.com/',                                        note:'Creates pro profile with website' },
  // TIER 8 — Press Release
  { id:'prlog',       tier:8, name:'PRLog',                   url:'https://www.prlog.org/post/',                                         note:'Fills press release form with site link' },
  { id:'openpr',      tier:8, name:'OpenPR',                  url:'https://www.openpr.com/sign-in.html',                                 note:'Submits press release' },
  { id:'prcom',       tier:8, name:'PR.com',                  url:'https://www.pr.com/press-release/new',                                note:'Creates press release' },
  // TIER 9 — Document Sharing
  { id:'slideshare',  tier:9, name:'SlideShare',              url:'https://www.slideshare.net/login',                                    note:'Creates profile + uploads deck with backlink' },
  { id:'scribd',      tier:9, name:'Scribd',                  url:'https://www.scribd.com/signup',                                       note:'Creates account with website in bio' },
  { id:'issuu',       tier:9, name:'Issuu',                   url:'https://issuu.com/signup',                                            note:'Creates publication profile' },
];

// ─── SITE-SPECIFIC FORM HANDLERS ─────────────────────────────────────────────
const HANDLERS = {

  async hotfrog(page) {
    await page.goto('https://www.hotfrog.com/AddBusiness.aspx', { waitUntil:'domcontentloaded' });
    await fill(page, ['#companyname','input[name*="company"]','input[name*="business"]'], B.name);
    await fill(page, ['#website','input[name*="website"]','input[type="url"]'], B.url);
    await fill(page, ['#email','input[type="email"]'], B.email);
    await fill(page, ['#description','textarea[name*="desc"]','textarea'], B.longDesc);
    await fill(page, ['#city','input[name*="city"]'], B.city);
    await fill(page, ['#phone','input[type="tel"]'], B.phone);
    await highlight(page, 'form');
  },

  async cylex(page) {
    await page.goto('https://www.cylex.us.com/add-company.html', { waitUntil:'domcontentloaded' });
    await fill(page, ['input[name*="company"]','input[name*="name"]','#company'], B.name);
    await fill(page, ['input[name*="url"]','input[name*="website"]','input[type="url"]'], B.url);
    await fill(page, ['input[type="email"]','input[name*="email"]'], B.email);
    await fill(page, ['textarea','input[name*="desc"]'], B.longDesc);
    await fill(page, ['input[name*="city"]'], B.city);
    await fill(page, ['input[type="tel"]','input[name*="phone"]'], B.phone);
    await highlight(page, 'form');
  },

  async brownbook(page) {
    await page.goto('https://www.brownbook.net/add-business/', { waitUntil:'domcontentloaded' });
    await fill(page, ['#business_name','input[name*="name"]'], B.name);
    await fill(page, ['#website','input[name*="web"]','input[type="url"]'], B.url);
    await fill(page, ['#email','input[type="email"]'], B.email);
    await fill(page, ['#description','textarea'], B.longDesc);
    await fill(page, ['#city','input[name*="city"]'], B.city);
    await fill(page, ['#phone','input[type="tel"]'], B.phone);
    await highlight(page, 'form');
  },

  async n49(page) {
    await page.goto('https://www.n49.com/biz/add/', { waitUntil:'domcontentloaded' });
    await fill(page, ['input[name*="name"]','#name'], B.name);
    await fill(page, ['input[name*="website"]','input[type="url"]'], B.url);
    await fill(page, ['input[type="email"]'], B.email);
    await fill(page, ['textarea'], B.longDesc);
    await fill(page, ['input[name*="city"]'], B.city);
    await fill(page, ['input[type="tel"]'], B.phone);
    await highlight(page, 'form');
  },

  async manta(page) {
    await page.goto('https://www.manta.com/add-your-business', { waitUntil:'domcontentloaded' });
    await fill(page, ['input[name*="company"]','input[name*="business"]','input[name*="name"]'], B.name);
    await fill(page, ['input[name*="website"]','input[type="url"]'], B.url);
    await fill(page, ['input[type="email"]'], B.email);
    await fill(page, ['input[name*="city"]'], B.city);
    await fill(page, ['input[type="tel"]'], B.phone);
    await highlight(page, 'form');
  },

  async yellowpages(page) {
    await page.goto('https://www.yellowpages.com/add-listing', { waitUntil:'domcontentloaded' });
    await fill(page, ['input[name*="name"]','input[name*="business"]'], B.name);
    await fill(page, ['input[name*="website"]','input[type="url"]'], B.url);
    await fill(page, ['input[type="email"]'], B.email);
    await fill(page, ['input[name*="city"]'], B.city);
    await fill(page, ['input[type="tel"]','input[name*="phone"]'], B.phone);
    await highlight(page, 'form');
  },

  async ezlocal(page) {
    await page.goto('https://www.ezlocal.com/add-business', { waitUntil:'domcontentloaded' });
    await fill(page, ['input[name*="name"]','input[name*="business"]'], B.name);
    await fill(page, ['input[type="url"]','input[name*="website"]'], B.url);
    await fill(page, ['input[type="email"]'], B.email);
    await fill(page, ['textarea'], B.longDesc);
    await fill(page, ['input[name*="city"]'], B.city);
    await fill(page, ['input[type="tel"]'], B.phone);
    await highlight(page, 'form');
  },

  async '2findlocal'(page) {
    await page.goto('https://www.2findlocal.com/Set/Business/Add', { waitUntil:'domcontentloaded' });
    await fill(page, ['input[name*="name"]','#BusinessName'], B.name);
    await fill(page, ['input[name*="url"]','input[type="url"]','#Website'], B.url);
    await fill(page, ['input[type="email"]','#Email'], B.email);
    await fill(page, ['textarea','#Description'], B.longDesc);
    await fill(page, ['input[name*="city"]','#City'], B.city);
    await fill(page, ['input[type="tel"]','#Phone'], B.phone);
    await highlight(page, 'form');
  },

  async prlog(page) {
    await page.goto('https://www.prlog.org/post/', { waitUntil:'domcontentloaded' });
    const headline = `HomesAndLuxury.com Launches Expert Home Decor and Luxury Lifestyle Blog for 2026`;
    const body     = `HomesAndLuxury.com is proud to announce its position as one of the leading home decor and luxury lifestyle destinations for homeowners and interior design enthusiasts. The website offers comprehensive guides on farmhouse decor, modern luxury living, wall art, gardening, kitchen design, and seasonal decorating. Visit https://homesandluxury.com to explore hundreds of expert articles, product reviews, and design inspiration guides written by a team of interior design specialists with over a decade of combined experience.`;
    await fill(page, ['input[name*="headline"]','input[name*="title"]','#headline'], headline);
    await fill(page, ['textarea[name*="body"]','textarea[name*="content"]','textarea'], body);
    await fill(page, ['input[name*="website"]','input[type="url"]'], B.url);
    await fill(page, ['input[type="email"]'], B.email);
    await fill(page, ['input[name*="name"]'], B.name);
    await fill(page, ['input[name*="city"]'], B.city);
    await fill(page, ['input[name*="country"]'], B.country);
    await highlight(page, 'form');
  },

  async openpr(page) {
    await page.goto('https://www.openpr.com/sign-in.html', { waitUntil:'domcontentloaded' });
    await fill(page, ['input[type="email"]','input[name*="email"]'], B.email);
    await highlight(page, 'form');
  },

  async vocal(page) {
    await page.goto('https://vocal.media/new', { waitUntil:'domcontentloaded' });
    await fill(page, ['input[type="email"]'], B.email);
    await highlight(page, 'form');
  },

  async aboutme(page) {
    await page.goto('https://about.me/signup', { waitUntil:'domcontentloaded' });
    await fill(page, ['input[name*="name"]','input[name*="full"]'], B.name);
    await fill(page, ['input[type="email"]'], B.email);
    await highlight(page, 'form');
  },

  async flipboard(page) {
    await page.goto('https://flipboard.com/signup', { waitUntil:'domcontentloaded' });
    await fill(page, ['input[name*="email"]','input[type="email"]'], B.email);
    await fill(page, ['input[name*="name"]'], B.name);
    await highlight(page, 'form');
  },

  async scoopit(page) {
    await page.goto('https://www.scoop.it/user/registration', { waitUntil:'domcontentloaded' });
    await fill(page, ['input[type="email"]'], B.email);
    await fill(page, ['input[name*="name"]'], B.name);
    await highlight(page, 'form');
  },

  async scribd(page) {
    await page.goto('https://www.scribd.com/signup', { waitUntil:'domcontentloaded' });
    await fill(page, ['input[type="email"]'], B.email);
    await fill(page, ['input[name*="name"]'], B.name);
    await highlight(page, 'form');
  },

  async issuu(page) {
    await page.goto('https://issuu.com/signup', { waitUntil:'domcontentloaded' });
    await fill(page, ['input[type="email"]'], B.email);
    await fill(page, ['input[name*="name"]','input[name*="full"]'], B.name);
    await highlight(page, 'form');
  },

  async px500(page) {
    await page.goto('https://500px.com/signup', { waitUntil:'domcontentloaded' });
    await fill(page, ['input[type="email"]'], B.email);
    await fill(page, ['input[name*="name"]','input[name*="full"]'], B.name);
    await highlight(page, 'form');
  },

  async flickr(page) {
    await page.goto('https://www.flickr.com/signup', { waitUntil:'domcontentloaded' });
    await fill(page, ['input[type="email"]'], B.email);
    await fill(page, ['input[name*="name"]'], B.name);
    await highlight(page, 'form');
  },

  // ── Sites that need manual login first ────────────────────────────────────

  async google(page) {
    await page.goto('https://business.google.com/create', { waitUntil:'domcontentloaded' });
    await showPanel(page, '1. Sign in to your Google account\n2. Click "Add your business to Google"\n3. Script will fill the fields after you log in');
    await waitForUser(page, '[aria-label*="Business name"], input[name*="name"], #input-business-name');
    await fill(page, ['[aria-label*="Business name"]','input[name*="name"]','#input-business-name'], B.name);
    await fill(page, ['[aria-label*="website"]','input[name*="website"]'], B.url);
    await highlight(page, 'form, [role="main"]');
  },

  async yelp(page) {
    await page.goto('https://biz.yelp.com/signup', { waitUntil:'domcontentloaded' });
    await fill(page, ['#email','input[name="email"]','input[type="email"]'], B.email);
    await showPanel(page, 'Enter your password and complete signup.\nScript will fill business details after you verify your account.');
  },

  async bing(page) {
    await page.goto('https://www.bingplaces.com/', { waitUntil:'domcontentloaded' });
    await showPanel(page, 'Click "Sign In" and use your Microsoft account.\nAfter login, script will fill business details.');
    await waitForUser(page, 'input[name*="business"], input[name*="name"], [placeholder*="business"]');
    await fill(page, ['input[name*="business"]','input[name*="name"]','[placeholder*="business"]'], B.name);
    await fill(page, ['input[name*="website"]','input[type="url"]'], B.url);
    await fill(page, ['input[type="email"]'], B.email);
    await fill(page, ['input[name*="city"]'], B.city);
    await fill(page, ['input[type="tel"]'], B.phone);
    await highlight(page, 'form');
  },

  async linkedin(page) {
    await page.goto('https://www.linkedin.com/company/setup/new/', { waitUntil:'domcontentloaded' });
    await showPanel(page, 'Sign in to LinkedIn.\nScript will fill the company name, website and description after login.');
    await waitForUser(page, 'input[id*="name"], input[placeholder*="company"]');
    await fill(page, ['input[id*="name"]','input[placeholder*="Company name"]'], B.name);
    await fill(page, ['input[id*="website"]','input[placeholder*="website"]'], B.url);
    await fill(page, ['input[id*="tagline"]','textarea[placeholder*="tagline"]'], B.shortDesc.slice(0, 120));
    await highlight(page, 'form');
  },

  async facebook(page) {
    await page.goto('https://www.facebook.com/pages/create', { waitUntil:'domcontentloaded' });
    await showPanel(page, 'Sign in to Facebook first.\nScript will fill page name, category and description.');
    await waitForUser(page, 'input[placeholder*="Page name"], input[name*="name"]');
    await fill(page, ['input[placeholder*="Page name"]','input[name*="name"]'], B.name);
    await highlight(page, 'form, [role="main"]');
  },

  async pinterest(page) {
    await page.goto('https://www.pinterest.com/business/create/', { waitUntil:'domcontentloaded' });
    await fill(page, ['input[name="email"]','input[type="email"]'], B.email);
    await fill(page, ['input[name="businessName"]','input[placeholder*="business"]'], B.name);
    await fill(page, ['input[name="websiteUrl"]','input[type="url"]'], B.url);
    await highlight(page, 'form');
  },

  async crunchbase(page) {
    await page.goto('https://www.crunchbase.com/login', { waitUntil:'domcontentloaded' });
    await fill(page, ['input[type="email"]','input[name="email"]'], B.email);
    await showPanel(page, 'Enter your password and sign in.\nThen go to: Organizations > Add new.\nScript will fill the company profile.');
  },

  async tumblr(page) {
    await page.goto('https://www.tumblr.com/register', { waitUntil:'domcontentloaded' });
    await fill(page, ['input[type="email"]','input[name="email"]'], B.email);
    await fill(page, ['input[name*="username"]'], B.name.toLowerCase().replace(/\s+/g,''));
    await highlight(page, 'form');
  },

  async quora(page) {
    await page.goto('https://www.quora.com/profile/edit', { waitUntil:'domcontentloaded' });
    await showPanel(page, 'Sign in to Quora first.\nThen script will fill your bio and website.\n\nFor BACKLINKS: Answer questions about home decor, interior design, luxury homes.\nAdd your site URL naturally in answers.');
    await waitForUser(page, 'textarea[placeholder*="bio"], input[placeholder*="website"]');
    await fill(page, ['textarea[placeholder*="bio"]','[data-testid="bio"]'], `Home decor and interior design specialist at HomesAndLuxury.com. Expert in luxury home styling, farmhouse decor, wall art, and room design ideas. Visit ${B.url} for in-depth guides.`);
    await fill(page, ['input[placeholder*="website"]','input[name*="website"]'], B.url);
    await highlight(page, 'form, main');
  },

  async houzz(page) {
    await page.goto('https://www.houzz.com/ideabooks', { waitUntil:'domcontentloaded' });
    await showPanel(page, 'Sign in or create a free Houzz account.\nAdd your website in your profile bio.\nHouzz is DR 91 — high value backlink.');
  },

};

// ─── HELPER FUNCTIONS ─────────────────────────────────────────────────────────

async function fill(page, selectors, value) {
  if (!value) return;
  for (const sel of selectors) {
    try {
      const el = page.locator(sel).first();
      const count = await el.count();
      if (count > 0) {
        await el.scrollIntoViewIfNeeded({ timeout: 2000 }).catch(() => {});
        await el.fill(value, { timeout: 3000 });
        return true;
      }
    } catch {}
  }
  return false;
}

async function highlight(page, selector) {
  try {
    await page.evaluate((sel) => {
      document.querySelectorAll(sel).forEach(el => {
        const inputs = el.querySelectorAll('input:not([type=hidden]):not([type=submit]):not([type=checkbox]):not([type=radio]), textarea, select');
        inputs.forEach(inp => {
          if (!inp.value) {
            inp.style.outline = '3px solid #FF6B35';
            inp.style.backgroundColor = '#FFF3EE';
          } else {
            inp.style.outline = '2px solid #27AE60';
            inp.style.backgroundColor = '#EAFAF1';
          }
        });
      });
    }, selector);
  } catch {}
}

async function showPanel(page, message) {
  try {
    await page.evaluate((msg) => {
      const existing = document.getElementById('__hal_panel');
      if (existing) existing.remove();
      const div = document.createElement('div');
      div.id = '__hal_panel';
      div.style.cssText = 'position:fixed;top:15px;right:15px;z-index:999999;background:#1B3A5C;color:#fff;padding:16px 20px;border-radius:10px;font-family:Arial,sans-serif;font-size:13px;max-width:320px;line-height:1.6;box-shadow:0 4px 20px rgba(0,0,0,0.4);';
      div.innerHTML = '<div style="font-weight:bold;font-size:14px;margin-bottom:8px;color:#F39C12">🏡 HomesAndLuxury AutoFill</div>' +
                      '<div style="white-space:pre-wrap">' + msg + '</div>' +
                      '<div style="margin-top:10px;font-size:11px;color:#aaa">When done → go back to terminal and press Enter</div>';
      document.body.appendChild(div);
    }, message);
  } catch {}
}

async function waitForUser(page, selector, timeout = 120000) {
  try {
    await page.waitForSelector(selector, { timeout });
  } catch {}
}

async function showSuccess(page, siteName) {
  try {
    await page.evaluate((name) => {
      const div = document.getElementById('__hal_panel');
      if (div) {
        div.style.background = '#0E6655';
        div.innerHTML = '<div style="font-weight:bold;font-size:14px;margin-bottom:6px">✅ ' + name + '</div>' +
                        '<div>Fields filled! Review, solve CAPTCHA if shown, then click Submit.</div>' +
                        '<div style="margin-top:8px;font-size:11px;color:#aaa">Return to terminal → press Enter to continue</div>';
      }
    }, siteName);
  } catch {}
}

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, ans => { rl.close(); resolve(ans.trim()); }));
}

function updateTrackerStatus(siteName, status) {
  try {
    const py = `
import openpyxl, sys
path = r'${path.join(__dirname, 'seo_data', 'backlinks_tracker.xlsx').replace(/\\/g, '\\\\')}'
wb = openpyxl.load_workbook(path)
ws = wb['Backlinks Tracker']
from datetime import datetime
for row in ws.iter_rows(min_row=2):
    if row[2].value and '${siteName}' in str(row[2].value):
        row[8].value = '${status}'
        if '${status}' == 'Submitted': row[1].value = datetime.now().strftime('%Y-%m-%d')
        break
wb.save(path)
print('Tracker updated: ${siteName} -> ${status}')
`;
    execSync(`python -c "${py.replace(/\n/g,'\\n').replace(/"/g,'\\"')}"`, { stdio:'pipe' });
  } catch (e) {
    // Silently continue if tracker update fails
  }
}

// ─── MAIN RUNNER ──────────────────────────────────────────────────────────────

async function runSite(siteId) {
  const site = SITES.find(s => s.id === siteId);
  if (!site) { console.log(`Unknown site: ${siteId}`); return; }

  console.log(`\n${'─'.repeat(55)}`);
  console.log(`  Opening: ${site.name} (Tier ${site.tier})`);
  console.log(`  Note: ${site.note}`);
  console.log(`${'─'.repeat(55)}`);

  const browser = await chromium.launch({
    headless : false,
    args     : ['--start-maximized', '--disable-blink-features=AutomationControlled'],
  });

  const context = await browser.newContext({
    viewport             : null,
    userAgent            : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    ignoreHTTPSErrors    : true,
  });

  const page = await context.newPage();

  // Inject floating business info panel on every navigation
  await context.addInitScript((binfo) => {
    window.__HAL_BINFO = binfo;
  }, B);

  try {
    const handler = HANDLERS[siteId] || HANDLERS[siteId.replace('-','')];

    if (handler) {
      await handler(page);
      await showSuccess(page, site.name);
    } else {
      // Generic handler for sites without specific handler
      await page.goto(site.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await fill(page, ['input[name*="name"]','input[name*="company"]','input[name*="business"]'], B.name);
      await fill(page, ['input[type="url"]','input[name*="website"]','input[name*="url"]'], B.url);
      await fill(page, ['input[type="email"]','input[name*="email"]'], B.email);
      await fill(page, ['textarea','input[name*="desc"]'], B.longDesc);
      await fill(page, ['input[name*="city"]'], B.city);
      await fill(page, ['input[type="tel"]','input[name*="phone"]'], B.phone);
      await highlight(page, 'form');
      await showSuccess(page, site.name);
    }

    console.log(`\n  ✅ Fields filled for ${site.name}`);
    console.log(`  In the browser: review fields, solve CAPTCHA, click Submit`);
    const ans = await ask(`\n  Press Enter when done (or type 'skip' to skip): `);

    if (ans.toLowerCase() !== 'skip') {
      updateTrackerStatus(site.name, 'Submitted');
      console.log(`  ✅ Logged as Submitted in backlinks_tracker.xlsx`);
    }

  } catch (e) {
    console.log(`  ⚠️  Error on ${site.name}: ${e.message}`);
    console.log(`  The browser is still open — complete manually if needed.`);
    await ask(`  Press Enter to continue... `);
  }

  await browser.close();
}

async function showMenu(tier) {
  const filtered = tier ? SITES.filter(s => s.tier === tier) : SITES;

  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║   HOMESANDLUXURY — BACKLINK AUTO-FILLER               ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log('  Each site opens in Chrome, fields are filled for you.');
  console.log('  You only: solve CAPTCHA + click Submit.\n');

  const tiers = [...new Set(filtered.map(s => s.tier))];
  for (const t of tiers) {
    console.log(`  TIER ${t}:`);
    filtered.filter(s => s.tier === t).forEach((s, i) => {
      const globalIdx = SITES.indexOf(s) + 1;
      console.log(`   [${String(globalIdx).padStart(2)}] ${s.name.padEnd(28)} ${s.note.slice(0, 45)}`);
    });
    console.log('');
  }

  console.log('  [A]  Run ALL sites one by one');
  console.log('  [1]  Run all Tier 1 (Directories)');
  console.log('  [2]  Run all Tier 2 (High-DA Profiles)');
  console.log('  [3-9] Run all sites in that tier\n');

  const ans = await ask('  Enter number, letter, or site ID: ');

  if (ans.toUpperCase() === 'A') {
    for (const site of filtered) {
      await runSite(site.id);
    }
  } else if (/^\d$/.test(ans) && parseInt(ans) >= 1 && parseInt(ans) <= 9) {
    for (const site of SITES.filter(s => s.tier === parseInt(ans))) {
      await runSite(site.id);
    }
  } else if (/^\d+$/.test(ans)) {
    const idx = parseInt(ans) - 1;
    if (SITES[idx]) await runSite(SITES[idx].id);
  } else {
    const found = SITES.find(s => s.id === ans.toLowerCase());
    if (found) await runSite(found.id);
    else console.log('  Not found. Run again and try a different input.');
  }
}

// ─── ENTRY POINT ──────────────────────────────────────────────────────────────
(async () => {
  // Verify missing business info
  if (!B.email || B.email === '') {
    console.log('\n⚠️  SETUP NEEDED: Add your contact info to .env first:');
    console.log('   CONTACT_EMAIL=your@email.com');
    console.log('   CONTACT_PHONE=+1234567890');
    console.log('   CONTACT_CITY=YourCity');
    console.log('   CONTACT_COUNTRY=YourCountry\n');
    process.exit(1);
  }

  const args    = process.argv.slice(2);
  const siteArg = args.find(a => a.startsWith('--site='))?.replace('--site=', '');
  const tierArg = args.find(a => a.startsWith('--tier='))?.replace('--tier=', '');

  if (siteArg) {
    await runSite(siteArg);
  } else if (tierArg) {
    for (const site of SITES.filter(s => s.tier === parseInt(tierArg))) {
      await runSite(site.id);
    }
  } else {
    await showMenu(tierArg ? parseInt(tierArg) : null);
  }

  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║   Session complete. Check backlinks_tracker.xlsx      ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');
})();
