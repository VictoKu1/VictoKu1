/**
 * Article loading and display functionality
 * Handles fetching and rendering Medium articles with error handling and loading states
 */

// Configuration
const CONFIG = {
  MAX_ARTICLES: 6,
  RSS_URL:
    "https://api.rss2json.com/v1/api.json?rss_url=https://medium.com/feed/@victoku1",
  FALLBACK_IMAGE: "media/favicon.ico",
  LOADING_MESSAGE: "Loading articles...",
  ERROR_MESSAGES: {
    NO_ARTICLES: "No articles found.",
    LOAD_ERROR: "Unable to load articles at this time. Please try again later.",
    NETWORK_ERROR: "Network error occurred. Please check your connection.",
  },
  ALLOWED_LINK_PROTOCOLS: new Set(["https:"]),
  ALLOWED_IMAGE_PROTOCOLS: new Set(["https:"]),
};

// Utility functions
const utils = {
  /**
   * Sanitizes and validates URLs
   * @param {string} url - URL to sanitize
   * @returns {string} Sanitized URL or fallback
   */
  sanitizeUrl(url) {
    try {
      const parsed = new URL(url, window.location.origin);
      if (!CONFIG.ALLOWED_LINK_PROTOCOLS.has(parsed.protocol)) {
        return null;
      }
      return parsed.href;
    } catch {
      return null;
    }
  },

  /**
   * Sanitizes image URL and falls back when invalid.
   * @param {string} url - Image URL to validate
   * @returns {string} Safe image URL
   */
  sanitizeImageUrl(url) {
    try {
      const parsed = new URL(url, window.location.origin);
      if (!CONFIG.ALLOWED_IMAGE_PROTOCOLS.has(parsed.protocol)) {
        return CONFIG.FALLBACK_IMAGE;
      }
      return parsed.href;
    } catch {
      return CONFIG.FALLBACK_IMAGE;
    }
  },

  /**
   * Extracts image URL from content
   * @param {string} content - HTML content to parse
   * @returns {string} Image URL or fallback
   */
  extractImageUrl(content) {
    const imgMatch = content.match(/<img[^>]+src=\"([^">]+)\"/);
    return imgMatch ? imgMatch[1] : CONFIG.FALLBACK_IMAGE;
  },

  /**
   * Extracts description from article content
   * @param {Object} item - Article item
   * @returns {string} Description text
   */
  extractDescription(item) {
    const figcaptionMatch = item.description.match(
      /<figcaption[^>]*>(.*?)<\/figcaption>/i
    );
    if (figcaptionMatch && figcaptionMatch[1]) {
      return figcaptionMatch[1];
    }
    return item.excerpt || "Read more...";
  },

  /**
   * Creates HTML for an article card
   * @param {Object} item - Article data
   * @returns {string} HTML string
   */
  createArticleCard(item) {
    const imgSrc = this.sanitizeImageUrl(this.extractImageUrl(item.content));
    const shortDesc = this.extractDescription(item);
    const safeTitle = item.title || "Untitled article";
    const safeLink = this.sanitizeUrl(item.link);
    const safeDesc = shortDesc || "Read more...";

    const card = document.createElement("div");
    card.className = "article-card pro";

    const link = document.createElement("a");
    link.href = safeLink || "#";
    link.target = "_blank";
    link.rel = "noopener noreferrer";

    const imageWrapper = document.createElement("div");
    imageWrapper.className = "article-image-wrapper";

    const image = document.createElement("img");
    image.src = imgSrc;
    image.alt = "Article image";
    image.className = "article-image";
    image.addEventListener("error", () => {
      image.src = CONFIG.FALLBACK_IMAGE;
    });

    const content = document.createElement("div");
    content.className = "article-content";

    const title = document.createElement("h2");
    title.className = "article-title";
    title.textContent = safeTitle;

    const desc = document.createElement("p");
    desc.className = "article-desc";
    desc.textContent = safeDesc;

    imageWrapper.appendChild(image);
    content.appendChild(title);
    content.appendChild(desc);
    link.appendChild(imageWrapper);
    link.appendChild(content);
    card.appendChild(link);

    return card;
  },
};

/**
 * Article manager class
 */
class ArticleManager {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      throw new Error(`Container element with id "${containerId}" not found`);
    }
  }

  /**
   * Shows loading state
   */
  showLoading() {
    this.container.replaceChildren();
    const loading = document.createElement("div");
    loading.className = "article-loading";
    loading.textContent = CONFIG.LOADING_MESSAGE;
    this.container.appendChild(loading);
  }

  /**
   * Shows error message
   * @param {string} message - Error message to display
   */
  showError(message) {
    this.container.replaceChildren();
    const errorElement = document.createElement("div");
    errorElement.className = "article-error";
    errorElement.textContent = message;
    this.container.appendChild(errorElement);
  }

  /**
   * Renders articles in the container
   * @param {Array} articles - Array of article objects
   */
  renderArticles(articles) {
    if (!articles || articles.length === 0) {
      this.showError(CONFIG.ERROR_MESSAGES.NO_ARTICLES);
      return;
    }

    const fragment = document.createDocumentFragment();
    articles.slice(0, CONFIG.MAX_ARTICLES).forEach((item) => {
      fragment.appendChild(utils.createArticleCard(item));
    });
    this.container.replaceChildren(fragment);
  }

  /**
   * Fetches and displays articles
   */
  async fetchArticles() {
    try {
      this.showLoading();

      const response = await fetch(CONFIG.RSS_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (!data.status || data.status !== "ok" || !data.items) {
        throw new Error("Invalid response format");
      }

      this.renderArticles(data.items);
    } catch (error) {
      console.error("Error fetching articles:", error);
      this.showError(
        error.name === "TypeError"
          ? CONFIG.ERROR_MESSAGES.NETWORK_ERROR
          : CONFIG.ERROR_MESSAGES.LOAD_ERROR
      );
    }
  }
}

// Initialize on DOM content loaded
document.addEventListener("DOMContentLoaded", () => {
  try {
    const articleManager = new ArticleManager("medium-articles");
    articleManager.fetchArticles();
  } catch (error) {
    console.error("Failed to initialize article manager:", error);
  }
});
