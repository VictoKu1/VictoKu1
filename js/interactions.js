/**
 * Handles interactive elements and user interactions
 * Manages mobile menu, navigation highlighting, and scroll behavior
 */

class InteractionManager {
    constructor() {
        this.menuButton = document.getElementById("hamburger-menu");
        this.navList = document.getElementById("nav-links");
        this.navLinks = document.querySelectorAll("#nav-links a");
        this.sections = Array.from(document.querySelectorAll("section[id]"));
        this.lastScrollTop = 0;
        this.scrollThreshold = 5;
        this.isMenuOpen = false;
        this.scrollBtn = document.getElementById("scroll-about");

        this.init();
    }

    /**
     * Initialize event listeners and initial state
     */
    init() {
        if (this.menuButton) {
            this.menuButton.addEventListener("click", () => this.toggleMenu());
        }

        // Handle navigation link clicks
        this.navLinks.forEach(link => {
            link.addEventListener("click", (e) => {
                const href = link.getAttribute("href");
                if (href && href.startsWith("#")) {
                    e.preventDefault();
                    this.customScrollToSection(href.replace('#', ''), 250); // Fast scroll for menu
                }
                if (this.isMenuOpen) {
                    this.toggleMenu();
                }
            });
        });

        // Handle scroll events
        window.addEventListener("scroll", () => this.handleScroll());
        window.addEventListener("resize", () => this.handleResize());
        window.addEventListener("orientationchange", () => {
            // Add a longer delay for orientation change to ensure viewport is updated
            setTimeout(() => this.handleResize(), 100);
        });
        
        // Set initial active link
        this.updateActiveMenuLink();
        
        // Measure initial menu size for current viewport after layout is complete
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                this.handleResize();
            });
        });

        // Handle "Who Am I?" button click
        if (this.scrollBtn) {
            this.scrollBtn.addEventListener("click", () => {
                this.smoothScrollToSection("about");
            });
        }
    }

    /**
     * Toggle mobile menu visibility
     */
    toggleMenu() {
        this.isMenuOpen = !this.isMenuOpen;
        this.menuButton.setAttribute("aria-expanded", this.isMenuOpen);
        
        if (this.isMenuOpen) {
            // First open the menu but keep it invisible
            this.navList.classList.add("active");
            this.menuButton.classList.add("open");
            
            // Temporarily hide the menu to measure it without visual jumps
            this.navList.style.visibility = "hidden";
            
            // Force a reflow to ensure the menu is fully rendered
            this.navList.offsetHeight;
            
            // Use viewport-based sizing instead of dynamic measurement
            this.updateMenuFitsClass();
            
            // Make it visible after measurement
            requestAnimationFrame(() => {
                this.navList.style.visibility = "visible";
            });
        } else {
            // Close the menu and reset menu-fits class
            this.navList.classList.remove("active");
            this.navList.classList.remove("menu-fits"); // Reset for next open
            this.menuButton.classList.remove("open");
            this.navList.style.visibility = "";
        }
    }

    /**
     * Handle resize events for menu sizing
     */
    handleResize() {
        if (this.navList.classList.contains("active")) {
            this.updateMenuFitsClass();
        } else {
            this.navList.classList.add("active");
            this.navList.style.visibility = "hidden";
            this.navList.style.position = "absolute";
            this.navList.style.top = "-9999px";
            this.navList.style.left = "0";
            this.navList.style.width = "100vw";
            
            // Force a reflow to ensure styles are applied
            this.navList.offsetHeight;
            
            // Small delay to ensure everything is stable
            setTimeout(() => {
                this.updateMenuFitsClass();
                
                // Close the menu and restore styles
                this.navList.classList.remove("active");
                this.navList.style.visibility = "";
                this.navList.style.position = "";
                this.navList.style.top = "";
                this.navList.style.left = "";
                this.navList.style.width = "";
            }, 10);
        }
    }

    /**
     * Dynamically add/remove 'menu-fits' class based on viewport dimensions
     */
    updateMenuFitsClass() {
        // Only apply when menu is open and on mobile
        if (this.navList.classList.contains("active") && window.innerWidth <= 768) {
            const viewportHeight = window.innerHeight;
            const viewportWidth = window.innerWidth;
            
            // Apply menu-fits class based on viewport dimensions
            // Use a more conservative threshold for horizontal mode
            const isHorizontal = viewportWidth > viewportHeight;
            const threshold = isHorizontal ? viewportHeight * 0.8 : viewportHeight * 0.65;
            
            if (isHorizontal && viewportHeight > 400) {
                // In horizontal mode with reasonable height, apply menu-fits
                this.navList.classList.add("menu-fits");
            } else if (!isHorizontal && viewportHeight > 500) {
                // In vertical mode with good height, apply menu-fits
                this.navList.classList.add("menu-fits");
            } else {
                // Remove menu-fits for small screens
                this.navList.classList.remove("menu-fits");
            }
        }
    }

    /**
     * Handle scroll events for navigation highlighting
     */
    handleScroll() {
        const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
        // Only update if scrolled more than threshold
        if (Math.abs(currentScroll - this.lastScrollTop) > this.scrollThreshold) {
            this.updateActiveMenuLink();
            this.lastScrollTop = currentScroll;
        }
    }

    /**
     * Update menu highlighting based on the section currently in view
     */
    updateActiveMenuLink() {
        let currentSectionId = this.sections[0]?.id || "home";
        const scrollPosition = window.scrollY + window.innerHeight / 3;
        for (const section of this.sections) {
            if (scrollPosition >= section.offsetTop) {
                currentSectionId = section.id;
            }
        }
        // If at (or near) the bottom, always highlight the last section
        if ((window.innerHeight + window.scrollY) >= (document.body.offsetHeight - 2)) {
            currentSectionId = this.sections[this.sections.length - 1].id;
        }
        this.navLinks.forEach(link => {
            const href = link.getAttribute("href");
            const isActive = href === `#${currentSectionId}`;
            link.setAttribute("aria-current", isActive ? "page" : null);
            if (isActive) {
                link.classList.add("active");
            } else {
                link.classList.remove("active");
            }
        });
    }

    /**
     * Smoothly scroll to a section by ID (default browser speed)
     * @param {string} sectionId
     */
    smoothScrollToSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            section.scrollIntoView({ behavior: "smooth", block: "start" });
            // If scrolling to the last section, ensure menu is updated after scroll
            if (sectionId === this.sections[this.sections.length - 1].id) {
                setTimeout(() => this.updateActiveMenuLink(), 400);
            }
        }
    }

    /**
     * Custom fast smooth scroll to a section by ID
     * @param {string} sectionId
     * @param {number} duration - Duration in ms
     */
    customScrollToSection(sectionId, duration = 150) {
        const section = document.getElementById(sectionId);
        if (!section) return;
        const sectionTop = section.offsetTop;
        const startScroll = window.pageYOffset;
        const distance = sectionTop - startScroll;
        const startTime = performance.now();
        const animateScroll = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease in-out cubic
            const ease = progress < 0.5
                ? 4 * progress * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 3) / 2;
            window.scrollTo(0, startScroll + distance * ease);
            if (progress < 1) {
                requestAnimationFrame(animateScroll);
            } else {
                // If scrolling to the last section, ensure menu is updated after scroll
                if (sectionId === this.sections[this.sections.length - 1].id) {
                    setTimeout(() => this.updateActiveMenuLink(), 100);
                }
            }
        };
        requestAnimationFrame(animateScroll);
    }
}

// Initialize on DOM content loaded
document.addEventListener("DOMContentLoaded", () => {
    new InteractionManager();
});
