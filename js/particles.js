/**
 * Particle Animation Script
 * ---------------------------
 * This script creates an animated particle system on the canvas element with id "particleCanvas".
 * The particles respond to mouse and touch events and connect with lines when they are near each other.
 * The canvas is sized to match the #home section's dimensions, and the code is optimized for 265 particles.
 */

const canvas = document.getElementById("particleCanvas");
const ctx = canvas.getContext("2d");

// Mouse and touch input configuration
const mouse = { x: null, y: null, radius: 150 };

// Cached bounding rectangle for the canvas element
let canvasRect = null;

/**
 * resizeCanvas
 * ------------
 * Resizes the canvas to match the dimensions of the #home section.
 * Uses window.devicePixelRatio to support high-DPI screens.
 * Updates the cached canvasRect for accurate coordinate calculations.
 */
function resizeCanvas() {
  const homeSection = document.getElementById("home");
  const rect = homeSection.getBoundingClientRect();
  const scale = window.devicePixelRatio || 1;

  canvas.width = rect.width * scale;
  canvas.height = rect.height * scale;
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;

  // Update cached bounding rectangle
  canvasRect = canvas.getBoundingClientRect();
}

// Update canvasRect on scroll so that mouse/touch events remain accurate
window.addEventListener("scroll", () => {
  canvasRect = canvas.getBoundingClientRect();
});

/**
 * Particle Class
 * --------------
 * Represents an individual particle.
 */
class Particle {
  constructor(x, y, dx, dy, size) {
    this.x = x;
    this.y = y;
    this.dx = dx;
    this.dy = dy;
    this.size = size;
  }

  /**
   * draw
   * ----
   * Draws the particle. If highlighted is true, draws it in white.
   * @param {boolean} highlighted - Whether the particle should be highlighted.
   */
  draw(highlighted = false) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = highlighted ? "#ffffff" : "rgba(0, 170, 255, 0.5)";
    ctx.fill();
  }

  /**
   * update
   * ------
   * Updates the particle's position and reverses its velocity if it hits canvas boundaries.
   */
  update() {
    if (this.x + this.size > canvas.width || this.x - this.size < 0) {
      this.dx *= -1;
    }
    if (this.y + this.size > canvas.height || this.y - this.size < 0) {
      this.dy *= -1;
    }
    this.x += this.dx;
    this.y += this.dy;
  }
}

const particles = [];

/**
 * initParticles
 * -------------
 * Initializes the particles array with 265 particles at random positions and velocities.
 */
function initParticles() {
  particles.length = 0;
  const particleCount = 265;
  for (let i = 0; i < particleCount; i++) {
    const size = Math.random() * 3 + 1;
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const dx = Math.random() * 1 - 0.5;
    const dy = Math.random() * 1 - 0.5;
    particles.push(new Particle(x, y, dx, dy, size));
  }
}

/**
 * connectParticles
 * ----------------
 * Draws lines connecting particles that are within a specified distance.
 * Uses cached squared distances for efficiency.
 * @param {Array} highlightedParticles - Array of particles near the mouse.
 */
function connectParticles(highlightedParticles) {
  const maxDistance = 120;
  const maxDistanceSquared = maxDistance * maxDistance;
  const len = particles.length;

  for (let a = 0; a < len; a++) {
    for (let b = a + 1; b < len; b++) {
      const dx = particles[a].x - particles[b].x;
      const dy = particles[a].y - particles[b].y;
      const distSq = dx * dx + dy * dy;
      const isHighlighted =
        highlightedParticles.includes(particles[a]) ||
        highlightedParticles.includes(particles[b]);
      if (distSq < maxDistanceSquared) {
        ctx.strokeStyle = isHighlighted
          ? "rgba(0, 170, 255, 0.3)"
          : "rgba(0, 170, 255, 0.1)";
        ctx.beginPath();
        ctx.moveTo(particles[a].x, particles[a].y);
        ctx.lineTo(particles[b].x, particles[b].y);
        ctx.stroke();
      }
    }
  }
}

/**
 * connectMouse
 * ------------
 * Draws lines connecting the mouse position to nearby particles.
 * The line opacity is based on distance.
 * @param {Array} highlightedParticles - Array of particles near the mouse.
 */
function connectMouse(highlightedParticles) {
  const maxDistanceSquared = mouse.radius * mouse.radius;
  const len = highlightedParticles.length;
  for (let i = 0; i < len; i++) {
    const p = highlightedParticles[i];
    const dx = mouse.x - p.x;
    const dy = mouse.y - p.y;
    const distSq = dx * dx + dy * dy;
    if (distSq < maxDistanceSquared) {
      const opacity = 1 - distSq / maxDistanceSquared;
      ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
      ctx.beginPath();
      ctx.moveTo(mouse.x, mouse.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }
  }
}

/**
 * getHighlightedParticles
 * -------------------------
 * Returns an array of particles that are within the mouse radius.
 * @returns {Array} An array of highlighted particles.
 */
function getHighlightedParticles() {
  const highlightedParticles = [];
  if (mouse.x !== null && mouse.y !== null) {
    const radiusSq = mouse.radius * mouse.radius;
    const len = particles.length;
    for (let i = 0; i < len; i++) {
      const p = particles[i];
      const dx = mouse.x - p.x;
      const dy = mouse.y - p.y;
      if (dx * dx + dy * dy < radiusSq) {
        highlightedParticles.push(p);
      }
    }
  }
  return highlightedParticles;
}

/**
 * animate
 * -------
 * The main animation loop that clears the canvas, updates and draws particles,
 * and then draws connections between particles and between the mouse and particles.
 */
function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const highlightedParticles = getHighlightedParticles();
  const len = particles.length;
  for (let i = 0; i < len; i++) {
    const p = particles[i];
    p.update();
    p.draw(highlightedParticles.includes(p));
  }
  connectParticles(highlightedParticles);
  if (mouse.x !== null && mouse.y !== null) {
    connectMouse(highlightedParticles);
  }
  requestAnimationFrame(animate);
}

/**
 * Event Listeners for Mouse and Touch Input
 * ------------------------------------------
 * These update the mouse coordinates based on the cached canvasRect.
 */
canvas.addEventListener("mousemove", (e) => {
  if (!canvasRect) return;
  const scaleX = canvas.width / canvasRect.width;
  const scaleY = canvas.height / canvasRect.height;
  mouse.x = (e.clientX - canvasRect.left) * scaleX;
  mouse.y = (e.clientY - canvasRect.top) * scaleY;
});

canvas.addEventListener("touchstart", handleTouch);
canvas.addEventListener("touchmove", handleTouch);
canvas.addEventListener("touchend", () => {
  mouse.x = null;
  mouse.y = null;
});
canvas.addEventListener("mouseout", () => {
  mouse.x = null;
  mouse.y = null;
});

/**
 * handleTouch
 * -----------
 * Processes touch events and updates the mouse coordinates.
 */
function handleTouch(e) {
  if (!canvasRect) return;
  const scaleX = canvas.width / canvasRect.width;
  const scaleY = canvas.height / canvasRect.height;
  const touch = e.touches[0];
  mouse.x = (touch.clientX - canvasRect.left) * scaleX;
  mouse.y = (touch.clientY - canvasRect.top) * scaleY;
}

// Update canvas and reinitialize particles on window resize
window.addEventListener("resize", () => {
  resizeCanvas();
  initParticles();
});

// Initial setup and start animation loop
resizeCanvas();
initParticles();
animate();
