document.addEventListener("DOMContentLoaded", function () {
  async function fetchMediumArticles() {
    const rssUrl =
      "https://api.rss2json.com/v1/api.json?rss_url=https://medium.com/feed/@victoku1";
    const container = document.getElementById("medium-articles");
    try {
      const res = await fetch(rssUrl);
      const data = await res.json();
      if (!data.items) return;

      container.innerHTML = data.items
        .slice(0, 6)
        .map((item) => {
          let imgMatch = item.content.match(/<img[^>]+src="([^">]+)"/);
          let imgSrc = imgMatch ? imgMatch[1] : "media/favicon.ico";
          let shortDesc =
            item.description.replace(/<[^>]+>/g, "").slice(0, 140) + "...";
          return `
                    <div class="article-card">
                        <a href="${item.link}" target="_blank" rel="noopener">
                            <img src="${imgSrc}" alt="Article image" class="article-image"/>
                            <h2 class="article-title">${item.title}</h2>
                            <p class="article-desc">${shortDesc}</p>
                        </a>
                    </div>
                `;
        })
        .join("");
    } catch (e) {
      container.innerHTML = "<p>Unable to load articles at this time.</p>";
    }
  }
  fetchMediumArticles();
});
