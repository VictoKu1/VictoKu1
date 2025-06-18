/**
 * Provides smooth scrolling to sections and dynamic highlighting of
 * navigation links based on scroll position. Also includes functionality
 * to toggle a mobile hamburger menu.
 */

/**
 * Handles menu highlighting based on scroll position
 * Manages active section detection and smooth scrolling
 */

class MenuHighlighter {
  constructor() {
    this.sections = document.querySelectorAll("section[id]");
    this.navLinks = document.querySelectorAll(".nav-list a");
    this.scrollThreshold = 50;
    this.lastScrollTop = 0;
    this.isScrolling = false;
    this.scrollTimeout = null;

    this.init();
  }

  /**
   * Initialize event listeners
   */
  init() {
    window.addEventListener("scroll", () => this.handleScroll());
    this.navLinks.forEach((link) => {
      link.addEventListener("click", (e) => this.handleNavClick(e));
    });
  }

  /**
   * Handle scroll events with throttling
   */
  handleScroll() {
    if (this.isScrolling) return;

    this.isScrolling = true;
    requestAnimationFrame(() => {
      this.updateActiveSection();
      this.isScrolling = false;
    });
  }

  /**
   * Update active section based on scroll position
   */
  updateActiveSection() {
    const scrollPosition = window.scrollY + this.scrollThreshold;

    this.sections.forEach((section) => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      const sectionId = section.getAttribute("id");

      if (
        scrollPosition >= sectionTop &&
        scrollPosition < sectionTop + sectionHeight
      ) {
        this.setActiveLink(sectionId);
      }
    });
  }

  /**
   * Set active navigation link
   * @param {string} sectionId - ID of the active section
   */
  setActiveLink(sectionId) {
    this.navLinks.forEach((link) => {
      const href = link.getAttribute("href");
      const isActive = href === `#${sectionId}`;

      link.classList.toggle("active", isActive);
      link.setAttribute("aria-current", isActive ? "page" : null);
    });
  }

  /**
   * Handle navigation link clicks
   * @param {Event} event - Click event
   */
  handleNavClick(event) {
    const href = event.currentTarget.getAttribute("href");
    if (href.startsWith("#")) {
      event.preventDefault();
      this.scrollToSection(href.substring(1));
    }
  }

  /**
   * Smooth scroll to section
   * @param {string} sectionId - ID of the section to scroll to
   */
  scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (!section) return;

    const sectionTop = section.offsetTop;
    const currentScroll = window.pageYOffset;
    const distance = sectionTop - currentScroll;
    const duration = 500;
    const startTime = performance.now();

    const animateScroll = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smooth animation
      const easeInOutCubic = (progress) => {
        return progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      };

      window.scrollTo(0, currentScroll + distance * easeInOutCubic(progress));

      if (progress < 1) {
        requestAnimationFrame(animateScroll);
      }
    };

    requestAnimationFrame(animateScroll);
  }
}

// Initialize on DOM content loaded
document.addEventListener("DOMContentLoaded", () => {
  new MenuHighlighter();
});

/**
 * toggleMenu
 * ----------
 * Toggles the mobile navigation menu and morphs the hamburger icon into an X.
 */
function toggleMenu() {
  const navList = document.getElementById("nav-links");
  const hamburger = document.querySelector(".hamburger");

  // Toggle menu visibility and animate the hamburger icon.
  navList.classList.toggle("active");
  hamburger.classList.toggle("open");
}
