// Smooth scroll function (unchanged)
function scrollToSection(sectionId) {
    const section = document.querySelector(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
}

// Wait for DOM to load
document.addEventListener("DOMContentLoaded", () => {
    const sections = document.querySelectorAll("section");
    const navLinks = document.querySelectorAll("nav ul li a");
    const navList = document.getElementById("nav-links");

    // Function to update the active link based on scroll position
    const updateActiveLink = () => {
        let currentSection = "";

        // Loop through each section to find which one is currently in view
        sections.forEach((section) => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            if (window.scrollY >= sectionTop - sectionHeight / 3) {
                currentSection = section.getAttribute("id");
            }
        });

        // Handle the bottom of the page
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
            currentSection = "contact";
        }

        // Update the active class on nav links
        navLinks.forEach((link) => {
            link.classList.remove("active");
            if (link.getAttribute("href").substring(1) === currentSection) {
                link.classList.add("active");
            }
        });
    };

    // Run the function on scroll
    window.addEventListener("scroll", updateActiveLink);

    // OPTIONAL: If you want the menu to close automatically when you click a link:
    navLinks.forEach(link => {
        link.addEventListener("click", () => {
            // Remove 'active' class from the UL to close the menu after link click
            navList.classList.remove("active");
        });
    });
});

function toggleMenu() {
    const navList = document.getElementById("nav-links");
    const hamburger = document.querySelector(".hamburger");

    // Slide the mobile menu down/up:
    navList.classList.toggle("active");
    // Morph the hamburger into X (and back):
    hamburger.classList.toggle("open");
}


