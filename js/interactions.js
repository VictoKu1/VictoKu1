/**
 * Handles interactive elements and user interactions
 * Manages mobile menu, navigation highlighting, and scroll behavior
 */

class InteractionManager {
    constructor() {
        this.menuButton = document.querySelector(".menu-button");
        this.navList = document.querySelector(".nav-list");
        this.navLinks = document.querySelectorAll(".nav-list a");
        this.lastScrollTop = 0;
        this.scrollThreshold = 5;
        this.isMenuOpen = false;

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
            link.addEventListener("click", () => {
                if (this.isMenuOpen) {
                    this.toggleMenu();
                }
            });
        });

        // Handle scroll events
        window.addEventListener("scroll", () => this.handleScroll());
        
        // Set initial active link
        this.setAriaCurrent();
    }

    /**
     * Toggle mobile menu visibility
     */
    toggleMenu() {
        this.isMenuOpen = !this.isMenuOpen;
        this.menuButton.setAttribute("aria-expanded", this.isMenuOpen);
        this.navList.classList.toggle("active");
        
        // Update button text
        this.menuButton.textContent = this.isMenuOpen ? "Close" : "Menu";
    }

    /**
     * Handle scroll events for navigation highlighting
     */
    handleScroll() {
        const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
        
        // Only update if scrolled more than threshold
        if (Math.abs(currentScroll - this.lastScrollTop) > this.scrollThreshold) {
            this.setAriaCurrent();
            this.lastScrollTop = currentScroll;
        }
    }

    /**
     * Set aria-current attribute for active navigation link
     */
    setAriaCurrent() {
        const currentHash = window.location.hash || "#home";
        
        this.navLinks.forEach(link => {
            const isActive = link.getAttribute("href") === currentHash;
            link.setAttribute("aria-current", isActive ? "page" : null);
            
            if (isActive) {
                link.classList.add("active");
            } else {
                link.classList.remove("active");
            }
        });
    }
}

// Initialize on DOM content loaded
document.addEventListener("DOMContentLoaded", () => {
    new InteractionManager();
});
