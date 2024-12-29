const canvas = document.getElementById('particleCanvas');
const ctx = canvas.getContext('2d');

// Mouse and touch input
const mouse = { x: null, y: null, radius: 150 };

// Resize canvas with proper scaling
function resizeCanvas() {
    const homeSection = document.getElementById('home'); // Get the home section
    const rect = homeSection.getBoundingClientRect();

    const scale = window.devicePixelRatio || 1; // Handle high-DPI screens
    canvas.width = rect.width * scale;
    canvas.height = rect.height * scale;

    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    ctx.scale(scale, scale);
}


// Generate particles
class Particle {
    constructor(x, y, dx, dy, size) {
        this.x = x;
        this.y = y;
        this.dx = dx;
        this.dy = dy;
        this.size = size;
    }

    draw(highlighted = false) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = highlighted ? '#ffffff' : 'rgba(0, 170, 255, 0.5)'; // Highlight or dim
        ctx.fill();
    }

    update() {
        // Bounce particles off canvas edges
        if (this.x + this.size > canvas.width || this.x - this.size < 0) this.dx *= -1;
        if (this.y + this.size > canvas.height || this.y - this.size < 0) this.dy *= -1;

        this.x += this.dx;
        this.y += this.dy;
    }
}

// Initialize particles
const particles = [];
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

// Connect particles
function connectParticles(highlightedParticles) {
    const maxDistance = 120;
    const maxDistanceSquared = maxDistance ** 2;

    for (let a = 0; a < particles.length; a++) {
        for (let b = a + 1; b < particles.length; b++) {
            const dx = particles[a].x - particles[b].x;
            const dy = particles[a].y - particles[b].y;
            const distSq = dx * dx + dy * dy;

            const isHighlighted =
                highlightedParticles.includes(particles[a]) ||
                highlightedParticles.includes(particles[b]);

            if (distSq < maxDistanceSquared) {
                ctx.strokeStyle = isHighlighted
                    ? `rgba(0, 170, 255, 0.3)` // Highlighted
                    : `rgba(0, 170, 255, 0.1)`; // Dimmed

                ctx.beginPath();
                ctx.moveTo(particles[a].x, particles[a].y);
                ctx.lineTo(particles[b].x, particles[b].y);
                ctx.stroke();
            }
        }
    }
}

// Connect mouse to particles
function connectMouse(highlightedParticles) {
    const maxDistanceSquared = mouse.radius ** 2;

    for (const particle of highlightedParticles) {
        const dx = mouse.x - particle.x;
        const dy = mouse.y - particle.y;
        const distSq = dx * dx + dy * dy;

        if (distSq < maxDistanceSquared) {
            const opacity = 1 - distSq / maxDistanceSquared;
            ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
            ctx.beginPath();
            ctx.moveTo(mouse.x, mouse.y);
            ctx.lineTo(particle.x, particle.y);
            ctx.stroke();
        }
    }
}

// Highlight nodes around the mouse
function getHighlightedParticles() {
    const highlightedParticles = [];
    if (mouse.x !== null && mouse.y !== null) {
        particles.forEach(p => {
            const dx = mouse.x - p.x;
            const dy = mouse.y - p.y;
            const distSq = dx * dx + dy * dy;
            if (distSq < mouse.radius ** 2) {
                highlightedParticles.push(p);
            }
        });
    }
    return highlightedParticles;
}

// Animation loop
function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Highlight nodes around the mouse
    const highlightedParticles = getHighlightedParticles();

    // Update and draw particles
    particles.forEach(p => {
        p.update();
        const isHighlighted = highlightedParticles.includes(p);
        p.draw(isHighlighted);
    });

    // Connect particles
    connectParticles(highlightedParticles);

    // Connect mouse to particles
    if (mouse.x !== null && mouse.y !== null) connectMouse(highlightedParticles);

    requestAnimationFrame(animate);
}

// Mouse and touch event listeners
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    mouse.x = (e.clientX - rect.left) * scaleX;
    mouse.y = (e.clientY - rect.top) * scaleY;
});

canvas.addEventListener('touchstart', handleTouch);
canvas.addEventListener('touchmove', handleTouch);
canvas.addEventListener('touchend', () => {
    mouse.x = null;
    mouse.y = null;
});

canvas.addEventListener('mouseout', () => {
    mouse.x = null;
    mouse.y = null;
});

function handleTouch(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const touch = e.touches[0]; // First touch point

    mouse.x = (touch.clientX - rect.left) * scaleX;
    mouse.y = (touch.clientY - rect.top) * scaleY;
}

// Initialize canvas and particles
window.addEventListener('resize', () => {
    resizeCanvas();
    initParticles();
});

resizeCanvas();
initParticles();
animate();

