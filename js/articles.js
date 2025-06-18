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
};

// Utility functions
const utils = {
  /**
   * Sanitizes text content to prevent XSS
   * @param {string} text - Text to sanitize
   * @returns {string} Sanitized text
   */
  sanitizeText(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  },

  /**
   * Sanitizes and validates URLs
   * @param {string} url - URL to sanitize
   * @returns {string} Sanitized URL or fallback
   */
  sanitizeUrl(url) {
    try {
      const parsed = new URL(url);
      return parsed.href;
    } catch {
      return "#";
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
    const imgSrc = this.extractImageUrl(item.content);
    const shortDesc = this.extractDescription(item);
    const safeTitle = this.sanitizeText(item.title);
    const safeLink = this.sanitizeUrl(item.link);
    const safeDesc = this.sanitizeText(shortDesc);

    return `
            <div class="article-card pro">
              <a href="${safeLink}" target="_blank" rel="noopener">
                <div class="article-image-wrapper">
                        <img src="${imgSrc}" alt="Article image" class="article-image" onerror="this.src='${CONFIG.FALLBACK_IMAGE}'"/>
                </div>
                <div class="article-content">
                  <h2 class="article-title">${safeTitle}</h2>
                        <p class="article-desc">${safeDesc}</p>
                </div>
              </a>
            </div>
          `;
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
    this.container.innerHTML = `<div class="article-loading">${CONFIG.LOADING_MESSAGE}</div>`;
  }

  /**
   * Shows error message
   * @param {string} message - Error message to display
   */
  showError(message) {
    this.container.innerHTML = `<div class="article-error">${message}</div>`;
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

    this.container.innerHTML = articles
      .slice(0, CONFIG.MAX_ARTICLES)
      .map((item) => utils.createArticleCard(item))
      .join("");
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
