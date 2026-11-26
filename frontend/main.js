document.addEventListener('DOMContentLoaded', () => {
    // 1. Mobile Menu Toggle
    const menuToggle = document.getElementById('menuToggle');
    const navMenu = document.getElementById('navMenu');

    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('show');
        });

        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('show');
            });
        });
    }

    // 2. ScrollReveal Animations
    if (typeof ScrollReveal !== 'undefined') {
        const sr = ScrollReveal({
            origin: 'bottom',
            distance: '30px',
            duration: 800,
            delay: 150,
            reset: false
        });

        sr.reveal('.hero-banner');
        sr.reveal('.content-section', { interval: 200 });
        sr.reveal('.news-article', { interval: 150 });
    }

    // 3. Canvas Backgrounds
    initRetroCanvas();         // Backdrop Starfield
    initF1CarsCanvas();        // F1 Quantum Cars Animation
    initGTACityCanvas();       // GTA V Dark Dynamic City
    initRandomsArcadeCanvas(); // Retro NES/Sega Pixel Arcade
});

// 1. GLOBAL RETRO STARFIELD CANVAS
function initRetroCanvas() {
    const canvas = document.getElementById('retro-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width, height;

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }

    window.addEventListener('resize', resize);
    resize();

    const particles = Array.from({ length: 40 }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2 + 1,
        speedY: Math.random() * 0.5 + 0.2,
        color: Math.random() > 0.5 ? '#00f3ff' : '#ff007f',
        alpha: Math.random() * 0.7 + 0.3
    }));

    function draw() {
        ctx.clearRect(0, 0, width, height);

        particles.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.alpha;
            ctx.fill();

            p.y -= p.speedY;
            if (p.y < 0) {
                p.y = height;
                p.x = Math.random() * width;
            }
        });

        requestAnimationFrame(draw);
    }

    draw();
}

// 2. F1 CANVAS: QUANTUM / RGB RACING CARS
function initF1CarsCanvas() {
    const canvas = document.getElementById('f1-cars-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const f1Section = document.getElementById('f1-section');
    let width, height;

    function resize() {
        width = canvas.width = f1Section.offsetWidth;
        height = canvas.height = f1Section.offsetHeight;
    }

    window.addEventListener('resize', resize);
    resize();

    const colors = ['#00f3ff', '#ff007f', '#a855f7', '#facc15', '#22c55e'];
    const cars = Array.from({ length: 8 }, () => createCar(true));

    function createCar(randomX = false) {
        const lane = Math.floor(Math.random() * 5);
        return {
            x: randomX ? Math.random() * width : -60,
            y: 40 + (lane * (height / 5)),
            speed: Math.random() * 3 + 2,
            length: Math.random() * 15 + 25,
            height: 8,
            color: colors[Math.floor(Math.random() * colors.length)]
        };
    }

    function drawCar(car) {
        ctx.save();
        ctx.shadowBlur = 12;
        ctx.shadowColor = car.color;

        const gradient = ctx.createLinearGradient(car.x - car.length * 1.5, car.y, car.x, car.y);
        gradient.addColorStop(0, 'transparent');
        gradient.addColorStop(1, car.color);

        ctx.fillStyle = gradient;
        ctx.fillRect(car.x - car.length * 1.5, car.y + 2, car.length * 1.5, car.height - 4);

        ctx.fillStyle = car.color;
        ctx.fillRect(car.x, car.y + 2, car.length, car.height - 4);
        ctx.fillRect(car.x + car.length - 4, car.y, 6, car.height);
        
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(car.x + 4, car.y - 2, 6, 3);
        ctx.fillRect(car.x + 4, car.y + car.height - 1, 6, 3);
        ctx.fillRect(car.x + car.length - 8, car.y - 2, 6, 3);
        ctx.fillRect(car.x + car.length - 8, car.y + car.height - 1, 6, 3);

        ctx.restore();
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);

        cars.forEach((car, index) => {
            car.x += car.speed;
            drawCar(car);

            if (car.x - car.length * 2 > width) {
                cars[index] = createCar(false);
            }
        });

        requestAnimationFrame(animate);
    }

    animate();
}

// 3. GTA CANVAS: DARK DYNAMIC CITY
function initGTACityCanvas() {
    const canvas = document.getElementById('gta-city-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const gtaSection = document.getElementById('gta-section');
    let width, height;

    function resize() {
        width = canvas.width = gtaSection.offsetWidth;
        height = canvas.height = gtaSection.offsetHeight;
    }

    window.addEventListener('resize', resize);
    resize();

    const buildings = [];
    let currentX = 0;
    while (currentX < 2000) {
        const bWidth = Math.random() * 40 + 35;
        const bHeight = Math.random() * (height * 0.45) + (height * 0.2);
        
        const windows = [];
        const rows = Math.floor(bHeight / 14);
        const cols = Math.floor(bWidth / 10);
        
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (Math.random() > 0.45) {
                    windows.push({
                        relX: c * 8 + 4,
                        relY: r * 12 + 6,
                        color: Math.random() > 0.2 ? '#ff007f' : '#00f3ff',
                        on: Math.random() > 0.2
                    });
                }
            }
        }

        buildings.push({
            x: currentX,
            width: bWidth,
            height: bHeight,
            windows: windows
        });
        currentX += bWidth + 3;
    }

    const spotlights = [
        { angle: 0, speed: 0.015, color: 'rgba(0, 243, 255, 0.15)', originX: width * 0.2 },
        { angle: Math.PI, speed: -0.01, color: 'rgba(255, 0, 127, 0.15)', originX: width * 0.8 }
    ];

    function animate() {
        ctx.clearRect(0, 0, width, height);

        const groundY = height;

        buildings.forEach(b => {
            const bY = groundY - b.height;
            
            ctx.fillStyle = '#0a0a14';
            ctx.fillRect(b.x, bY, b.width, b.height);
            
            ctx.strokeStyle = 'rgba(255, 0, 127, 0.15)';
            ctx.strokeRect(b.x, bY, b.width, b.height);

            b.windows.forEach(w => {
                if (Math.random() < 0.002) w.on = !w.on;

                if (w.on) {
                    ctx.fillStyle = w.color;
                    ctx.shadowBlur = 6;
                    ctx.shadowColor = w.color;
                    ctx.fillRect(b.x + w.relX, bY + w.relY, 4, 6);
                    ctx.shadowBlur = 0;
                }
            });
        });

        spotlights.forEach(s => {
            s.angle += s.speed;
            const beamX = s.originX + Math.sin(s.angle) * (width * 0.3);
            
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(beamX, 0);
            ctx.lineTo(beamX - 60, height);
            ctx.lineTo(beamX + 60, height);
            ctx.closePath();

            const beamGrad = ctx.createLinearGradient(beamX, 0, beamX, height);
            beamGrad.addColorStop(0, s.color);
            beamGrad.addColorStop(1, 'transparent');

            ctx.fillStyle = beamGrad;
            ctx.fill();
            ctx.restore();
        });

        requestAnimationFrame(animate);
    }

    animate();
}

// 4. RETRO CANVAS: NES / SEGA 8-BIT PIXEL ARCADE (TETRIS BLOCKS & D-PADS)
function initRandomsArcadeCanvas() {
    const canvas = document.getElementById('randoms-arcade-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const section = document.getElementById('randoms-section');
    let width, height;

    function resize() {
        width = canvas.width = section.offsetWidth;
        height = canvas.height = section.offsetHeight;
    }

    window.addEventListener('resize', resize);
    resize();

    const neonColors = ['#00f3ff', '#a855f7', '#facc15', '#ff007f', '#22c55e'];
    const pixelSize = 6; // 8-bit grid pixel size

    // Tetris & Pixel Shapes Matrices
    const shapes = [
        // I-Block
        [[1, 1, 1, 1]],
        // O-Block
        [[1, 1], [1, 1]],
        // T-Block
        [[0, 1, 0], [1, 1, 1]],
        // L-Block
        [[1, 0], [1, 0], [1, 1]],
        // Retro D-Pad (Cross)
        [[0, 1, 0], [1, 1, 1], [0, 1, 0]]
    ];

    const blocks = Array.from({ length: 14 }, () => createFloatingBlock(true));

    function createFloatingBlock(randomY = false) {
        const matrix = shapes[Math.floor(Math.random() * shapes.length)];
        return {
            x: Math.random() * width,
            y: randomY ? Math.random() * height : height + 30,
            speedY: Math.random() * 0.6 + 0.3,
            color: neonColors[Math.floor(Math.random() * neonColors.length)],
            matrix: matrix,
            alpha: Math.random() * 0.6 + 0.4
        };
    }

    function drawPixelMatrix(block) {
        ctx.save();
        ctx.globalAlpha = block.alpha;
        ctx.fillStyle = block.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = block.color;

        block.matrix.forEach((row, rIdx) => {
            row.forEach((val, cIdx) => {
                if (val === 1) {
                    const pX = block.x + (cIdx * pixelSize);
                    const pY = block.y + (rIdx * pixelSize);
                    ctx.fillRect(pX, pY, pixelSize - 1, pixelSize - 1);
                }
            });
        });

        ctx.restore();
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);

        // Draw Retro Grid Lines in Background
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.05)';
        ctx.lineWidth = 1;
        const gridSize = 30;

        for (let x = 0; x < width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }

        for (let y = 0; y < height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }

        // Move and render retro floating blocks
        blocks.forEach((b, idx) => {
            b.y -= b.speedY;
            drawPixelMatrix(b);

            if (b.y < -40) {
                blocks[idx] = createFloatingBlock(false);
            }
        });

        requestAnimationFrame(animate);
    }

    animate();
}