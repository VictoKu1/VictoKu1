/**
 * menuHighlight.js
 * ----------------
 * Provides smooth scrolling to sections and dynamic highlighting of
 * navigation links based on scroll position. Also includes functionality
 * to toggle a mobile hamburger menu.
 */

/**
 * scrollToSection
 * ----------------
 * Smoothly scrolls the page to the specified section.
 * @param {string} sectionId - The selector for the target section.
 */
function scrollToSection(sectionId) {
    const section = document.querySelector(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
}

// Wait for the DOM to fully load before executing
document.addEventListener("DOMContentLoaded", () => {
    const sections = document.querySelectorAll("section");
    const navLinks = document.querySelectorAll("nav ul li a");
    const navList = document.getElementById("nav-links");

    /**
     * updateActiveLink
     * ----------------
     * Determines which section is currently in view and updates the active
     * class on the corresponding navigation link.
     */
    const updateActiveLink = () => {
        let currentSection = "";

        // Loop through each section to determine the current section in view.
        sections.forEach((section) => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            if (window.scrollY >= sectionTop - sectionHeight / 3) {
                currentSection = section.getAttribute("id");
            }
        });

        // Handle the bottom of the page by ensuring the "contact" section is active.
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
            currentSection = "contact";
        }

        // Update the active class on navigation links.
        navLinks.forEach((link) => {
            link.classList.remove("active");
            if (link.getAttribute("href").substring(1) === currentSection) {
                link.classList.add("active");
            }
        });
    };

    // Attach the updateActiveLink function to the scroll event.
    window.addEventListener("scroll", updateActiveLink);

    // OPTIONAL: Close the mobile menu when a navigation link is clicked.
    navLinks.forEach(link => {
        link.addEventListener("click", () => {
            navList.classList.remove("active");
        });
    });
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
