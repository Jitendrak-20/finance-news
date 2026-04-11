(function () {
  function adminHeaders() {
    const password = window.localStorage.getItem("pulseiq_admin_password");
    return password ? { "x-admin-password": password } : {};
  }

  async function request(path, options = {}) {
    const response = await fetch(path, {
      headers: {
        "Content-Type": "application/json",
        ...adminHeaders(),
        ...(options.headers || {})
      },
      ...options
    });

    if (!response.ok) {
      let message = `Request failed: ${response.status}`;
      try {
        const data = await response.json();
        if (data && data.error) message = data.error;
      } catch (error) {
        // Keep default message when body is not JSON.
      }
      throw new Error(message);
    }

    const contentType = response.headers.get("content-type") || "";
    return contentType.includes("application/json") ? response.json() : response.text();
  }

  window.PulseIQ = {
    setAdminPassword(password) {
      window.localStorage.setItem("pulseiq_admin_password", password);
    },
    clearAdminPassword() {
      window.localStorage.removeItem("pulseiq_admin_password");
    },
    hasAdminPassword() {
      return Boolean(window.localStorage.getItem("pulseiq_admin_password"));
    },
    async ensureState() {
      return request("/api/health");
    },
    async resetState() {
      return request("/api/reset", { method: "POST" });
    },
    async fetchNews() {
      return request("/api/jobs/fetch", { method: "POST" });
    },
    async generateDrafts() {
      return request("/api/jobs/generate", { method: "POST" });
    },
    async runPublishingPipeline() {
      return request("/api/jobs/pipeline", { method: "POST" });
    },
    async updateArticle(id, fields) {
      return request(`/api/article?id=${encodeURIComponent(id)}`, {
        method: "PUT",
        body: JSON.stringify(fields)
      });
    },
    async publishArticle(id) {
      return request(`/api/article-action?id=${encodeURIComponent(id)}&action=publish`, { method: "POST" });
    },
    async rejectArticle(id) {
      return request(`/api/article-action?id=${encodeURIComponent(id)}&action=reject`, { method: "POST" });
    },
    async forcePublishArticle(id) {
      return request(`/api/article-action?id=${encodeURIComponent(id)}&action=force-publish`, { method: "POST" });
    },
    async retryImage(id) {
      return request(`/api/article-action?id=${encodeURIComponent(id)}&action=retry-image`, { method: "POST" });
    },
    async getArticleBySlug(slug) {
      return request(`/api/article?slug=${encodeURIComponent(slug)}`);
    },
    async getPublishedArticles(category) {
      const params = new URLSearchParams({ status: "published" });
      if (category) params.set("category", category);
      return request(`/api/articles?${params.toString()}`);
    },
    async getDraftArticles() {
      return request("/api/articles?status=draft");
    },
    async getRawQueue() {
      return request("/api/raw-queue");
    },
    async getDashboard() {
      return request("/api/dashboard");
    },
    categoryMeta(category) {
      const map = {
        "share-market": { label: "Share Market", path: "share-market.html" },
        ipo: { label: "IPO", path: "ipo.html" },
        "financial-news": { label: "Financial News", path: "financial-news.html" },
        "global-markets": { label: "Global Markets", path: "global-markets.html" },
        crypto: { label: "Crypto", path: "financial-news.html" }
      };
      return map[category] || map["financial-news"];
    },
    slugify(input) {
      return String(input)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80);
    }
  };
})();
