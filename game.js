const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const livesElement = document.getElementById('lives');
const gameOverElement = document.getElementById('gameOver');
const finalScoreElement = document.getElementById('finalScore');

// Game objects
const cat = {
    x: canvas.width / 2,
    y: canvas.height - 100,
    width: 80,
    height: 80,
    speed: 8,  // Increased base speed
    baseSpeed: 8
};

let score = 0;
let lives = 3;
let treats = [];
let gameLoop;
let keys = {};
let gameActive = true;
let gameSpeed = 1;  // Speed multiplier
let lastSpeedIncrease = 0;  // Track when to increase speed
let bgmStarted = false;

// Load cat image
const catImg = new Image();
catImg.src = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/39.png';  // Jigglypuff

// Treat types
const treatTypes = [
    { color: '#ff6b6b', points: 10, speed: 4, probability: 0.5 },  // Regular treat
    { color: '#4CAF50', points: 20, speed: 5, probability: 0.3 },  // Special treat
    { color: '#FFD700', points: 50, speed: 6, probability: 0.15 }, // Golden treat
    { color: '#9C27B0', points: 100, speed: 7, probability: 0.05 }  // Ultra rare treat
];

// Audio elements
const bgm = document.getElementById('bgm');
const sfxCatch = document.getElementById('sfx-catch');
const sfxMiss = document.getElementById('sfx-miss');
const sfxGameOver = document.getElementById('sfx-gameover');
const sfxCombo = document.getElementById('sfx-combo');

function playBGM() {
    bgm.currentTime = 0;
    bgm.volume = 0.5;
    bgm.play();
}
function stopBGM() {
    bgm.pause();
    bgm.currentTime = 0;
}
function playSFX(audio) {
    try {
        audio.currentTime = 0;
        audio.play();
    } catch (e) {
        // Ignore playback errors
    }
}

// Event listeners
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Mobile controls
const btnLeft = document.getElementById('btn-left');
const btnRight = document.getElementById('btn-right');
let leftPressed = false;
let rightPressed = false;

if (btnLeft && btnRight) {
    btnLeft.addEventListener('touchstart', function(e) {
        e.preventDefault();
        leftPressed = true;
        keys['ArrowLeft'] = true;
    });
    btnLeft.addEventListener('touchend', function(e) {
        e.preventDefault();
        leftPressed = false;
        keys['ArrowLeft'] = false;
    });
    btnRight.addEventListener('touchstart', function(e) {
        e.preventDefault();
        rightPressed = true;
        keys['ArrowRight'] = true;
    });
    btnRight.addEventListener('touchend', function(e) {
        e.preventDefault();
        rightPressed = false;
        keys['ArrowRight'] = false;
    });
}

// Create treat
function createTreat() {
    const rand = Math.random();
    let treatType = treatTypes[0];
    let cumulativeProbability = 0;

    for (const type of treatTypes) {
        cumulativeProbability += type.probability;
        if (rand <= cumulativeProbability) {
            treatType = type;
            break;
        }
    }

    return {
        x: Math.random() * (canvas.width - 20),
        y: -20,
        width: 20,
        height: 20,
        speed: treatType.speed * gameSpeed,
        color: treatType.color,
        points: treatType.points,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.1
    };
}

// Update game state
function update() {
    if (!gameActive) return;

    // Increase game speed based on score
    if (score - lastSpeedIncrease >= 100) {
        gameSpeed += 0.1;
        lastSpeedIncrease = score;
        cat.speed = cat.baseSpeed * (1 + (gameSpeed - 1) * 0.5);  // Increase cat speed with game speed
    }

    // Move cat with momentum
    if (keys['ArrowLeft'] && cat.x > 0) {
        cat.x -= cat.speed;
    }
    if (keys['ArrowRight'] && cat.x < canvas.width - cat.width) {
        cat.x += cat.speed;
    }

    // Move treats
    for (let i = treats.length - 1; i >= 0; i--) {
        const treat = treats[i];
        treat.y += treat.speed;
        treat.rotation += treat.rotationSpeed;

        // Check collision
        if (treat.y + treat.height > cat.y &&
            treat.x + treat.width > cat.x &&
            treat.x < cat.x + cat.width) {
            treats.splice(i, 1);
            score += treat.points;
            scoreElement.textContent = `Score: ${score}`;
            createParticleEffect(treat.x, treat.y, treat.color);
            // Play catch sound for all treats
            playSFX(sfxCatch);
            // Play combo/bonus sound for special treats
            if (treat.points >= 50) {
                playSFX(sfxCombo);
            }
            // Add combo effect
            if (score % 50 === 0) {
                createComboEffect();
                playSFX(sfxCombo);
            }
        }
        // Remove treats that fall off screen
        else if (treat.y > canvas.height) {
            treats.splice(i, 1);
            lives--;
            livesElement.textContent = `Lives: ${lives}`;
            playSFX(sfxMiss);
            if (lives <= 0) {
                gameOver();
            }
        }
    }

    // Add new treats randomly with increasing frequency
    if (Math.random() < 0.02 * gameSpeed) {
        treats.push(createTreat());
    }
}

// Particle effect for catching treats
const particles = [];
function createParticleEffect(x, y, color) {
    for (let i = 0; i < 15; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            life: 1,
            color: color,
            size: Math.random() * 4 + 2
        });
    }
}

// Combo effect
function createComboEffect() {
    for (let i = 0; i < 30; i++) {
        particles.push({
            x: canvas.width / 2,
            y: canvas.height / 2,
            vx: (Math.random() - 0.5) * 15,
            vy: (Math.random() - 0.5) * 15,
            life: 1,
            color: '#FFD700',
            size: Math.random() * 6 + 3
        });
    }
}

// Draw game objects
function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw cat
    ctx.save();
    ctx.translate(cat.x + cat.width/2, cat.y + cat.height/2);
    ctx.rotate(Math.sin(Date.now() * 0.005) * 0.1);  // Gentle floating animation
    ctx.drawImage(catImg, -cat.width/2, -cat.height/2, cat.width, cat.height);
    ctx.restore();

    // Draw treats
    treats.forEach(treat => {
        ctx.save();
        ctx.translate(treat.x + treat.width/2, treat.y + treat.height/2);
        ctx.rotate(treat.rotation);
        ctx.beginPath();
        ctx.arc(0, 0, treat.width/2, 0, Math.PI * 2);
        ctx.fillStyle = treat.color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
    });

    // Draw particles
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color + Math.floor(p.life * 255).toString(16).padStart(2, '0');
        ctx.fill();
        
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02;
        
        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

// Game over
function gameOver() {
    gameActive = false;
    finalScoreElement.textContent = score;
    gameOverElement.style.display = 'block';
    stopBGM();
    playSFX(sfxGameOver);
}

// Restart game
function restartGame() {
    score = 0;
    lives = 3;
    treats = [];
    particles.length = 0;
    gameActive = true;
    gameSpeed = 1; // Reset speed
    lastSpeedIncrease = 0; // Reset speed increase tracker
    cat.speed = cat.baseSpeed;
    scoreElement.textContent = `Score: ${score}`;
    livesElement.textContent = `Lives: ${lives}`;
    gameOverElement.style.display = 'none';
    playBGM();
    gameStep();
}

// Game loop
function gameStep() {
    update();
    draw();
    gameLoop = requestAnimationFrame(gameStep);
}

// Start game
function startBGMOnUserInteraction() {
    if (!bgmStarted) {
        playBGM();
        bgmStarted = true;
        window.removeEventListener('click', startBGMOnUserInteraction);
        window.removeEventListener('keydown', startBGMOnUserInteraction);
    }
}
window.addEventListener('click', startBGMOnUserInteraction);
window.addEventListener('keydown', startBGMOnUserInteraction);
gameStep(); 