/**
 * Fits article titles to the largest shared size that stays within three lines.
 */
(function () {
  const TITLE_SELECTOR = "#articles .articles-grid .article-card .article-title";
  const MAX_TITLE_SIZE = 32;
  const MIN_TITLE_SIZE = 15;
  const TITLE_LINE_HEIGHT = 1.25;
  const TITLE_LINES = 3;
  const SIZE_CLASS_PREFIX = "article-title-size-";
  let resizeTimer = null;

  function getTitles() {
    return Array.from(document.querySelectorAll(TITLE_SELECTOR));
  }

  function setTitleSize(titles, size) {
    titles.forEach((title) => {
      Array.from(title.classList).forEach((className) => {
        if (className.startsWith(SIZE_CLASS_PREFIX)) {
          title.classList.remove(className);
        }
      });
      title.classList.add(`${SIZE_CLASS_PREFIX}${size}`);
    });
  }

  function titlesFit(titles, size) {
    const maxHeight = Math.ceil(size * TITLE_LINE_HEIGHT * TITLE_LINES) + 1;
    setTitleSize(titles, size);

    return titles.every((title) => title.scrollHeight <= maxHeight);
  }

  function fitArticleTitles() {
    const titles = getTitles();
    if (titles.length === 0) return;

    let low = MIN_TITLE_SIZE;
    let high = MAX_TITLE_SIZE;
    let best = MIN_TITLE_SIZE;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (titlesFit(titles, mid)) {
        best = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    setTitleSize(titles, best);
  }

  function scheduleFit() {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      window.requestAnimationFrame(fitArticleTitles);
    }, 80);
  }

  document.addEventListener("DOMContentLoaded", () => {
    const articleContainer = document.getElementById("medium-articles");
    if (!articleContainer) return;

    const observer = new MutationObserver(scheduleFit);
    observer.observe(articleContainer, { childList: true, subtree: true });

    window.addEventListener("resize", scheduleFit);
    scheduleFit();
  });
})();
