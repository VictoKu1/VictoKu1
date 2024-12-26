// Wait for the DOM to load
document.addEventListener("DOMContentLoaded", () => {
    const sections = document.querySelectorAll("section"); // All sections
    const navLinks = document.querySelectorAll("nav ul li a"); // All nav links

    // Function to update the active link based on scroll position
    const updateActiveLink = () => {
        let currentSection = "";

        // Loop through each section to find which one is currently in view
        sections.forEach((section) => {
            const sectionTop = section.offsetTop; // Top of the section
            const sectionHeight = section.offsetHeight; // Height of the section
            if (window.scrollY >= sectionTop - sectionHeight / 3) {
                currentSection = section.getAttribute("id"); // Get the section's ID
            }
        });

        // Handle the bottom of the page
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
            currentSection = "contact"; // Set to the Contact Me section
        }

        // Update the active class on nav links
        navLinks.forEach((link) => {
            link.classList.remove("active"); // Remove active class
            if (link.getAttribute("href").substring(1) === currentSection) {
                link.classList.add("active"); // Add active class to the current link
            }
        });
    };

    // Run the function on scroll
    window.addEventListener("scroll", updateActiveLink);
});

// Smooth scroll function
function scrollToSection(sectionId) {
    const section = document.querySelector(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
}
