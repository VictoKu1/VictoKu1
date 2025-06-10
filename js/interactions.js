// Handles UI interactions: smooth scrolling, menu toggling, and accessibility enhancements

// Smooth scroll to a section by selector
function scrollToSection(selector) {
  const section = document.querySelector(selector);
  if (section) {
    section.scrollIntoView({ behavior: "smooth" });
  }
}

// Toggle mobile navigation menu visibility
function toggleMenu() {
  const navLinks = document.getElementById("nav-links");
  navLinks.classList.toggle("open");
  const hamburger = document.getElementById("hamburger-menu");
  hamburger.classList.toggle("active");
}

// Set aria-current for accessibility on the active nav link
function setAriaCurrent() {
  const navLinks = document.querySelectorAll("#nav-links a");
  navLinks.forEach((link) => link.removeAttribute("aria-current"));
  const active = document.querySelector("#nav-links a.active");
  if (active) active.setAttribute("aria-current", "page");
}

// Event listeners
document.addEventListener("DOMContentLoaded", function () {
  // Scroll to About section on button click
  const scrollBtn = document.getElementById("scroll-about");
  if (scrollBtn) {
    scrollBtn.addEventListener("click", function () {
      scrollToSection("#about");
    });
  }

  // Hamburger menu toggle
  const hamburger = document.getElementById("hamburger-menu");
  if (hamburger) {
    hamburger.addEventListener("click", toggleMenu);
  }

  setAriaCurrent();
});

window.addEventListener("scroll", setAriaCurrent);
