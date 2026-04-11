function formatDate(value) {
  if (!value) return "Not published";
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function articleCard(article) {
  const meta = PulseIQ.categoryMeta(article.category);
  const keywords = (article.seo_description || article.excerpt || "")
    .split(/[\s,]+/)
    .filter((word) => word.length > 5)
    .slice(0, 4);
  return `
    <article class="story-card">
      <img class="story-image" src="${article.image ? article.image.image_url : article.image_url}" alt="${escapeHtml(article.title)}">
      <div class="story-copy">
        <p class="story-tag">${meta.label}</p>
        <h3><a class="headline-link" href="article.html?slug=${encodeURIComponent(article.slug)}">${escapeHtml(article.title)}</a></h3>
        <p>${escapeHtml(article.excerpt)}</p>
        <div class="story-meta">
          <span>${formatDate(article.published_at)}</span>
          <span>${estimateReadTime(article)} min read</span>
        </div>
        <div class="keyword-row">${keywords.map((keyword) => `<span>${escapeHtml(keyword)}</span>`).join("")}</div>
        <a class="text-link" href="article.html?slug=${encodeURIComponent(article.slug)}">Read article</a>
      </div>
    </article>
  `;
}

function estimateReadTime(article) {
  const text = String(article.body_html || article.excerpt || "").replace(/<[^>]+>/g, " ").trim();
  const words = text ? text.split(/\s+/).length : 0;
  return Math.max(2, Math.round(words / 220));
}

function leadCard(article) {
  const meta = PulseIQ.categoryMeta(article.category);
  return `
    <article class="lead-card">
      <img class="lead-image" src="${article.image ? article.image.image_url : article.image_url}" alt="${escapeHtml(article.title)}">
      <div class="lead-copy">
        <p class="story-tag">${meta.label}</p>
        <h3><a class="headline-link" href="article.html?slug=${encodeURIComponent(article.slug)}">${escapeHtml(article.title)}</a></h3>
        <p>${escapeHtml(article.excerpt)}</p>
        <div class="story-meta">
          <span>Published ${formatDate(article.published_at)}</span>
          <span>${estimateReadTime(article)} min read</span>
        </div>
        <a class="text-link" href="article.html?slug=${encodeURIComponent(article.slug)}">Open full story</a>
      </div>
    </article>
  `;
}

function headlineItem(article) {
  const meta = PulseIQ.categoryMeta(article.category);
  return `
    <article class="headline-item">
      <div>
        <p class="story-tag">${meta.label}</p>
        <h3><a class="headline-link" href="article.html?slug=${encodeURIComponent(article.slug)}">${escapeHtml(article.title)}</a></h3>
      </div>
      <div class="headline-meta">
        <span>${formatDate(article.published_at)}</span>
        <span>${estimateReadTime(article)} min read</span>
      </div>
    </article>
  `;
}

function analysisItem(article) {
  return `
    <article class="analysis-item">
      <p class="story-tag">Analysis</p>
      <h3><a class="headline-link" href="article.html?slug=${encodeURIComponent(article.slug)}">${escapeHtml(article.title)}</a></h3>
      <p>${escapeHtml(article.excerpt)}</p>
      <div class="story-meta">
        <span>${PulseIQ.categoryMeta(article.category).label}</span>
        <span>${estimateReadTime(article)} min read</span>
      </div>
    </article>
  `;
}

function latestStoryItem(article) {
  return `
    <article class="latest-story-item">
      <div>
        <h3><a class="headline-link" href="article.html?slug=${encodeURIComponent(article.slug)}">${escapeHtml(article.title)}</a></h3>
        <p>${escapeHtml(article.excerpt)}</p>
      </div>
      <div class="headline-meta">
        <span>${PulseIQ.categoryMeta(article.category).label}</span>
        <span>${formatDate(article.published_at)}</span>
      </div>
    </article>
  `;
}

function stockActionBlock(published) {
  const list = published.slice(0, 5);
  return list
    .map(
      (article, index) => `
        <article class="market-action-item">
          <div class="market-action-rank">${index + 1}</div>
          <div>
            <p class="story-tag">${PulseIQ.categoryMeta(article.category).label}</p>
            <h3><a class="headline-link" href="article.html?slug=${encodeURIComponent(article.slug)}">${escapeHtml(article.title)}</a></h3>
            <div class="story-meta">
              <span>${formatDate(article.published_at)}</span>
              <span>${estimateReadTime(article)} min read</span>
            </div>
          </div>
        </article>
      `
    )
    .join("");
}

function relatedStoryItem(article) {
  return `
    <article class="related-item">
      <p class="story-tag">${PulseIQ.categoryMeta(article.category).label}</p>
      <h3><a class="headline-link" href="article.html?slug=${encodeURIComponent(article.slug)}">${escapeHtml(article.title)}</a></h3>
      <div class="story-meta">
        <span>${formatDate(article.published_at)}</span>
        <span>${estimateReadTime(article)} min read</span>
      </div>
    </article>
  `;
}

function marketBoard(metrics, published) {
  const latest = published.slice(0, 4);
  const blocks = [
    ["Share Market", published.filter((item) => item.category === "share-market").length],
    ["IPO Watch", published.filter((item) => item.category === "ipo").length],
    ["Financial News", published.filter((item) => item.category === "financial-news").length],
    ["Global Markets", published.filter((item) => item.category === "global-markets").length]
  ];

  return `
    <div class="market-board-grid">
      ${blocks
        .map(
          ([label, value]) => `
            <article class="market-tile">
              <span>${label}</span>
              <strong>${value}</strong>
            </article>
          `
        )
        .join("")}
    </div>
    <div class="market-list">
      ${latest
        .map(
          (article) => `
            <div class="market-row">
              <span>${escapeHtml(PulseIQ.categoryMeta(article.category).label)}</span>
              <strong><a class="headline-link" href="article.html?slug=${encodeURIComponent(article.slug)}">${escapeHtml(article.title)}</a></strong>
            </div>
          `
        )
        .join("")}
    </div>
  `;
}

function sourceListItem(source) {
  return `
    <article class="mini-card">
      <p class="mini-label">${escapeHtml(source.source_type.toUpperCase())}</p>
      <h3>${escapeHtml(source.name)}</h3>
      <p>${escapeHtml(source.domain)}</p>
    </article>
  `;
}

function shareIcon(kind) {
  const icons = {
    whatsapp: `
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 3.5A11.4 11.4 0 0 0 2.9 17.2L1.5 22.5l5.4-1.4A11.4 11.4 0 1 0 20.5 3.5Zm-8.6 17a9.3 9.3 0 0 1-4.7-1.3l-.3-.2-3.2.8.9-3.1-.2-.3a9.3 9.3 0 1 1 7.5 4.1Zm5.1-6.9c-.3-.2-1.8-.9-2-.9-.3-.1-.4-.1-.6.2l-.9 1c-.1.2-.3.2-.5.1a7.7 7.7 0 0 1-3.8-3.4c-.1-.2 0-.4.1-.5l.4-.5.3-.5c.1-.1.1-.3 0-.5l-.9-2.1c-.2-.4-.4-.3-.6-.3h-.5c-.2 0-.5.1-.7.4s-1 1-1 2.3 1 2.7 1.1 2.9a10.5 10.5 0 0 0 4.1 3.8c2.5 1 2.5.7 3 .7s1.8-.7 2.1-1.3.3-1.2.2-1.3c-.1-.1-.3-.2-.6-.4Z"/></svg>`,
    x: `
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.9 2H22l-6.8 7.8L23 22h-6.2l-4.9-6.4L6.3 22H3.2l7.3-8.4L1 2h6.4l4.4 5.9L18.9 2Zm-1.1 18h1.7L6.3 3.9H4.5L17.8 20Z"/></svg>`,
    linkedin: `
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.9 8.3H3.6V20h3.3V8.3ZM5.3 2.9A1.9 1.9 0 1 0 5.3 6.7 1.9 1.9 0 0 0 5.3 2.9ZM20.4 12.7c0-3.5-1.9-5.1-4.4-5.1-2 0-2.9 1.1-3.4 1.9V8.3H9.3c0 .8 0 11.7 0 11.7h3.3v-6.5c0-.3 0-.7.1-.9.2-.7.8-1.5 1.8-1.5 1.3 0 1.9 1 1.9 2.5V20h3.3v-7.3Z"/></svg>`,
    telegram: `
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21.4 4.6 18.2 20c-.2 1.1-.8 1.3-1.6.8l-5-3.7-2.4 2.3c-.3.3-.5.5-1 .5l.4-5.1 9.3-8.4c.4-.4-.1-.6-.6-.2L5.8 13.4.9 11.9c-1.1-.3-1.1-1 .2-1.5l19-7.3c.9-.3 1.6.2 1.3 1.5Z"/></svg>`,
    copy: `
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 1H6a2 2 0 0 0-2 2v12h2V3h10V1Zm3 4H10a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Zm0 16H10V7h9v14Z"/></svg>`,
    share: `
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 16a3 3 0 0 0-2.4 1.2l-6.8-3.4a3 3 0 0 0 0-1.6l6.8-3.4A3 3 0 1 0 15 7a3 3 0 0 0 .1.8L8.3 11.2a3 3 0 1 0 0 1.6l6.8 3.4A3 3 0 1 0 18 16Z"/></svg>`
  };
  return icons[kind] || "";
}

function jobItem(job) {
  const meta = Object.entries(job.meta_json || {})
    .map(([key, value]) => `<span><strong>${escapeHtml(key)}:</strong> ${escapeHtml(value)}</span>`)
    .join("");

  return `
    <article class="job-card">
      <div class="job-head">
        <h3>${escapeHtml(job.job_type)}</h3>
        <span class="status-pill status-${escapeHtml(job.status)}">${escapeHtml(job.status)}</span>
      </div>
      <p>${formatDate(job.started_at)}</p>
      <div class="job-meta">${meta}</div>
    </article>
  `;
}

function setError(target, error) {
  if (target) target.innerHTML = `<p class="empty-state">${escapeHtml(error.message || String(error))}</p>`;
}

async function renderHomePage() {
  if (document.body.dataset.page !== "home") return;
  const storyContainer = document.querySelector("[data-published-list]");
  const leadContainer = document.querySelector("[data-home-lead]");
  const headlineContainer = document.querySelector("[data-headline-list]");
  const marketContainer = document.querySelector("[data-market-board]");
  const stockActionContainer = document.querySelector("[data-stock-action]");
  const analysisContainer = document.querySelector("[data-analysis-list]");
  const latestStoriesContainer = document.querySelector("[data-latest-stories]");

  try {
    const dashboard = await PulseIQ.getDashboard();

    if (storyContainer) {
      storyContainer.innerHTML = dashboard.published.length
        ? dashboard.published.slice(0, 4).map(articleCard).join("")
        : `<p class="empty-state">No published articles yet.</p>`;
    }

    if (leadContainer) {
      leadContainer.innerHTML = dashboard.published.length
        ? leadCard(dashboard.published[0])
        : `<p class="empty-state">No lead story available.</p>`;
    }

    if (headlineContainer) {
      headlineContainer.innerHTML = dashboard.published.length
        ? dashboard.published.slice(0, 6).map(headlineItem).join("")
        : `<p class="empty-state">No headlines available.</p>`;
    }

    if (marketContainer) {
      marketContainer.innerHTML = marketBoard(dashboard.metrics, dashboard.published);
    }

    if (stockActionContainer) {
      stockActionContainer.innerHTML = dashboard.published.length
        ? stockActionBlock(dashboard.published)
        : `<p class="empty-state">No stock action items available.</p>`;
    }

    if (analysisContainer) {
      analysisContainer.innerHTML = dashboard.published.length
        ? dashboard.published.slice(0, 3).map(analysisItem).join("")
        : `<p class="empty-state">No analysis items available.</p>`;
    }

    if (latestStoriesContainer) {
      latestStoriesContainer.innerHTML = dashboard.published.length
        ? dashboard.published.slice(0, 5).map(latestStoryItem).join("")
        : `<p class="empty-state">No latest stories available.</p>`;
    }
  } catch (error) {
    setError(storyContainer, error);
    setError(leadContainer, error);
    setError(headlineContainer, error);
    setError(marketContainer, error);
    setError(stockActionContainer, error);
    setError(analysisContainer, error);
    setError(latestStoriesContainer, error);
  }
}

function bindContactPage() {
  if (document.body.dataset.page !== "contact") return;

  const form = document.querySelector("[data-contact-form]");
  const statusBox = document.querySelector("[data-contact-status]");
  if (!form || !statusBox) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const endpoint = document.body.dataset.formEndpoint;
    if (!endpoint) {
      statusBox.innerHTML = "<p>Add your Google Apps Script web app URL to the <strong>data-form-endpoint</strong> attribute in contact.html before using the contact form.</p>";
      return;
    }

    const formData = new FormData(form);
    const payload = {
      name: String(formData.get("name") || ""),
      email: String(formData.get("email") || ""),
      subject: String(formData.get("subject") || ""),
      message: String(formData.get("message") || ""),
      submitted_at: new Date().toISOString()
    };

    statusBox.innerHTML = "<p>Submitting your query...</p>";

    try {
      const encoded = new URLSearchParams(payload);
      await fetch(endpoint, {
        method: "POST",
        mode: "no-cors",
        body: encoded
      });
      form.reset();
      statusBox.innerHTML = "<p>Your query has been submitted. Check your Google Sheet for the new entry.</p>";
    } catch (error) {
      statusBox.innerHTML = `<p>${escapeHtml(error.message || "Unable to submit the form right now.")}</p>`;
    }
  });
}

async function renderCategoryPage() {
  const page = document.body.dataset.page;
  const category = document.body.dataset.category;
  if (page !== "category" || !category) return;

  const meta = PulseIQ.categoryMeta(category);
  const titleEl = document.querySelector("[data-category-title]");
  const introEl = document.querySelector("[data-category-intro]");
  const listEl = document.querySelector("[data-category-list]");

  const intros = {
    "share-market": "Daily coverage of market movers, sector shifts, benchmark tone, and headline context for retail readers.",
    ipo: "Track listings, subscription signals, disclosure updates, and issue sentiment without scanning multiple portals.",
    "financial-news": "Policy, regulation, results, and broader finance stories with clearer summaries and source-backed context.",
    "global-markets": "Bond yields, commodities, central banks, and global moves that reshape local market expectations."
  };

  if (titleEl) titleEl.textContent = meta.label;
  if (introEl) introEl.textContent = intros[category] || "";

  try {
    const articles = await PulseIQ.getPublishedArticles(category);
    if (listEl) {
      listEl.innerHTML = articles.length
        ? articles.map(headlineItem).join("")
        : `<p class="empty-state">No published stories in this category yet.</p>`;
    }
  } catch (error) {
    setError(listEl, error);
  }
}

async function renderArticlePage() {
  if (document.body.dataset.page !== "article") return;
  const slug = new URLSearchParams(window.location.search).get("slug");
  const shell = document.querySelector("[data-article-shell]");
  if (!shell) return;

  shell.innerHTML = `
    <section class="article-loader" aria-live="polite">
      <div class="loader-spinner" aria-hidden="true"></div>
      <p>Loading article...</p>
    </section>
  `;

  function renderFallbackStories(stories, message) {
    shell.innerHTML = `
      <section class="page-hero narrow">
        <p class="eyebrow">Article Not Available</p>
        <h1>This story is unavailable in the current deployment.</h1>
        <p class="page-intro">${escapeHtml(message)}</p>
      </section>
      <section class="section">
        <div class="section-heading compact">
          <p class="eyebrow">Latest Published Stories</p>
          <h2>Continue with the latest available market coverage.</h2>
        </div>
        <div class="story-grid">
          ${stories.length ? stories.map(articleCard).join("") : `<p class="empty-state">No published stories are available right now.</p>`}
        </div>
      </section>
    `;
  }

  try {
    let publishedArticles = [];
    try {
      publishedArticles = await PulseIQ.getPublishedArticles();
    } catch (error) {
      renderFallbackStories([], "The article service is temporarily unavailable. Please try another story shortly.");
      return;
    }

    const article = slug
      ? publishedArticles.find((item) => item.slug === slug)
      : publishedArticles[0] || null;

    if (!article || article.status !== "published") {
      renderFallbackStories(
        publishedArticles.slice(0, 4),
        "The requested story may be unpublished, removed, or unavailable in the current deployment state."
      );
      return;
    }

    document.title = `${article.seo_title}`;
    const descriptionMeta = document.querySelector('meta[name="description"]');
    if (descriptionMeta) descriptionMeta.setAttribute("content", article.seo_description);
    const related = publishedArticles
      .filter((item) => item.slug !== article.slug)
      .slice(0, 4);
    const sourceNames = article.source_links.map((item) => item.source_name).join(", ");
    const shareUrl = `${window.location.origin}/article.html?slug=${encodeURIComponent(article.slug)}`;
    const shareText = `${article.title} | PulseIQ`;

    shell.innerHTML = `
      <section class="article-topline">
        <p class="article-breadcrumb">Home / ${escapeHtml(PulseIQ.categoryMeta(article.category).label)} / Latest Story</p>
        <div class="article-topline-grid">
          <div class="article-mainhead">
            <p class="eyebrow">${PulseIQ.categoryMeta(article.category).label}</p>
            <h1>${escapeHtml(article.title)}</h1>
            <p class="article-deck">${escapeHtml(article.excerpt)}</p>
            <div class="article-meta-bar">
              <span>PulseIQ Markets Desk</span>
              <span>${formatDate(article.published_at)}</span>
              <span>${estimateReadTime(article)} min read</span>
              <span>Sources: ${escapeHtml(sourceNames)}</span>
            </div>
            <div class="keyword-row">${(article.seo_description || article.excerpt || "")
              .split(/[\s,]+/)
              .filter((word) => word.length > 5)
              .slice(0, 8)
              .map((word) => `<span>${escapeHtml(word)}</span>`)
              .join("")}</div>
          </div>
          <img class="article-hero-image" src="${article.image ? article.image.image_url : article.image_url}" alt="${escapeHtml(article.title)}">
        </div>
      </section>

      <section class="article-layout article-layout-new">
        <article class="article-column">
          <div class="article-body article-body-new">
            ${article.body_html}
          </div>

          <section class="related-stories">
            <div class="section-heading compact">
              <p class="eyebrow">Related Stories</p>
              <h2>More market reads</h2>
            </div>
            <div class="related-grid">
              ${related.map(relatedStoryItem).join("")}
            </div>
          </section>

          <section class="social-strip">
            <div class="section-heading compact">
              <p class="eyebrow">Share This Story</p>
              <h2>Follow and share PulseIQ.</h2>
            </div>
            <div class="share-row social-share-row">
              <button class="share-button share-whatsapp" type="button" data-share="whatsapp" data-share-url="${escapeHtml(shareUrl)}" data-share-text="${escapeHtml(shareText)}">
                ${shareIcon("whatsapp")}
                <span>Share on WhatsApp</span>
              </button>
              <button class="share-button share-x" type="button" data-share="x" data-share-url="${escapeHtml(shareUrl)}" data-share-text="${escapeHtml(shareText)}">
                ${shareIcon("x")}
                <span>Post on X</span>
              </button>
              <button class="share-button share-linkedin" type="button" data-share="linkedin" data-share-url="${escapeHtml(shareUrl)}">
                ${shareIcon("linkedin")}
                <span>Share on LinkedIn</span>
              </button>
              <button class="share-button share-telegram" type="button" data-share="telegram" data-share-url="${escapeHtml(shareUrl)}" data-share-text="${escapeHtml(shareText)}">
                ${shareIcon("telegram")}
                <span>Share on Telegram</span>
              </button>
            </div>
            <div class="social-links">
              <a class="social-link" href="https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}" target="_blank" rel="noopener noreferrer">WhatsApp</a>
              <a class="social-link" href="https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}" target="_blank" rel="noopener noreferrer">X</a>
              <a class="social-link" href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}" target="_blank" rel="noopener noreferrer">LinkedIn</a>
              <a class="social-link" href="https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}" target="_blank" rel="noopener noreferrer">Telegram</a>
            </div>
          </section>
        </article>

        <aside class="article-sidebar">
          <div class="mini-card sidebar-card">
            <p class="mini-label">Sources</p>
            ${article.source_links
              .map(
                (source) => `
                  <div class="source-block">
                    <p><strong>${escapeHtml(source.source_name)}</strong></p>
                    <p>${escapeHtml(source.attribution_text)}</p>
                    <a class="text-link" href="${source.source_url}">Original source link</a>
                  </div>
                `
              )
              .join("")}
          </div>
          <div class="mini-card sidebar-card">
            <p class="mini-label">Story Snapshot</p>
            <div class="sidebar-points">
              <p><strong>Category:</strong> ${escapeHtml(PulseIQ.categoryMeta(article.category).label)}</p>
              <p><strong>Format:</strong> summary, context, and related reads</p>
              <p><strong>Read time:</strong> ${estimateReadTime(article)} min</p>
              <p><strong>Focus:</strong> market relevance and reader clarity</p>
            </div>
          </div>
        </aside>
      </section>
    `;
  } catch (error) {
    renderFallbackStories([], "The article could not be loaded right now.");
  }
}

function bindShareActions() {
  document.addEventListener("click", async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const button = target.closest("[data-share]");
    if (!(button instanceof HTMLElement)) return;

    const type = button.dataset.share;
    const shareUrl = button.dataset.shareUrl || window.location.href;
    const shareText = button.dataset.shareText || document.title;

    try {
      if (type === "whatsapp") {
        const url = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
        window.open(url, "_blank", "noopener,noreferrer");
        return;
      }

      if (type === "x") {
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        window.open(url, "_blank", "noopener,noreferrer");
        return;
      }

      if (type === "linkedin") {
        const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
        window.open(url, "_blank", "noopener,noreferrer");
        return;
      }

      if (type === "telegram") {
        const url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
        window.open(url, "_blank", "noopener,noreferrer");
        return;
      }

      if (type === "copy") {
        await navigator.clipboard.writeText(shareUrl);
        button.querySelector("span").textContent = "Copied";
        window.setTimeout(() => {
          const label = button.querySelector("span");
          if (label) label.textContent = "Copy Link";
        }, 1600);
        return;
      }

      if (type === "native") {
        if (navigator.share) {
          await navigator.share({ title: shareText, url: shareUrl });
          return;
        }
        await navigator.clipboard.writeText(shareUrl);
        button.querySelector("span").textContent = "Copied";
        window.setTimeout(() => {
          const label = button.querySelector("span");
          if (label) label.textContent = "Share";
        }, 1600);
      }
    } catch (error) {
      // Ignore aborted native share actions.
    }
  });
}

function bindAdminPage() {
  if (document.body.dataset.page !== "admin") return;

  const protectedShell = document.querySelectorAll("[data-admin-shell]");
  const gate = document.querySelector("[data-admin-gate]");
  const loginForm = document.querySelector("[data-admin-login-form]");
  const loginStatus = document.querySelector("[data-admin-login-status]");
  const rawContainer = document.querySelector("[data-raw-queue]");
  const draftContainer = document.querySelector("[data-admin-drafts]");
  const jobContainer = document.querySelector("[data-admin-jobs]");
  const form = document.querySelector("[data-editor-form]");
  const metrics = document.querySelector("[data-admin-metrics]");
  const validationBox = document.querySelector("[data-validation-box]");
  const batchStatus = document.querySelector("[data-batch-status]");
  const autoBatchStorageKey = "pulseiq_auto_batch_enabled";
  let autoBatchTimer = 0;
  let autoBatchRunning = false;
  let adminUnlocked = false;

  function selectedDraftId() {
    return form ? form.dataset.articleId : "";
  }

  function setAdminVisibility(unlocked) {
    adminUnlocked = unlocked;
    if (gate) gate.hidden = unlocked;
    protectedShell.forEach((element) => {
      element.hidden = !unlocked;
    });
  }

  function isAutoBatchEnabled() {
    return window.localStorage.getItem(autoBatchStorageKey) === "1";
  }

  function setAutoBatchEnabled(next) {
    if (next) {
      window.localStorage.setItem(autoBatchStorageKey, "1");
    } else {
      window.localStorage.removeItem(autoBatchStorageKey);
    }
  }

  function nextQuarterHourDate(from = new Date()) {
    const next = new Date(from);
    next.setSeconds(0, 0);
    const minutes = next.getMinutes();
    const rounded = Math.ceil((minutes + 1) / 15) * 15;
    if (rounded >= 60) {
      next.setHours(next.getHours() + 1, 0, 0, 0);
    } else {
      next.setMinutes(rounded, 0, 0);
    }
    return next;
  }

  function renderBatchStatus(message, details = {}) {
    const toggleButton = document.querySelector("[data-action='toggle-auto-batch']");
    if (toggleButton) {
      toggleButton.textContent = isAutoBatchEnabled() ? "Disable Auto Batch" : "Enable Auto Batch";
    }

    if (!batchStatus) return;

    const lines = [`<p>${escapeHtml(message)}</p>`];
    if (details.nextRunAt) {
      lines.push(`<p><strong>Next run:</strong> ${escapeHtml(formatDate(details.nextRunAt))}</p>`);
    }
    if (details.lastRunAt) {
      lines.push(`<p><strong>Last run:</strong> ${escapeHtml(formatDate(details.lastRunAt))}</p>`);
    }
    if (details.generatedCount != null || details.publishedCount != null) {
      lines.push(
        `<p><strong>Last batch:</strong> generated ${escapeHtml(details.generatedCount ?? 0)} draft(s), force-published ${escapeHtml(details.publishedCount ?? 0)} article(s).</p>`
      );
    }
    if (details.mode) {
      lines.push(`<p><strong>Mode:</strong> ${escapeHtml(details.mode)}</p>`);
    }
    batchStatus.innerHTML = lines.join("");
  }

  function scheduleNextAutoBatch() {
    window.clearTimeout(autoBatchTimer);
    if (!adminUnlocked) return;
    if (!isAutoBatchEnabled()) {
      renderBatchStatus("Auto batch is off.", { mode: "Manual only" });
      return;
    }
    const nextRun = nextQuarterHourDate();
    const delay = Math.max(1000, nextRun.getTime() - Date.now());
    renderBatchStatus("Auto batch is armed and waiting for the next quarter-hour slot.", {
      nextRunAt: nextRun.toISOString(),
      mode: "Runs while this admin tab stays open"
    });
    autoBatchTimer = window.setTimeout(() => {
      void runPipeline("Scheduled quarter-hour batch");
    }, delay);
  }

  async function runPipeline(triggerLabel) {
    if (autoBatchRunning) return;
    autoBatchRunning = true;
    renderBatchStatus(`${triggerLabel} is running. Waiting for fetch, generate, retry image, and force publish to complete.`, {
      mode: isAutoBatchEnabled() ? "Auto batch enabled" : "Manual run"
    });

    try {
      const result = await PulseIQ.runPublishingPipeline();
      await render();
      const summary = result.summary || {};
      renderBatchStatus(`${triggerLabel} completed.`, {
        lastRunAt: summary.completed_at || new Date().toISOString(),
        nextRunAt: isAutoBatchEnabled() ? (summary.next_run_at || nextQuarterHourDate().toISOString()) : "",
        generatedCount: summary.generated_count ?? 0,
        publishedCount: summary.force_published_count ?? 0,
        mode: isAutoBatchEnabled() ? "Auto batch enabled" : "Manual run"
      });
    } catch (error) {
      renderBatchStatus(error.message || "Batch run failed.", {
        nextRunAt: isAutoBatchEnabled() ? nextQuarterHourDate().toISOString() : "",
        mode: isAutoBatchEnabled() ? "Auto batch enabled" : "Manual run"
      });
      setError(jobContainer, error);
    } finally {
      autoBatchRunning = false;
      if (isAutoBatchEnabled()) {
        scheduleNextAutoBatch();
      }
    }
  }

  function openEditor(article) {
    if (!form) return;
    form.dataset.articleId = article.id;
    form.querySelector('[name="title"]').value = article.title;
    form.querySelector('[name="excerpt"]').value = article.excerpt;
    form.querySelector('[name="body_html"]').value = article.body_html;
    if (validationBox) {
      const validation = article.validation || { status: "unknown", issues: [] };
      validationBox.innerHTML = `
        <p class="mini-label">Validation</p>
        <p><strong>Status:</strong> ${escapeHtml(validation.status)}</p>
        ${
          validation.issues && validation.issues.length
            ? `<ul>${validation.issues.map((issue) => `<li>${escapeHtml(issue)}</li>`).join("")}</ul>`
            : "<p>No validation issues.</p>"
        }
      `;
    }
  }

  async function render() {
    try {
      const state = await PulseIQ.getDashboard();

      if (metrics) {
        metrics.innerHTML = `
          <article><strong>${state.metrics.source_count}</strong><span>active sources</span></article>
          <article><strong>${state.metrics.pending_raw_count}</strong><span>pending raw items</span></article>
          <article><strong>${state.metrics.draft_count}</strong><span>drafts in review</span></article>
        `;
      }

      if (rawContainer) {
        rawContainer.innerHTML = state.rawQueue.length
          ? state.rawQueue
              .map(
                (item) => `
                  <article class="queue-card">
                    <div class="job-head">
                      <h3>${escapeHtml(item.original_title)}</h3>
                      <span class="status-pill">Score ${item.score}</span>
                    </div>
                    <p>${escapeHtml(item.raw_summary)}</p>
                    <div class="story-meta">
                      <span>${escapeHtml(item.source ? item.source.name : "Unknown source")}</span>
                      <span>${PulseIQ.categoryMeta(item.category).label}</span>
                    </div>
                  </article>
                `
              )
              .join("")
          : `<p class="empty-state">Raw queue is empty. Run fetch to add items.</p>`;
      }

      if (draftContainer) {
        draftContainer.innerHTML = state.drafts.length
          ? state.drafts
              .map(
                (article) => `
                  <article class="queue-card ${selectedDraftId() === article.id ? "is-selected" : ""}">
                    <div class="job-head">
                      <h3>${escapeHtml(article.title)}</h3>
                      <span class="status-pill">Score ${article.score}</span>
                    </div>
                    <p>${escapeHtml(article.excerpt)}</p>
                    <div class="story-meta">
                      <span>${PulseIQ.categoryMeta(article.category).label}</span>
                      <span>Status ${article.status}</span>
                    </div>
                    <div class="admin-actions">
                      <button class="button button-secondary" data-edit-id="${article.id}" type="button">Edit</button>
                      <button class="button button-secondary" data-retry-image-id="${article.id}" type="button">Retry Image</button>
                      <button class="button button-primary" data-publish-id="${article.id}" type="button">Publish</button>
                      <button class="button button-secondary" data-force-publish-id="${article.id}" type="button">Force Publish</button>
                      <button class="button button-danger" data-reject-id="${article.id}" type="button">Reject</button>
                    </div>
                  </article>
                `
              )
              .join("")
          : `<p class="empty-state">No drafts waiting for review.</p>`;
      }

      if (jobContainer) {
        jobContainer.innerHTML = state.jobs.slice(0, 6).map(jobItem).join("");
      }

      if (form && !selectedDraftId() && state.drafts[0]) {
        openEditor(state.drafts[0]);
      }
    } catch (error) {
      setError(rawContainer, error);
      setError(draftContainer, error);
      setError(jobContainer, error);
      setError(metrics, error);
      throw error;
    }
  }

  async function unlockAdmin(password) {
    if (loginStatus) {
      loginStatus.innerHTML = "<p>Verifying admin access...</p>";
    }

    PulseIQ.setAdminPassword(password);

    try {
      await render();
      setAdminVisibility(true);
      scheduleNextAutoBatch();
      if (loginStatus) {
        loginStatus.innerHTML = "<p>Access granted.</p>";
      }
      return true;
    } catch (error) {
      PulseIQ.clearAdminPassword();
      setAdminVisibility(false);
      window.clearTimeout(autoBatchTimer);
      if (loginStatus) {
        loginStatus.innerHTML = `<p>${escapeHtml(error.message || "Unable to verify admin access.")}</p>`;
      }
      return false;
    }
  }

  document.addEventListener("click", async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (!adminUnlocked) return;

    try {
      if (target.matches("[data-action='fetch']")) {
        await PulseIQ.fetchNews();
        await render();
      }

      if (target.matches("[data-action='generate']")) {
        await PulseIQ.generateDrafts();
        await render();
      }

      if (target.matches("[data-action='pipeline']")) {
        await runPipeline("Manual batch");
      }

      if (target.matches("[data-action='toggle-auto-batch']")) {
        setAutoBatchEnabled(!isAutoBatchEnabled());
        scheduleNextAutoBatch();
      }

      if (target.matches("[data-action='reset']")) {
        await PulseIQ.resetState();
        if (form) form.dataset.articleId = "";
        await render();
      }

      if (target.matches("[data-edit-id]")) {
        const drafts = await PulseIQ.getDraftArticles();
        const next = drafts.find((article) => article.id === target.dataset.editId);
        if (next) openEditor(next);
        await render();
      }

      if (target.matches("[data-publish-id]")) {
        await PulseIQ.publishArticle(target.dataset.publishId);
        if (selectedDraftId() === target.dataset.publishId && form) form.dataset.articleId = "";
        await render();
      }

      if (target.matches("[data-force-publish-id]")) {
        await PulseIQ.forcePublishArticle(target.dataset.forcePublishId);
        if (selectedDraftId() === target.dataset.forcePublishId && form) form.dataset.articleId = "";
        await render();
      }

      if (target.matches("[data-retry-image-id]")) {
        await PulseIQ.retryImage(target.dataset.retryImageId);
        await render();
      }

      if (target.matches("[data-reject-id]")) {
        await PulseIQ.rejectArticle(target.dataset.rejectId);
        if (selectedDraftId() === target.dataset.rejectId && form) form.dataset.articleId = "";
        await render();
      }
    } catch (error) {
      setError(jobContainer, error);
    }
  });

  if (form) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const articleId = selectedDraftId();
      if (!articleId) return;
      const formData = new FormData(form);
      try {
        await PulseIQ.updateArticle(articleId, {
          title: formData.get("title"),
          excerpt: formData.get("excerpt"),
          body_html: formData.get("body_html"),
          seo_title: `${formData.get("title")} | PulseIQ`,
          seo_description: formData.get("excerpt")
        });
        await render();
      } catch (error) {
        setError(jobContainer, error);
      }
    });
  }

  if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(loginForm);
      const password = String(formData.get("password") || "");
      if (!password) return;
      const unlocked = await unlockAdmin(password);
      if (unlocked) {
        loginForm.reset();
      }
    });
  }

  setAdminVisibility(false);
  if (PulseIQ.hasAdminPassword()) {
    void unlockAdmin(window.localStorage.getItem("pulseiq_admin_password") || "");
  }
}

function setActiveNav() {
  const current = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll("[data-nav]").forEach((link) => {
    if (link.getAttribute("href") === current) {
      link.classList.add("is-current");
    }
  });
}

function addReveal() {
  const revealTargets = document.querySelectorAll(".section, .story-card, .mini-card, .queue-card, .article-hero");
  revealTargets.forEach((element) => element.setAttribute("data-reveal", ""));
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );
  revealTargets.forEach((target) => observer.observe(target));
}

async function init() {
  setActiveNav();
  addReveal();
  try {
    await PulseIQ.ensureState();
  } catch (error) {
    // Surface individual page errors through render functions below.
  }
  await renderHomePage();
  await renderCategoryPage();
  await renderArticlePage();
  bindAdminPage();
  bindContactPage();
  bindShareActions();
}

init();
