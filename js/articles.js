// Fetch and display latest Medium articles for @victoku1
// This script dynamically loads articles into the #medium-articles container

document.addEventListener("DOMContentLoaded", function () {
  // Helper function to sanitize text content
  function sanitizeText(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // Helper function to sanitize URLs
  function sanitizeUrl(url) {
    try {
      const parsed = new URL(url);
      return parsed.href;
    } catch {
      return "#";
    }
  }

  // Fetches Medium articles using rss2json API and updates the DOM
  async function fetchMediumArticles() {
    const rssUrl =
      "https://api.rss2json.com/v1/api.json?rss_url=https://medium.com/feed/@victoku1";
    const container = document.getElementById("medium-articles");
    try {
      // Fetch RSS feed and parse JSON
      const res = await fetch(rssUrl);
      const data = await res.json();
      if (!data.items) {
        container.innerHTML = `<div class="article-error">No articles found.</div>`;
        return;
      }

      // Render up to 6 articles as cards
      container.innerHTML = data.items
        .slice(0, 6)
        .map((item) => {
          // Extract first image from article content, fallback to favicon
          const imgMatch = item.content.match(/<img[^>]+src=\"([^">]+)\"/);
          const imgSrc = imgMatch ? imgMatch[1] : "media/favicon.ico";
          let figcaptionMatch = item.description.match(
            /<figcaption[^>]*>(.*?)<\/figcaption>/i
          );
          let shortDesc = figcaptionMatch[1];
          // Sanitize all dynamic content
          const safeTitle = sanitizeText(item.title);
          const safeLink = sanitizeUrl(item.link);
          // Return HTML for a single article card
          return `
            <div class="article-card pro">
              <a href="${safeLink}" target="_blank" rel="noopener">
                <div class="article-image-wrapper">
                  <img src="${imgSrc}" alt="Article image" class="article-image"/>
                </div>
                <div class="article-content">
                  <h2 class="article-title">${safeTitle}</h2>
                  <p class="article-desc">${shortDesc}</p>
                </div>
              </a>
            </div>
          `;
        })
        .join("");
    } catch (e) {
      // Show error message if fetch fails
      container.innerHTML = `<div class="article-error">Unable to load articles at this time.</div>`;
    }
  }
  // Run on page load
  fetchMediumArticles();
});
