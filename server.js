const http = require("http");
const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const DB_PATH = path.join(DATA_DIR, "db.json");

loadEnv();
const PORT = Number(process.env.PORT || 3000);
const BASE_URL = process.env.BASE_URL || `http://127.0.0.1:${PORT}`;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml"
};

const SOURCE_SEED = [
  {
    id: "src-moneycontrol",
    name: "Moneycontrol Markets",
    domain: "moneycontrol.com",
    feed_url: "https://www.moneycontrol.com/rss/business.xml",
    feed_urls: [
      "https://www.moneycontrol.com/rss/business.xml",
      "https://news.google.com/rss/search?q=site%3Amoneycontrol.com%20stock%20market&hl=en-IN&gl=IN&ceid=IN%3Aen"
    ],
    source_type: "rss",
    active: true
  },
  {
    id: "src-et",
    name: "Economic Times Markets",
    domain: "economictimes.indiatimes.com",
    feed_url: "https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms",
    feed_urls: [
      "https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms",
      "https://news.google.com/rss/search?q=site%3Aeconomictimes.indiatimes.com%20markets&hl=en-IN&gl=IN&ceid=IN%3Aen"
    ],
    source_type: "rss",
    active: true
  },
  {
    id: "src-livemint",
    name: "Mint Markets",
    domain: "livemint.com",
    feed_url: "https://www.livemint.com/rss/markets",
    feed_urls: [
      "https://www.livemint.com/rss/markets",
      "https://news.google.com/rss/search?q=site%3Alivemint.com%20markets&hl=en-IN&gl=IN&ceid=IN%3Aen"
    ],
    source_type: "rss",
    active: true
  },
  {
    id: "src-yahoo",
    name: "Yahoo Finance World",
    domain: "finance.yahoo.com",
    feed_url: "https://finance.yahoo.com/news/rssindex",
    feed_urls: [
      "https://finance.yahoo.com/news/rssindex",
      "https://news.google.com/rss/search?q=site%3Afinance.yahoo.com%20markets&hl=en-US&gl=US&ceid=US%3Aen"
    ],
    source_type: "rss",
    active: true
  }
];

function loadEnv() {
  const envPath = path.join(ROOT, ".env");
  try {
    const raw = require("fs").readFileSync(envPath, "utf8");
    raw.split(/\r?\n/).forEach((line) => {
      if (!line || line.trim().startsWith("#")) return;
      const idx = line.indexOf("=");
      if (idx === -1) return;
      const key = line.slice(0, idx).trim();
      const value = line.slice(idx + 1).trim();
      if (key && !(key in process.env)) process.env[key] = value;
    });
  } catch (error) {
    // Ignore when .env is not present.
  }
}

function createId(prefix) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function slugify(input) {
  return String(input)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function titleHash(title) {
  return slugify(String(title).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim());
}

function categoryMeta(category) {
  const map = {
    "share-market": { label: "Share Market" },
    ipo: { label: "IPO" },
    "financial-news": { label: "Financial News" },
    "global-markets": { label: "Global Markets" },
    crypto: { label: "Crypto" }
  };
  return map[category] || map["financial-news"];
}

function inferCategory(rawArticle) {
  const text = `${rawArticle.original_title} ${rawArticle.raw_summary || ""}`.toLowerCase();
  if (text.includes("ipo") || text.includes("listing")) return "ipo";
  if (text.includes("global") || text.includes("yield") || text.includes("oil")) return "global-markets";
  if (text.includes("rbi") || text.includes("policy") || text.includes("inflation") || text.includes("sebi")) {
    return "financial-news";
  }
  return "share-market";
}

function scoreRawArticle(rawArticle) {
  const title = (rawArticle.original_title || "").toLowerCase();
  let score = 55;
  [
    ["rbi", 18],
    ["ipo", 16],
    ["inflation", 14],
    ["bond", 12],
    ["bank", 10],
    ["policy", 12],
    ["sebi", 14],
    ["market", 10],
    ["yields", 10],
    ["results", 8]
  ].forEach(([word, value]) => {
    if (title.includes(word)) score += value;
  });
  return Math.min(score, 96);
}

function imageForCategory(category) {
  const map = {
    "share-market": "https://images.pexels.com/photos/210607/pexels-photo-210607.jpeg",
    ipo: "https://images.pexels.com/photos/6801648/pexels-photo-6801648.jpeg",
    "financial-news": "https://images.pexels.com/photos/4386366/pexels-photo-4386366.jpeg",
    "global-markets": "https://images.pexels.com/photos/730547/pexels-photo-730547.jpeg"
  };
  return map[category] || map["financial-news"];
}

function createJob(jobType, status, metaJson = {}) {
  const now = new Date().toISOString();
  return {
    id: createId("job"),
    job_type: jobType,
    status,
    started_at: now,
    ended_at: now,
    meta_json: metaJson
  };
}

function createBody(title, rawArticle) {
  return [
    `<p>${escapeHtml(rawArticle.raw_summary || "")} PulseIQ reframes the source into a neutral update with clear context and visible attribution.</p>`,
    `<p>${escapeHtml(title)} matters because it can change how retail readers interpret near-term market positioning, policy signals, or sector sentiment. The goal is clarity, not prediction or advice.</p>`,
    "<h2>Why this matters</h2>",
    "<ul><li>It turns a complex headline into a simpler market explanation.</li><li>It keeps the original source visible and traceable.</li><li>It avoids unsupported claims, price targets, and promotional language.</li></ul>"
  ].join("");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function hydrateArticle(article, state) {
  return {
    ...article,
    source_links: state.article_sources.filter((item) => item.article_id === article.id),
    image: state.images.find((item) => item.article_id === article.id) || null,
    raw_article: state.raw_articles.find((item) => item.id === article.raw_article_id) || null
  };
}

function buildInitialState() {
  const rawArticles = [
    {
      id: "raw-1",
      source_id: "src-moneycontrol",
      external_id: "mc-rbi-policy-001",
      original_title: "RBI holds rates, says inflation path needs continued monitoring",
      original_url: "https://example.com/rbi-holds-rates",
      raw_summary: "The central bank kept rates unchanged while signalling a cautious stance on inflation and liquidity.",
      raw_content: "Reserve Bank commentary pointed to inflation vigilance, steady liquidity management, and selective sector watchfulness.",
      published_at: "2026-04-09T06:30:00.000Z",
      fetched_at: "2026-04-09T06:45:00.000Z",
      hash: "rbi-holds-rates"
    },
    {
      id: "raw-2",
      source_id: "src-et",
      external_id: "et-ipo-demand-001",
      original_title: "Mid-cap IPO sees solid retail subscription in first session",
      original_url: "https://example.com/midcap-ipo-demand",
      raw_summary: "Retail demand came in strongly on day one, with HNI activity expected to build later.",
      raw_content: "Primary market interest remains firm, though valuation sensitivity is still shaping institutional appetite.",
      published_at: "2026-04-09T05:10:00.000Z",
      fetched_at: "2026-04-09T05:25:00.000Z",
      hash: "mid-cap-ipo-retail-subscription"
    },
    {
      id: "raw-3",
      source_id: "src-yahoo",
      external_id: "yf-global-yields-001",
      original_title: "Global equities wobble as bond yields push higher",
      original_url: "https://example.com/global-equities-yields",
      raw_summary: "Rising yields pressured risk assets and renewed focus on central bank messaging.",
      raw_content: "Investors reassessed risk positioning as sovereign yields moved up and rate expectations were repriced.",
      published_at: "2026-04-08T20:00:00.000Z",
      fetched_at: "2026-04-08T20:20:00.000Z",
      hash: "global-equities-bond-yields"
    },
    {
      id: "raw-4",
      source_id: "src-livemint",
      external_id: "mint-bank-rally-001",
      original_title: "Banking shares lift benchmark indices after early softness",
      original_url: "https://example.com/banking-shares-lift-indices",
      raw_summary: "Private lenders and large financials supported a late-session recovery in domestic benchmarks.",
      raw_content: "Market breadth stayed mixed, but heavyweight financial names drove index stabilization.",
      published_at: "2026-04-08T11:20:00.000Z",
      fetched_at: "2026-04-08T11:35:00.000Z",
      hash: "banking-shares-lift-indices"
    }
  ];

  const state = {
    sources: SOURCE_SEED,
    raw_articles: rawArticles,
    articles: [],
    article_sources: [],
    images: [],
    jobs: []
  };

  [
    {
      id: "art-1",
      raw: rawArticles[0],
      category: "financial-news",
      title: "RBI pause keeps markets focused on inflation signals",
      excerpt: "The central bank held rates steady, leaving investors focused on what its language implies for banks, credit, and market positioning.",
      status: "published",
      score: 89,
      published_at: "2026-04-09T07:30:00.000Z"
    },
    {
      id: "art-2",
      raw: rawArticles[1],
      category: "ipo",
      title: "Retail appetite gives this IPO an early momentum signal",
      excerpt: "Strong first-day participation suggests healthy retail interest, but later demand quality will still shape the listing narrative.",
      status: "published",
      score: 82,
      published_at: "2026-04-09T08:15:00.000Z"
    },
    {
      id: "art-3",
      raw: rawArticles[2],
      category: "global-markets",
      title: "Higher bond yields test global market confidence",
      excerpt: "The latest rise in yields is pressuring risk assets and forcing investors to re-evaluate how durable global optimism really is.",
      status: "published",
      score: 84,
      published_at: "2026-04-08T21:00:00.000Z"
    },
    {
      id: "art-4",
      raw: rawArticles[3],
      category: "share-market",
      title: "Bank stocks steady the market after a weak start",
      excerpt: "A rebound in financial heavyweights helped domestic benchmarks recover, even as broader participation remained uneven.",
      status: "draft",
      score: 78,
      published_at: null
    }
  ].forEach((item) => {
    const category = item.category;
    const article = {
      id: item.id,
      raw_article_id: item.raw.id,
      slug: slugify(item.title),
      title: item.title,
      excerpt: item.excerpt,
      body_html: createBody(item.title, item.raw),
      category,
      image_url: imageForCategory(category),
      seo_title: `${item.title} | PulseIQ`,
      seo_description: item.excerpt,
      status: item.status,
      score: item.score,
      published_at: item.published_at,
      created_at: new Date().toISOString()
    };
    state.articles.push(article);
    const source = SOURCE_SEED.find((entry) => entry.id === item.raw.source_id);
    state.article_sources.push({
      id: createId("as"),
      article_id: article.id,
      source_name: source ? source.name : "Unknown Source",
      source_url: item.raw.original_url,
      attribution_text: `Source-backed summary based on reporting from ${source ? source.name : "the original source"}.`
    });
    state.images.push({
      id: createId("img"),
      article_id: article.id,
      provider: "Pexels",
      image_url: article.image_url,
      alt_text: `${categoryMeta(category).label} visual for ${item.title}`,
      credit_text: "Demo image reference via Pexels-style placeholder URL"
    });
  });

  state.jobs.push(createJob("fetch", "success", { fetched_count: 4, deduped_count: 0 }));
  state.jobs.push(createJob("generate", "success", { generated_count: 1, published_count: 3 }));
  return state;
}

async function ensureDb() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DB_PATH);
  } catch (error) {
    await fs.writeFile(DB_PATH, JSON.stringify(buildInitialState(), null, 2), "utf8");
  }
}

async function readDb() {
  await ensureDb();
  const raw = await fs.readFile(DB_PATH, "utf8");
  return migrateState(JSON.parse(raw));
}

function migrateState(state) {
  const sourceMap = new Map(SOURCE_SEED.map((source) => [source.id, source]));
  state.sources = (state.sources || []).map((source) => ({
    ...(sourceMap.get(source.id) || {}),
    ...source,
    feed_urls: (sourceMap.get(source.id) || {}).feed_urls || source.feed_urls || [source.feed_url].filter(Boolean)
  }));
  return state;
}

async function syncStateToSupabase(state) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) return;

  const base = `${supabaseUrl.replace(/\/$/, "")}/rest/v1`;
  const tables = [
    ["sources", state.sources],
    ["raw_articles", state.raw_articles],
    ["articles", state.articles],
    ["article_sources", state.article_sources],
    ["images", state.images],
    ["jobs", state.jobs]
  ];

  for (const [table, rows] of tables) {
    const response = await fetch(`${base}/${table}?on_conflict=id`, {
      method: "POST",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates"
      },
      body: JSON.stringify(rows)
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Supabase sync failed for ${table}: ${text}`);
    }
  }
}

async function writeDb(state) {
  await fs.writeFile(DB_PATH, JSON.stringify(state, null, 2), "utf8");
  try {
    await syncStateToSupabase(state);
  } catch (error) {
    console.error(error.message);
  }
  return state;
}

function decodeXmlEntities(text) {
  return String(text || "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function extractTag(block, tagName) {
  const match = block.match(new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i"));
  return match ? decodeXmlEntities(match[1].trim()) : "";
}

function parseRssItems(xml) {
  return [...xml.matchAll(/<item\b[\s\S]*?>([\s\S]*?)<\/item>/gi)].map((match) => {
    const block = match[1];
    return {
      title: extractTag(block, "title"),
      link: extractTag(block, "link"),
      description: extractTag(block, "description"),
      pubDate: extractTag(block, "pubDate"),
      guid: extractTag(block, "guid")
    };
  });
}

async function fetchRssItemsForSource(source) {
  const candidates = Array.isArray(source.feed_urls) && source.feed_urls.length ? source.feed_urls : [source.feed_url];
  const failures = [];

  for (const feedUrl of candidates) {
    const response = await fetch(feedUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; PulseIQBot/1.0; +https://pulseiq.example.com)",
        Accept: "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8"
      }
    });

    if (!response.ok) {
      failures.push(`${feedUrl} -> ${response.status}`);
      continue;
    }

    const xml = await response.text();
    const items = parseRssItems(xml).slice(0, 8).map((item) => ({
      source_id: source.id,
      external_id: item.guid || item.link || titleHash(item.title),
      original_title: item.title,
      original_url: item.link,
      raw_summary: item.description.replace(/<[^>]+>/g, "").trim(),
      raw_content: item.description.replace(/<[^>]+>/g, "").trim(),
      published_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString()
    }));

    if (items.length) return items;
    failures.push(`${feedUrl} -> empty feed`);
  }

  throw new Error(`Failed to fetch ${source.name}: ${failures.join("; ")}`);
}

async function fetchImageForArticle(article) {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) return imageForCategory(article.category);

  const query = encodeURIComponent(`${article.category} finance market`);
  const response = await fetch(`https://api.pexels.com/v1/search?query=${query}&per_page=1`, {
    headers: {
      Authorization: apiKey
    }
  });
  if (!response.ok) return imageForCategory(article.category);
  const data = await response.json();
  return data.photos && data.photos[0] ? data.photos[0].src.large : imageForCategory(article.category);
}

async function generateWithOpenRouter(rawArticle, category) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || "openai/gpt-4.1-mini";
  if (!apiKey) return null;

  const prompt = [
    "You are a financial news editor. Produce an original, neutral summary.",
    "Write JSON with keys: title, excerpt, body_html, seo_title, seo_description.",
    "Constraints: source-grounded, no fabricated facts, no advice language, no copied phrasing when avoidable.",
    `Category: ${category}`,
    `Source title: ${rawArticle.original_title}`,
    `Source excerpt: ${rawArticle.raw_summary}`,
    `Source content: ${rawArticle.raw_content}`
  ].join("\n");

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      response_format: { type: "json_object" },
      messages: [
        { role: "user", content: prompt }
      ]
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenRouter generation failed: ${text}`);
  }

  const data = await response.json();
  const content = data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content : "";
  return JSON.parse(content);
}

async function buildArticleFromRaw(rawArticle, state) {
  const category = inferCategory(rawArticle);
  const source = state.sources.find((item) => item.id === rawArticle.source_id);
  let generated = null;

  try {
    generated = await generateWithOpenRouter(rawArticle, category);
  } catch (error) {
    console.error(error.message);
  }

  const title = generated && generated.title ? generated.title : rawArticle.original_title;
  const excerpt = generated && generated.excerpt
    ? generated.excerpt
    : `${rawArticle.raw_summary} PulseIQ adds context, keeps attribution visible, and avoids advice-style language.`;
  const bodyHtml = generated && generated.body_html ? generated.body_html : createBody(title, rawArticle);
  const articleId = createId("art");
  const imageUrl = await fetchImageForArticle({ category });

  const article = {
    id: articleId,
    raw_article_id: rawArticle.id,
    slug: slugify(title),
    title,
    excerpt,
    body_html: bodyHtml,
    category,
    image_url: imageUrl,
    seo_title: generated && generated.seo_title ? generated.seo_title : `${title} | ${categoryMeta(category).label} | PulseIQ`,
    seo_description: generated && generated.seo_description ? generated.seo_description : excerpt,
    status: "draft",
    score: scoreRawArticle(rawArticle),
    published_at: null,
    created_at: new Date().toISOString()
  };

  const articleSource = {
    id: createId("as"),
    article_id: articleId,
    source_name: source ? source.name : "Unknown Source",
    source_url: rawArticle.original_url,
    attribution_text: `Source-backed summary based on reporting from ${source ? source.name : "the original source"}.`
  };

  const image = {
    id: createId("img"),
    article_id: articleId,
    provider: process.env.PEXELS_API_KEY ? "Pexels" : "Fallback",
    image_url: imageUrl,
    alt_text: `${categoryMeta(category).label} visual for ${title}`,
    credit_text: process.env.PEXELS_API_KEY ? "Fetched via Pexels API" : "Fallback category image"
  };

  return { article, articleSource, image };
}

function getRawQueue(state) {
  const usedRawIds = new Set(state.articles.map((item) => item.raw_article_id));
  return state.raw_articles
    .filter((item) => !usedRawIds.has(item.id))
    .sort((a, b) => scoreRawArticle(b) - scoreRawArticle(a))
    .map((item) => ({
      ...item,
      score: scoreRawArticle(item),
      source: state.sources.find((source) => source.id === item.source_id) || null,
      category: inferCategory(item)
    }));
}

async function handleFetchJob(state) {
  const existingHashes = new Set(state.raw_articles.map((item) => item.hash));
  let fetchedCount = 0;
  let dedupedCount = 0;
  const errors = [];

  for (const source of state.sources.filter((item) => item.active)) {
    try {
      const items = await fetchRssItemsForSource(source);
      items.forEach((entry) => {
        const hash = titleHash(entry.original_title);
        if (!entry.original_title || !entry.original_url || existingHashes.has(hash)) {
          dedupedCount += 1;
          return;
        }
        existingHashes.add(hash);
        fetchedCount += 1;
        state.raw_articles.unshift({
          id: createId("raw"),
          source_id: entry.source_id,
          external_id: entry.external_id,
          original_title: entry.original_title,
          original_url: entry.original_url,
          raw_summary: entry.raw_summary,
          raw_content: entry.raw_content,
          published_at: entry.published_at,
          fetched_at: new Date().toISOString(),
          hash
        });
      });
    } catch (error) {
      errors.push(error.message);
    }
  }

  state.jobs.unshift(createJob(errors.length ? "fetch-partial" : "fetch", errors.length ? "partial" : "success", {
    fetched_count: fetchedCount,
    deduped_count: dedupedCount,
    errors
  }));

  return state;
}

async function handleGenerateJob(state) {
  const queue = getRawQueue(state).slice(0, 2);
  const built = [];
  for (const rawArticle of queue) {
    const next = await buildArticleFromRaw(rawArticle, state);
    state.articles.unshift(next.article);
    state.article_sources.unshift(next.articleSource);
    state.images.unshift(next.image);
    built.push(next.article.id);
  }
  state.jobs.unshift(createJob("generate", "success", { generated_count: built.length, article_ids: built }));
  return state;
}

function getDashboard(state) {
  const published = state.articles
    .filter((item) => item.status === "published")
    .sort((a, b) => String(b.published_at || "").localeCompare(String(a.published_at || "")))
    .map((item) => hydrateArticle(item, state));

  const drafts = state.articles
    .filter((item) => item.status === "draft")
    .sort((a, b) => b.score - a.score)
    .map((item) => hydrateArticle(item, state));

  return {
    sources: state.sources,
    jobs: state.jobs,
    metrics: {
      source_count: state.sources.filter((item) => item.active).length,
      raw_count: state.raw_articles.length,
      pending_raw_count: getRawQueue(state).length,
      draft_count: drafts.length,
      published_count: published.length,
      rejected_count: state.articles.filter((item) => item.status === "rejected").length
    },
    published,
    drafts,
    rawQueue: getRawQueue(state)
  };
}

async function jsonBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

async function serveStatic(req, res, pathname) {
  if (pathname === "/robots.txt") {
    res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    res.end(`User-agent: *\nAllow: /\n\nSitemap: ${BASE_URL}/sitemap.xml\n`);
    return;
  }

  if (pathname === "/sitemap.xml") {
    const state = await readDb();
    const articleUrls = state.articles
      .filter((item) => item.status === "published")
      .map((item) => `  <url>\n    <loc>${BASE_URL}/article.html?slug=${encodeURIComponent(item.slug)}</loc>\n  </url>`)
      .join("\n");
    const content = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>${BASE_URL}/</loc>\n  </url>\n  <url>\n    <loc>${BASE_URL}/share-market.html</loc>\n  </url>\n  <url>\n    <loc>${BASE_URL}/ipo.html</loc>\n  </url>\n  <url>\n    <loc>${BASE_URL}/financial-news.html</loc>\n  </url>\n  <url>\n    <loc>${BASE_URL}/global-markets.html</loc>\n  </url>\n${articleUrls}\n</urlset>\n`;
    res.writeHead(200, { "Content-Type": "application/xml; charset=utf-8" });
    res.end(content);
    return;
  }

  const safePath = pathname === "/" ? "/index.html" : pathname;
  const filePath = path.resolve(ROOT, `.${safePath}`);
  if (!filePath.startsWith(ROOT)) {
    sendJson(res, 403, { error: "Forbidden" });
    return;
  }

  try {
    const stat = await fs.stat(filePath);
    if (stat.isDirectory()) {
      return serveStatic(req, res, path.join(safePath, "index.html"));
    }
    const ext = path.extname(filePath).toLowerCase();
    const content = await fs.readFile(filePath);
    res.writeHead(200, { "Content-Type": MIME_TYPES[ext] || "application/octet-stream" });
    res.end(content);
  } catch (error) {
    sendJson(res, 404, { error: "Not found" });
  }
}

async function handleApi(req, res, url) {
  const pathname = url.pathname;
  const state = await readDb();

  if (req.method === "GET" && pathname === "/api/health") {
    return sendJson(res, 200, {
      ok: true,
      now: new Date().toISOString(),
      storage: DB_PATH,
      supabase_sync: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
    });
  }

  if (req.method === "GET" && pathname === "/api/dashboard") {
    return sendJson(res, 200, getDashboard(state));
  }

  if (req.method === "GET" && pathname === "/api/sources") {
    return sendJson(res, 200, state.sources);
  }

  if (req.method === "GET" && pathname === "/api/raw-queue") {
    return sendJson(res, 200, getRawQueue(state));
  }

  if (req.method === "GET" && pathname === "/api/articles") {
    const status = url.searchParams.get("status");
    const category = url.searchParams.get("category");
    const articles = state.articles
      .filter((item) => !status || item.status === status)
      .filter((item) => !category || item.category === category)
      .sort((a, b) => {
        if (status === "draft") return b.score - a.score;
        return String(b.published_at || "").localeCompare(String(a.published_at || ""));
      })
      .map((item) => hydrateArticle(item, state));
    return sendJson(res, 200, articles);
  }

  if (req.method === "GET" && pathname.startsWith("/api/articles/")) {
    const slug = decodeURIComponent(pathname.replace("/api/articles/", ""));
    const article = state.articles.find((item) => item.slug === slug);
    if (!article) return sendJson(res, 404, { error: "Article not found" });
    return sendJson(res, 200, hydrateArticle(article, state));
  }

  if (req.method === "POST" && pathname === "/api/jobs/fetch") {
    const nextState = await handleFetchJob(state);
    await writeDb(nextState);
    return sendJson(res, 200, { ok: true, job: nextState.jobs[0] });
  }

  if (req.method === "POST" && pathname === "/api/jobs/generate") {
    const nextState = await handleGenerateJob(state);
    await writeDb(nextState);
    return sendJson(res, 200, { ok: true, job: nextState.jobs[0] });
  }

  if (req.method === "POST" && pathname === "/api/reset") {
    const nextState = buildInitialState();
    await writeDb(nextState);
    return sendJson(res, 200, { ok: true });
  }

  const updateMatch = pathname.match(/^\/api\/articles\/([^/]+)$/);
  const actionMatch = pathname.match(/^\/api\/articles\/([^/]+)\/(publish|reject)$/);

  if (req.method === "PUT" && updateMatch) {
    const articleId = decodeURIComponent(updateMatch[1]);
    const article = state.articles.find((item) => item.id === articleId);
    if (!article) return sendJson(res, 404, { error: "Article not found" });
    const body = await jsonBody(req);
    Object.assign(article, {
      title: body.title ?? article.title,
      excerpt: body.excerpt ?? article.excerpt,
      body_html: body.body_html ?? article.body_html,
      seo_title: body.seo_title ?? article.seo_title,
      seo_description: body.seo_description ?? article.seo_description
    });
    state.jobs.unshift(createJob("edit", "success", { article_id: article.id }));
    await writeDb(state);
    return sendJson(res, 200, hydrateArticle(article, state));
  }

  if (req.method === "POST" && actionMatch) {
    const articleId = decodeURIComponent(actionMatch[1]);
    const action = actionMatch[2];
    const article = state.articles.find((item) => item.id === articleId);
    if (!article) return sendJson(res, 404, { error: "Article not found" });
    if (action === "publish") {
      article.status = "published";
      article.published_at = article.published_at || new Date().toISOString();
    }
    if (action === "reject") {
      article.status = "rejected";
    }
    state.jobs.unshift(createJob(action, "success", { article_id: article.id }));
    await writeDb(state);
    return sendJson(res, 200, hydrateArticle(article, state));
  }

  return sendJson(res, 404, { error: "API route not found" });
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname.startsWith("/api/")) {
      return await handleApi(req, res, url);
    }
    return await serveStatic(req, res, url.pathname);
  } catch (error) {
    console.error(error);
    return sendJson(res, 500, { error: "Internal server error" });
  }
});

ensureDb()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`PulseIQ server running at http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
