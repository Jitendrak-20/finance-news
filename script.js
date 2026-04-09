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
  return `
    <article class="story-card">
      <img class="story-image" src="${article.image ? article.image.image_url : article.image_url}" alt="${escapeHtml(article.title)}">
      <div class="story-copy">
        <p class="story-tag">${meta.label}</p>
        <h3>${escapeHtml(article.title)}</h3>
        <p>${escapeHtml(article.excerpt)}</p>
        <div class="story-meta">
          <span>Score ${article.score}</span>
          <span>${formatDate(article.published_at)}</span>
        </div>
        <a class="text-link" href="article.html?slug=${encodeURIComponent(article.slug)}">Read article</a>
      </div>
    </article>
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
  const metricContainer = document.querySelector("[data-home-metrics]");
  const sourceContainer = document.querySelector("[data-source-list]");
  const storyContainer = document.querySelector("[data-published-list]");
  const jobContainer = document.querySelector("[data-job-list]");
  const draftContainer = document.querySelector("[data-draft-preview]");

  try {
    const dashboard = await PulseIQ.getDashboard();
    const metrics = dashboard.metrics;

    if (metricContainer) {
      metricContainer.innerHTML = `
        <article><strong>${metrics.published_count}</strong><span>published stories</span></article>
        <article><strong>${metrics.draft_count}</strong><span>drafts awaiting review</span></article>
        <article><strong>${metrics.pending_raw_count}</strong><span>raw items not processed yet</span></article>
      `;
    }

    if (sourceContainer) {
      sourceContainer.innerHTML = dashboard.sources.map(sourceListItem).join("");
    }

    if (storyContainer) {
      storyContainer.innerHTML = dashboard.published.length
        ? dashboard.published.slice(0, 3).map(articleCard).join("")
        : `<p class="empty-state">No published articles yet.</p>`;
    }

    if (jobContainer) {
      jobContainer.innerHTML = dashboard.jobs.slice(0, 4).map(jobItem).join("");
    }

    if (draftContainer) {
      draftContainer.innerHTML = dashboard.drafts.length
        ? dashboard.drafts
            .slice(0, 2)
            .map(
              (article) => `
                <article class="draft-card">
                  <p class="story-tag">${PulseIQ.categoryMeta(article.category).label}</p>
                  <h3>${escapeHtml(article.title)}</h3>
                  <p>${escapeHtml(article.excerpt)}</p>
                  <div class="story-meta">
                    <span>Score ${article.score}</span>
                    <span>Status ${article.status}</span>
                  </div>
                </article>
              `
            )
            .join("")
        : `<p class="empty-state">No drafts pending.</p>`;
    }
  } catch (error) {
    setError(metricContainer, error);
    setError(sourceContainer, error);
    setError(storyContainer, error);
    setError(jobContainer, error);
    setError(draftContainer, error);
  }
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
        ? articles.map(articleCard).join("")
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

  try {
    const article = slug ? await PulseIQ.getArticleBySlug(slug) : null;
    if (!article || article.status !== "published") {
      shell.innerHTML = `
        <section class="page-hero narrow">
          <p class="eyebrow">Article Not Found</p>
          <h1>This article is unavailable.</h1>
          <p class="page-intro">The slug may be incorrect, unpublished, or removed from the current server state.</p>
        </section>
      `;
      return;
    }

    document.title = `${article.seo_title}`;
    const descriptionMeta = document.querySelector('meta[name="description"]');
    if (descriptionMeta) descriptionMeta.setAttribute("content", article.seo_description);

    shell.innerHTML = `
      <section class="article-hero">
        <div>
          <p class="eyebrow">${PulseIQ.categoryMeta(article.category).label}</p>
          <h1>${escapeHtml(article.title)}</h1>
          <p class="page-intro">${escapeHtml(article.excerpt)}</p>
          <div class="story-meta">
            <span>Published ${formatDate(article.published_at)}</span>
            <span>SEO title stored separately</span>
          </div>
        </div>
        <img class="article-hero-image" src="${article.image ? article.image.image_url : article.image_url}" alt="${escapeHtml(article.title)}">
      </section>
      <section class="article-layout">
        <article class="article-body">${article.body_html}</article>
        <aside class="article-sidebar">
          <div class="mini-card">
            <p class="mini-label">Source Attribution</p>
            ${article.source_links
              .map(
                (source) => `
                  <p><strong>${escapeHtml(source.source_name)}</strong></p>
                  <p>${escapeHtml(source.attribution_text)}</p>
                  <a class="text-link" href="${source.source_url}">Original source link</a>
                `
              )
              .join("")}
          </div>
          <div class="mini-card">
            <p class="mini-label">Guardrails</p>
            <p>Original summary structure, neutral tone, no unsupported dates, prices, quotes, or advice language.</p>
          </div>
        </aside>
      </section>
    `;
  } catch (error) {
    setError(shell, error);
  }
}

function bindAdminPage() {
  if (document.body.dataset.page !== "admin") return;

  const rawContainer = document.querySelector("[data-raw-queue]");
  const draftContainer = document.querySelector("[data-admin-drafts]");
  const jobContainer = document.querySelector("[data-admin-jobs]");
  const form = document.querySelector("[data-editor-form]");
  const metrics = document.querySelector("[data-admin-metrics]");
  const validationBox = document.querySelector("[data-validation-box]");

  function selectedDraftId() {
    return form ? form.dataset.articleId : "";
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
    }
  }

  document.addEventListener("click", async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    try {
      if (target.matches("[data-action='fetch']")) {
        await PulseIQ.fetchNews();
        await render();
      }

      if (target.matches("[data-action='generate']")) {
        await PulseIQ.generateDrafts();
        await render();
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

  render();
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
}

init();
