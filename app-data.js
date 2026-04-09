(function () {
  async function request(path, options = {}) {
    const response = await fetch(path, {
      headers: {
        "Content-Type": "application/json",
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
    async updateArticle(id, fields) {
      return request(`/api/articles/${id}`, {
        method: "PUT",
        body: JSON.stringify(fields)
      });
    },
    async publishArticle(id) {
      return request(`/api/articles/${id}/publish`, { method: "POST" });
    },
    async rejectArticle(id) {
      return request(`/api/articles/${id}/reject`, { method: "POST" });
    },
    async getArticleBySlug(slug) {
      return request(`/api/articles/${encodeURIComponent(slug)}`);
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
