/**
 * This script creates an animated particle system on the canvas element with id "particleCanvas".
 * The particles respond to mouse and touch events and connect with lines when they are near each other.
 * The canvas is sized to match the #home section's dimensions, and the code is optimized for 265 particles.
 */

const canvas = document.getElementById("particleCanvas");
const ctx = canvas.getContext("2d");

// Mouse and touch input configuration
const mouse = {
  x: null,
  y: null,
  radius: 150,
  isDown: false,
  gravityCenter: null,
  velocity: { x: 0, y: 0 },
  lastX: null,
  lastY: null,
  lastMoveTime: 0,
};

// Physics constants
const G = 0.15; // Base gravitational constant
const ESCAPE_VELOCITY_FACTOR = 1.5; // Factor to determine escape velocity
const ORBIT_SPEED_FACTOR = 0.4; // Base orbital speed factor
const MAX_ORBIT_RADIUS = 200; // Maximum distance for orbital connection
const MIN_ORBIT_RADIUS = 20; // Minimum distance for stable orbit
const GRAVITY_FALLOFF = 1.5; // How quickly gravity strength decreases with distance
const ORBIT_MAINTENANCE_FACTOR = 0.95; // How strongly to maintain orbit radius
const RESPONSE_FACTOR = 0.3; // How quickly particles respond to mouse movement
const SPEED_MULTIPLIER = 2.0; // Maximum speed multiplier for closest particles
const COLLISION_RESTITUTION = 0.8; // Bounciness factor for particle collisions (0-1)
const COLLISION_DAMPING = 0.98; // Velocity damping after collision to prevent infinite bouncing

// Cached bounding rectangle for the canvas element
let canvasRect = null;

// Add touch interaction state variables
let touchStartTime = 0;
let touchStartX = 0;
let touchStartY = 0;
let touchHoldTimer = null;
let isTouchHolding = false;
const TOUCH_HOLD_DURATION = 1500; // 1.5 seconds in milliseconds
const TOUCH_MOVE_THRESHOLD = 10; // pixels - if touch moves more than this, cancel hold

// Edge scrolling variables
let edgeScrollTimer = null;
let currentEdgeScrollDirection = null;
const EDGE_SCROLL_INTERVAL = 25; // milliseconds between scroll events (reduced from 50ms)
const TOP_EDGE_THRESHOLD = 0.15; // 15% from top
const BOTTOM_EDGE_THRESHOLD = 0.1; // 10% from bottom
const SCROLL_SPEED = 4; // pixels per scroll event (increased from 2)

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
 * Particle
 * -----
 * Represents an individual particle in the system, with physics for movement, orbiting, and border collision.
 */
class Particle {
  /**
   * @param {number} x - Initial x position
   * @param {number} y - Initial y position
   * @param {number} dx - Initial x velocity
   * @param {number} dy - Initial y velocity
   * @param {number} size - Particle radius
   */
  constructor(x, y, dx, dy, size) {
    this.x = x;
    this.y = y;
    this.dx = dx;
    this.dy = dy;
    this.size = size;
    this.originalDx = dx;
    this.originalDy = dy;
    this.isOrbiting = false;
    this.orbitRadius = 0;
    this.initialOrbitRadius = 0; // Store the initial orbit radius
    this.orbitAngle = 0;
    this.orbitSpeed = 0;
    this.velocity = { x: 0, y: 0 };
    this.mass = size;
    this.gravityStrength = 1;
    this.lastUpdateTime = 0;
    this.speedMultiplier = 1;
    this.prevX = x;
    this.prevY = y;
  }

  /**
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
   * Checks for collision with another particle and handles bouncing physics
   * Optimized version using squared distances to avoid expensive sqrt operations
   * @param {Particle} other - The other particle to check collision with
   */
  checkCollision(other) {
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    const distanceSquared = dx * dx + dy * dy;
    const minDistance = this.size + other.size;
    const minDistanceSquared = minDistance * minDistance;

    if (distanceSquared < minDistanceSquared && distanceSquared > 0) {
      // Only calculate sqrt when collision is detected
      const distance = Math.sqrt(distanceSquared);
      const overlap = minDistance - distance;
      
      // Normalize collision vector (reuse distance calculation)
      const invDistance = 1 / distance;
      const nx = dx * invDistance;
      const ny = dy * invDistance;
      
      // Separate particles to prevent overlap
      const separation = overlap * 0.5;
      const separationX = separation * nx;
      const separationY = separation * ny;
      
      this.x += separationX;
      this.y += separationY;
      other.x -= separationX;
      other.y -= separationY;
      
      // Calculate relative velocity
      const relativeVelX = this.dx - other.dx;
      const relativeVelY = this.dy - other.dy;
      
      // Calculate relative velocity in collision normal direction
      const velAlongNormal = relativeVelX * nx + relativeVelY * ny;
      
      // Don't resolve if velocities are separating
      if (velAlongNormal > 0) return;
      
      // Calculate impulse scalar with mass consideration
      const restitutionFactor = -(1 + COLLISION_RESTITUTION);
      const totalMass = this.mass + other.mass;
      const impulseScalar = (restitutionFactor * velAlongNormal) / totalMass;
      
      // Apply impulse to velocities based on mass
      const impulseX = impulseScalar * nx;
      const impulseY = impulseScalar * ny;
      
      this.dx += impulseX * other.mass;
      this.dy += impulseY * other.mass;
      other.dx -= impulseX * this.mass;
      other.dy -= impulseY * this.mass;
      
      // Apply damping to prevent infinite bouncing
      this.dx *= COLLISION_DAMPING;
      this.dy *= COLLISION_DAMPING;
      other.dx *= COLLISION_DAMPING;
      other.dy *= COLLISION_DAMPING;
    }
  }

  /**
   * Updates the particle's position and handles orbiting and border collision.
   */
  update() {
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastUpdateTime;
    this.lastUpdateTime = currentTime;

    // Store previous position before updating (for release velocity)
    this.prevX = this.x;
    this.prevY = this.y;

    if (this.isOrbiting && mouse.gravityCenter) {
      // --- Orbiting Physics ---
      // Calculate vector from particle to gravity center
      const dx = mouse.gravityCenter.x - this.x;
      const dy = mouse.gravityCenter.y - this.y;
      const currentDistance = Math.sqrt(dx * dx + dy * dy);

      // Update gravity strength based on initial distance
      this.gravityStrength = Math.pow(
        1 - this.initialOrbitRadius / MAX_ORBIT_RADIUS,
        GRAVITY_FALLOFF
      );

      // Calculate speed multiplier based on distance (closer = faster)
      const distanceRatio = 1 - this.initialOrbitRadius / MAX_ORBIT_RADIUS;
      this.speedMultiplier =
        1 + (SPEED_MULTIPLIER - 1) * Math.pow(distanceRatio, 2);

      // Escape orbit if too far
      if (this.initialOrbitRadius > MAX_ORBIT_RADIUS) {
        this.escapeOrbit();
        return;
      }

      // Calculate escape velocity
      const escapeVelocity = Math.sqrt(
        (2 * G * mouse.mass * this.gravityStrength) / this.initialOrbitRadius
      );
      const currentVelocity = Math.sqrt(
        this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y
      );
      if (currentVelocity > escapeVelocity * ESCAPE_VELOCITY_FACTOR) {
        this.escapeOrbit();
        return;
      }

      // Update orbital speed (Kepler's law)
      const distanceFactor = Math.max(
        0.2,
        1 - this.initialOrbitRadius / MAX_ORBIT_RADIUS
      );
      this.orbitSpeed =
        Math.sqrt(
          (G * mouse.mass * this.gravityStrength) /
            (this.initialOrbitRadius * this.initialOrbitRadius)
        ) *
        ORBIT_SPEED_FACTOR *
        distanceFactor *
        this.speedMultiplier;

      // Advance orbit angle
      this.orbitAngle += this.orbitSpeed;

      // Target position on the orbit
      const targetX =
        mouse.gravityCenter.x +
        Math.cos(this.orbitAngle) * this.initialOrbitRadius;
      const targetY =
        mouse.gravityCenter.y +
        Math.sin(this.orbitAngle) * this.initialOrbitRadius;

      // Move towards target position
      const distToTarget = Math.sqrt(
        Math.pow(targetX - this.x, 2) + Math.pow(targetY - this.y, 2)
      );
      const moveStrength =
        RESPONSE_FACTOR *
        this.gravityStrength *
        (1 + distToTarget / this.initialOrbitRadius) *
        this.speedMultiplier;
      this.x += (targetX - this.x) * moveStrength;
      this.y += (targetY - this.y) * moveStrength;

      // Add immediate mouse movement influence (perpendicular to radius)
      if (mouse.velocity.x !== 0 || mouse.velocity.y !== 0) {
        const perpX = -dy / currentDistance;
        const perpY = dx / currentDistance;
        const responseFactor = Math.min(1, deltaTime / 16); // Normalize to 60fps
        this.x +=
          (mouse.velocity.x * RESPONSE_FACTOR + perpX * 0.05) *
          this.gravityStrength *
          responseFactor *
          this.speedMultiplier;
        this.y +=
          (mouse.velocity.y * RESPONSE_FACTOR + perpY * 0.05) *
          this.gravityStrength *
          responseFactor *
          this.speedMultiplier;
      }
    } else {
      // --- Normal movement and border bounce ---
      // Smooth elastic bounce with overshoot reflection
      if (this.x + this.size > canvas.width) {
        this.dx *= -1;
        const overshoot = this.x + this.size - canvas.width;
        this.x = canvas.width - this.size - overshoot;
      } else if (this.x - this.size < 0) {
        this.dx *= -1;
        const overshoot = this.size - this.x;
        this.x = this.size + overshoot;
      }
      if (this.y + this.size > canvas.height) {
        this.dy *= -1;
        const overshoot = this.y + this.size - canvas.height;
        this.y = canvas.height - this.size - overshoot;
      } else if (this.y - this.size < 0) {
        this.dy *= -1;
        const overshoot = this.size - this.y;
        this.y = this.size + overshoot;
      }
      this.x += this.dx;
      this.y += this.dy;
    }
  }

  /**
   * Starts orbiting around a center point.
   * @param {number} centerX
   * @param {number} centerY
   */
  startOrbit(centerX, centerY) {
    if (!this.isOrbiting) {
      this.isOrbiting = true;
      this.originalDx = this.dx;
      this.originalDy = this.dy;
      this.lastUpdateTime = performance.now();

      // Calculate initial distance and angle from center
      const dx = this.x - centerX;
      const dy = this.y - centerY;
      this.initialOrbitRadius = Math.sqrt(dx * dx + dy * dy);
      this.orbitRadius = this.initialOrbitRadius;
      this.orbitAngle = Math.atan2(dy, dx);

      // Set up gravity and speed multipliers
      this.gravityStrength = Math.pow(
        1 - this.initialOrbitRadius / MAX_ORBIT_RADIUS,
        GRAVITY_FALLOFF
      );
      const distanceRatio = 1 - this.initialOrbitRadius / MAX_ORBIT_RADIUS;
      this.speedMultiplier =
        1 + (SPEED_MULTIPLIER - 1) * Math.pow(distanceRatio, 2);
      const distanceFactor = Math.max(
        0.2,
        1 - this.initialOrbitRadius / MAX_ORBIT_RADIUS
      );
      this.orbitSpeed =
        Math.sqrt(
          (G * mouse.mass * this.gravityStrength) /
            (this.initialOrbitRadius * this.initialOrbitRadius)
        ) *
        ORBIT_SPEED_FACTOR *
        distanceFactor *
        this.speedMultiplier;

      // Set initial velocity perpendicular to radius vector
      const speed =
        Math.sqrt(
          (G * mouse.mass * this.gravityStrength) / this.initialOrbitRadius
        ) * this.speedMultiplier;
      this.velocity.x = (-dy / this.initialOrbitRadius) * speed;
      this.velocity.y = (dx / this.initialOrbitRadius) * speed;
    }
  }

  /**
   * Releases the particle from orbit, setting its velocity to its current movement plus user input.
   * @param {number} centerX - X coordinate of the gravity center at release.
   * @param {number} centerY - Y coordinate of the gravity center at release.
   */
  releaseFromOrbit(centerX, centerY) {
    if (this.isOrbiting) {
      // Set velocity to actual movement vector from last update plus user input velocity
      this.dx = this.x - this.prevX + mouse.velocity.x;
      this.dy = this.y - this.prevY + mouse.velocity.y;
      this.isOrbiting = false;
      this.velocity = { x: 0, y: 0 };
      this.gravityStrength = 1;
      this.initialOrbitRadius = 0;
      this.speedMultiplier = 1;
    } else {
      // fallback to normal stop
      this.stopOrbit();
    }
  }

  /**
   * Releases the particle from orbit if it escapes, using its last orbit velocity.
   */
  escapeOrbit() {
    this.isOrbiting = false;
    this.dx = this.velocity.x;
    this.dy = this.velocity.y;
    this.velocity = { x: 0, y: 0 };
    this.gravityStrength = 1;
    this.initialOrbitRadius = 0;
    this.speedMultiplier = 1;
  }

  /**
   * Stops orbiting and restores original velocity.
   */
  stopOrbit() {
    if (this.isOrbiting) {
      this.isOrbiting = false;
      this.dx = this.originalDx;
      this.dy = this.originalDy;
      this.velocity = { x: 0, y: 0 };
      this.gravityStrength = 1;
      this.initialOrbitRadius = 0;
      this.speedMultiplier = 1;
    }
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
 * Optimized particle connection drawing with improved spatial partitioning.
 * @param {Array} highlightedParticles - Array of particles near the mouse.
 */
function connectParticles(highlightedParticles) {
  const maxDistance = 120;
  const maxDistanceSquared = maxDistance * maxDistance;
  const cellSize = maxDistance;
  const grid = new Map(); // Use Map for better performance
  const len = particles.length;
  
  // Create a Set for faster highlighted particle lookups
  const highlightedSet = new Set(highlightedParticles);

  // Helper to get grid key - optimized
  const getCellKey = (x, y) => `${(x / cellSize) | 0},${(y / cellSize) | 0}`;

  // Place particles into grid cells
  for (let i = 0; i < len; i++) {
    const p = particles[i];
    const key = getCellKey(p.x, p.y);
    if (!grid.has(key)) {
      grid.set(key, []);
    }
    grid.get(key).push(i);
  }

  // Reduced neighbor offsets for better performance
  const neighborOffsets = [
    [0, 0], [1, 0], [0, 1], [1, 1]
  ];

  // Track pairs already checked
  const checked = new Set();

  for (let i = 0; i < len; i++) {
    const pA = particles[i];
    const cellX = (pA.x / cellSize) | 0;
    const cellY = (pA.y / cellSize) | 0;
    
    for (const [dx, dy] of neighborOffsets) {
      const neighborKey = getCellKey((cellX + dx) * cellSize, (cellY + dy) * cellSize);
      const neighborIndices = grid.get(neighborKey);
      if (!neighborIndices) continue;
      
      const neighborLen = neighborIndices.length;
      for (let k = 0; k < neighborLen; k++) {
        const j = neighborIndices[k];
        if (j <= i) continue; // Avoid double-checking pairs
        
        const pB = particles[j];
        const dx = pA.x - pB.x;
        const dy = pA.y - pB.y;
        const distSq = dx * dx + dy * dy;
        const pairKey = `${i},${j}`;
        
        if (distSq < maxDistanceSquared && !checked.has(pairKey)) {
          checked.add(pairKey);
          const isHighlighted = highlightedSet.has(pA) || highlightedSet.has(pB);

          // Orbit logic (unchanged)
          if (mouse.isDown && mouse.gravityCenter) {
            const distA = Math.sqrt(
              Math.pow(pA.x - mouse.gravityCenter.x, 2) +
                Math.pow(pA.y - mouse.gravityCenter.y, 2)
            );
            const distB = Math.sqrt(
              Math.pow(pB.x - mouse.gravityCenter.x, 2) +
                Math.pow(pB.y - mouse.gravityCenter.y, 2)
            );
            if (distA < mouse.radius) {
              pA.startOrbit(mouse.gravityCenter.x, mouse.gravityCenter.y);
            }
            if (distB < mouse.radius) {
              pB.startOrbit(mouse.gravityCenter.x, mouse.gravityCenter.y);
            }
          }
          
          ctx.strokeStyle = isHighlighted
            ? "rgba(255, 255, 255, 0.3)"
            : "rgba(0, 170, 255, 0.1)";
          ctx.beginPath();
          ctx.moveTo(pA.x, pA.y);
          ctx.lineTo(pB.x, pB.y);
          ctx.stroke();
        }
      }
    }
  }
}

/**
 * connectMouse
 * ------------
 * Optimized mouse-to-particle connection drawing.
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
 * Optimized function to get particles within mouse radius using squared distances.
 * @returns {Array} An array of highlighted particles.
 */
function getHighlightedParticles() {
  const highlightedParticles = [];
  if (mouse.x === null || mouse.y === null) return highlightedParticles;
  
  const radiusSq = mouse.radius * mouse.radius;
  const len = particles.length;
  
  for (let i = 0; i < len; i++) {
    const p = particles[i];
    const dx = mouse.x - p.x;
    const dy = mouse.y - p.y;
    const distSq = dx * dx + dy * dy;
    
    if (distSq < radiusSq) {
      highlightedParticles.push(p);
    }
  }
  
  return highlightedParticles;
}

/**
 * checkParticleCollisions
 * ----------------------
 * Optimized collision detection using spatial partitioning and squared distances.
 * Reduced grid cell size and improved early exit conditions.
 */
function checkParticleCollisions() {
  const maxCollisionDistance = 16; // Reduced from 20 for better performance
  const cellSize = maxCollisionDistance;
  const grid = new Map(); // Use Map instead of object for better performance
  const len = particles.length;

  // Pre-calculate squared distance for comparison
  const maxDistanceSquared = maxCollisionDistance * maxCollisionDistance;

  // Helper to get grid key - optimized string concatenation
  const getCellKey = (x, y) => `${x | 0},${y | 0}`; // Use bitwise OR for faster floor

  // Place particles into grid cells - only non-orbiting particles
  for (let i = 0; i < len; i++) {
    const p = particles[i];
    if (p.isOrbiting) continue; // Skip orbiting particles early
    
    const key = getCellKey(p.x / cellSize, p.y / cellSize);
    if (!grid.has(key)) {
      grid.set(key, []);
    }
    grid.get(key).push(i);
  }

  // Reduced neighbor offsets - only check immediate neighbors
  const neighborOffsets = [
    [0, 0], [1, 0], [0, 1], [1, 1]
  ];

  // Use Set for faster lookups
  const checked = new Set();

  for (let i = 0; i < len; i++) {
    const pA = particles[i];
    if (pA.isOrbiting) continue;
    
    const cellX = (pA.x / cellSize) | 0;
    const cellY = (pA.y / cellSize) | 0;
    
    for (const [dx, dy] of neighborOffsets) {
      const neighborKey = getCellKey(cellX + dx, cellY + dy);
      const neighborIndices = grid.get(neighborKey);
      if (!neighborIndices) continue;
      
      const neighborLen = neighborIndices.length;
      for (let k = 0; k < neighborLen; k++) {
        const j = neighborIndices[k];
        if (j <= i) continue;
        
        const pB = particles[j];
        if (pB.isOrbiting) continue;
        
        // Use a more efficient pair key
        const pairKey = i < j ? `${i},${j}` : `${j},${i}`;
        if (checked.has(pairKey)) continue;
        
        checked.add(pairKey);
        
        // Quick distance check before expensive collision calculation
        const dx = pA.x - pB.x;
        const dy = pA.y - pB.y;
        const distSq = dx * dx + dy * dy;
        
        if (distSq < maxDistanceSquared) {
          pA.checkCollision(pB);
        }
      }
    }
  }
}

/**
 * animate
 * -------
 * Optimized main animation loop with better performance characteristics.
 */
function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  const len = particles.length;
  
  // Update all particles first
  for (let i = 0; i < len; i++) {
    particles[i].update();
  }
  
  // Check for particle-to-particle collisions
  checkParticleCollisions();
  
  // Get highlighted particles once
  const highlightedParticles = getHighlightedParticles();
  const highlightedSet = new Set(highlightedParticles);
  
  // Draw all particles with optimized highlighting check
  for (let i = 0; i < len; i++) {
    const p = particles[i];
    p.draw(highlightedSet.has(p));
  }
  
  // Draw connections
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

  const currentTime = performance.now();
  const deltaTime = currentTime - mouse.lastMoveTime;
  mouse.lastMoveTime = currentTime;

  // Calculate mouse velocity with time-based normalization
  if (mouse.lastX !== null && mouse.lastY !== null) {
    const timeFactor = Math.min(1, deltaTime / 16); // Normalize to 60fps
    mouse.velocity.x = (e.clientX - mouse.lastX) * scaleX * timeFactor;
    mouse.velocity.y = (e.clientY - mouse.lastY) * scaleY * timeFactor;
  }

  mouse.lastX = e.clientX;
  mouse.lastY = e.clientY;

  mouse.x = (e.clientX - canvasRect.left) * scaleX;
  mouse.y = (e.clientY - canvasRect.top) * scaleY;

  if (mouse.isDown) {
    mouse.gravityCenter = { x: mouse.x, y: mouse.y };
  }
});

canvas.addEventListener("touchstart", (e) => {
  if (!canvasRect) return;
  const scaleX = canvas.width / canvasRect.width;
  const scaleY = canvas.height / canvasRect.height;
  const touch = e.touches[0];

  // Record touch start time and position
  touchStartTime = Date.now();
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
  isTouchHolding = false;

  // Clear any existing hold timer
  if (touchHoldTimer) {
    clearTimeout(touchHoldTimer);
    touchHoldTimer = null;
  }

  // Set a timer to activate particle interaction after 1.5 seconds
  touchHoldTimer = setTimeout(() => {
    if (!isTouchHolding) {
      isTouchHolding = true;
      e.preventDefault(); // Prevent scrolling only after hold is activated

      // Activate particle interaction
      mouse.x = (touch.clientX - canvasRect.left) * scaleX;
      mouse.y = (touch.clientY - canvasRect.top) * scaleY;
      mouse.lastX = touch.clientX;
      mouse.lastY = touch.clientY;
      mouse.velocity = { x: 0, y: 0 };
      mouse.isDown = true;
      mouse.gravityCenter = { x: mouse.x, y: mouse.y };
      mouse.mass = 100;
    }
  }, TOUCH_HOLD_DURATION);
});

canvas.addEventListener("touchmove", (e) => {
  if (!canvasRect) return;
  const scaleX = canvas.width / canvasRect.width;
  const scaleY = canvas.height / canvasRect.height;
  const touch = e.touches[0];

  // If we're already in hold mode (orbiting behavior active), update particle interaction
  if (isTouchHolding) {
    // Prevent default touch behavior to avoid browser's default scrolling interfering
    e.preventDefault();

    const currentTime = performance.now();
    const deltaTime = currentTime - mouse.lastMoveTime;
    mouse.lastMoveTime = currentTime;

    // Calculate touch velocity with time-based normalization
    if (mouse.lastX !== null && mouse.lastY !== null) {
      const timeFactor = Math.min(1, deltaTime / 16); // Normalize to 60fps
      mouse.velocity.x = (touch.clientX - mouse.lastX) * scaleX * timeFactor;
      mouse.velocity.y = (touch.clientY - mouse.lastY) * scaleY * timeFactor;
    }

    mouse.lastX = touch.clientX;
    mouse.lastY = touch.clientY;

    mouse.x = (touch.clientX - canvasRect.left) * scaleX;
    mouse.y = (touch.clientY - canvasRect.top) * scaleY;

    // Always update gravity center when in orbiting mode
    if (mouse.isDown) {
      mouse.gravityCenter = { x: mouse.x, y: mouse.y };
    }

    // Handle edge scrolling during orbiting behavior
    handleEdgeScrolling(touch.clientY);

    return; // Exit early, don't check for movement threshold
  }

  // Only check movement threshold if we're not yet in hold mode
  const touchMoveDistance = Math.sqrt(
    Math.pow(touch.clientX - touchStartX, 2) +
      Math.pow(touch.clientY - touchStartY, 2)
  );

  if (touchMoveDistance > TOUCH_MOVE_THRESHOLD) {
    // Touch moved too far, cancel the hold timer
    if (touchHoldTimer) {
      clearTimeout(touchHoldTimer);
      touchHoldTimer = null;
    }
    isTouchHolding = false;

    // If particle interaction was active, stop it
    if (mouse.isDown) {
      mouse.x = null;
      mouse.y = null;
      mouse.lastX = null;
      mouse.lastY = null;
      mouse.isDown = false;
      mouse.gravityCenter = null;
      mouse.velocity = { x: 0, y: 0 };
      // Stop all orbiting particles
      for (const particle of particles) {
        particle.stopOrbit();
      }
    }
    return; // Allow normal scrolling
  }
});

canvas.addEventListener("touchend", (e) => {
  // Clear the hold timer
  if (touchHoldTimer) {
    clearTimeout(touchHoldTimer);
    touchHoldTimer = null;
  }

  // Stop edge scrolling
  stopEdgeScroll();

  // If we were in hold mode, stop particle interaction
  if (isTouchHolding) {
    e.preventDefault();
    mouse.x = null;
    mouse.y = null;
    mouse.lastX = null;
    mouse.lastY = null;
    mouse.isDown = false;
    mouse.gravityCenter = null;
    // Release all orbiting particles with tangent velocity
    for (const particle of particles) {
      if (particle.isOrbiting) {
        // Use last known gravity center
        particle.releaseFromOrbit(touchStartX, touchStartY);
      }
    }
    mouse.velocity = { x: 0, y: 0 };
    isTouchHolding = false;
  }
});

canvas.addEventListener("touchcancel", (e) => {
  // Clear the hold timer
  if (touchHoldTimer) {
    clearTimeout(touchHoldTimer);
    touchHoldTimer = null;
  }

  // Stop edge scrolling
  stopEdgeScroll();

  // Stop particle interaction if it was active
  if (isTouchHolding || mouse.isDown) {
    mouse.x = null;
    mouse.y = null;
    mouse.lastX = null;
    mouse.lastY = null;
    mouse.isDown = false;
    mouse.gravityCenter = null;
    mouse.velocity = { x: 0, y: 0 };
    // Stop all orbiting particles
    for (const particle of particles) {
      particle.stopOrbit();
    }
    isTouchHolding = false;
  }
});

canvas.addEventListener("mouseout", () => {
  mouse.x = null;
  mouse.y = null;
  mouse.lastX = null;
  mouse.lastY = null;
  mouse.isDown = false;
  mouse.gravityCenter = null;
  mouse.velocity = { x: 0, y: 0 };
  // Stop all orbiting particles
  for (const particle of particles) {
    particle.stopOrbit();
  }
});

// Update canvas and reinitialize particles on window resize
window.addEventListener("resize", () => {
  resizeCanvas();
  initParticles();
});

// Initial setup and start animation loop
resizeCanvas();
initParticles();
animate();

// Add mouse down/up event listeners
canvas.addEventListener("mousedown", (e) => {
  if (!canvasRect) return;
  const scaleX = canvas.width / canvasRect.width;
  const scaleY = canvas.height / canvasRect.height;

  mouse.x = (e.clientX - canvasRect.left) * scaleX;
  mouse.y = (e.clientY - canvasRect.top) * scaleY;
  mouse.lastX = e.clientX;
  mouse.lastY = e.clientY;
  mouse.velocity = { x: 0, y: 0 };
  mouse.isDown = true;
  mouse.gravityCenter = { x: mouse.x, y: mouse.y };
  mouse.mass = 100; // Set mass for gravitational calculations
});

canvas.addEventListener("mouseup", () => {
  mouse.isDown = false;
  mouse.gravityCenter = null;
  // Release all orbiting particles with tangent velocity
  for (const particle of particles) {
    if (particle.isOrbiting) {
      // Use last known gravity center
      particle.releaseFromOrbit(mouse.lastX, mouse.lastY);
    }
  }
  mouse.velocity = { x: 0, y: 0 };
});

/**
 * Start edge scrolling if not already active
 */
function startEdgeScroll(direction) {
  if (edgeScrollTimer && currentEdgeScrollDirection === direction) return; // Already scrolling in this direction
  stopEdgeScroll(); // Stop any previous scroll
  currentEdgeScrollDirection = direction;
  edgeScrollTimer = setInterval(() => {
    if (direction === "up") {
      window.scrollBy(0, -SCROLL_SPEED);
    } else if (direction === "down") {
      window.scrollBy(0, SCROLL_SPEED);
    }
  }, EDGE_SCROLL_INTERVAL);
}

/**
 * Stop edge scrolling
 */
function stopEdgeScroll() {
  if (edgeScrollTimer) {
    clearInterval(edgeScrollTimer);
    edgeScrollTimer = null;
    currentEdgeScrollDirection = null;
  }
}

/**
 * Check if touch is in edge zones and handle scrolling
 */
function handleEdgeScrolling(touchY) {
  const screenHeight = window.innerHeight;
  const topEdge = screenHeight * TOP_EDGE_THRESHOLD;
  const bottomEdge = screenHeight * (1 - BOTTOM_EDGE_THRESHOLD);

  if (touchY <= topEdge) {
    // Touch is in top edge zone - scroll up
    startEdgeScroll("up");
  } else if (touchY >= bottomEdge) {
    // Touch is in bottom edge zone - scroll down
    startEdgeScroll("down");
  } else {
    // Not in any edge zone, stop scrolling
    stopEdgeScroll();
  }
}
