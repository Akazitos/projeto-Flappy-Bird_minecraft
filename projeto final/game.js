const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const gameOverElement = document.getElementById('gameOver');
const finalScoreElement = document.getElementById('finalScore');
const startScreenElement = document.getElementById('startScreen');

// Sons
const somPonto = new Audio("sons/Minecraft xp sound effect (mp3cut.net).mp3");
const trilhaSonora = new Audio("sons/trilha.mp3");
trilhaSonora.loop = true;
trilhaSonora.volume = 0.5;

// Imagens
const backgroundImage = new Image();
backgroundImage.src = 'https://minecraft.wiki/images/thumb/The_Nether.png/800px-The_Nether.png?1d728';

const birdImage = new Image();
birdImage.src = 'https://github.com/Akazitos/projeto-1/blob/main/imagens/image-removebg-preview.png?raw=true';

const pipeTexture = new Image();
pipeTexture.src = 'https://preview.redd.it/6xbfsdu2ud1a1.jpg?width=640&crop=smart&auto=webp&s=a474d22f291b1daa94a2ed7c5a76da18b767f7d9';

// Imagem loading
let imagesLoaded = 0;
const totalImages = 3;

function imageLoaded() {
    imagesLoaded++;
    if (imagesLoaded === totalImages) {
        console.log('All images loaded');
    }
}

backgroundImage.onload = imageLoaded;
birdImage.onload = imageLoaded;
pipeTexture.onload = imageLoaded;

backgroundImage.onerror = () => console.error('Failed to load background image');
birdImage.onerror = () => console.error('Failed to load bird image');
pipeTexture.onerror = () => console.error('Failed to load pipe texture');

let bird = {
    x: 100,
    y: canvas.height / 2,
    velocity: 0,
    gravity: 0.5,
    lift: -7,
    width: 40,
    height: 40
};

let pipes = [];
let score = 0;
let highScore = localStorage.getItem('highScore') || 0;
let gameState = 'start';
const pipeWidth = 50;
const pipeGap = 150;
const pipeSpeed = 2;
const pipeFrequency = 80;
let frameCount = 0;
let backgroundX = 0;
const backgroundSpeed = 0.5;

function drawBird() {
    ctx.drawImage(birdImage, bird.x - bird.width / 2, bird.y - bird.height / 2, bird.width, bird.height);
}

function drawPipes() {
    pipes.forEach(pipe => {
        ctx.drawImage(pipeTexture, pipe.x, 0, pipeWidth, pipe.top);
        ctx.drawImage(pipeTexture, pipe.x, pipe.top + pipeGap, pipeWidth, canvas.height - pipe.top - pipeGap);
    });
}

function updateBird() {
    bird.velocity += bird.gravity;
    bird.y += bird.velocity;

    if (bird.y + bird.height / 2 > canvas.height || bird.y - bird.height / 2 < 0) {
        gameState = 'over';
    }
}

function updatePipes() {
    if (frameCount % pipeFrequency === 0) {
        let topHeight = Math.random() * (canvas.height - pipeGap - 100) + 50;
        pipes.push({ x: canvas.width, top: topHeight, scored: false });
    }

    pipes.forEach(pipe => {
        pipe.x -= pipeSpeed;

        if (!pipe.scored && pipe.x + pipeWidth < bird.x && gameState === 'playing') {
            score++;
            somPonto.play();
            pipe.scored = true;
            scoreElement.textContent = `Score: ${score}`;
        }
    });

    pipes = pipes.filter(pipe => pipe.x + pipeWidth >= 0);
}

function checkCollision() {
    const padding = 8;

    const birdLeft = bird.x - bird.width / 2 + padding;
    const birdRight = bird.x + bird.width / 2 - padding;
    const birdTop = bird.y - bird.height / 2 + padding;
    const birdBottom = bird.y + bird.height / 2 - padding;

    pipes.forEach(pipe => {
        const pipeLeft = pipe.x;
        const pipeRight = pipe.x + pipeWidth;
        const pipeBottomTop = pipe.top + pipeGap;

        const collidedTop = birdRight > pipeLeft && birdLeft < pipeRight && birdTop < pipe.top;
        const collidedBottom = birdRight > pipeLeft && birdLeft < pipeRight && birdBottom > pipeBottomTop;

        if (collidedTop || collidedBottom) {
            gameState = 'over';
            trilhaSonora.pause();
        }
    });
}

function updateHighScore() {
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
    }
    finalScoreElement.textContent = `${score} | High Score: ${highScore}`;
}

function startCountdown(callback) {
    let countdown = 3;
    gameState = 'countdown';
    canvas.style.display = 'block';
    startScreenElement.style.display = 'none';
    scoreElement.style.display = 'block';
    scoreElement.textContent = `Score: ${score}`;
    gameOverElement.style.display = 'none';

    function drawCountdown() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
        ctx.font = 'bold 72px Arial';
        ctx.fillStyle = '#3010E0';
        ctx.textAlign = 'center';
        ctx.fillText(countdown, canvas.width / 2, canvas.height / 2);
    }

    drawCountdown();

    const countdownInterval = setInterval(() => {
        countdown--;
        if (countdown > 0) {
            drawCountdown();
        } else {
            clearInterval(countdownInterval);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            backgroundX = 0;
            callback();
        }
    }, 1000);
}

function gameLoop() {
    if (gameState === 'over') {
        gameOverElement.style.display = 'block';
        updateHighScore();
        return;
    }
    if (gameState === 'playing') {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        backgroundX -= backgroundSpeed;
        if (backgroundX <= -canvas.width) backgroundX += canvas.width;

        ctx.drawImage(backgroundImage, backgroundX, 0, canvas.width, canvas.height);
        ctx.drawImage(backgroundImage, backgroundX + canvas.width, 0, canvas.width, canvas.height);

        drawBird();
        drawPipes();
        updateBird();
        updatePipes();
        checkCollision();
        frameCount++;
    }
    requestAnimationFrame(gameLoop);
}

function startGame() {
    if (imagesLoaded < totalImages) {
        console.log('Waiting for images to load...');
        return;
    }
    trilhaSonora.currentTime = 0;
    trilhaSonora.play();
    startCountdown(() => {
        gameState = 'playing';
        gameLoop();
    });
}

function restartGame() {
    bird.y = canvas.height / 2;
    bird.velocity = 0;
    pipes = [];
    score = 0;
    frameCount = 0;
    backgroundX = 0;
    startCountdown(() => {
        gameState = 'playing';
        trilhaSonora.currentTime = 0;
        trilhaSonora.play();
        gameLoop();
    });
}

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        if (gameState === 'playing') {
            bird.velocity = bird.lift;
        } else if (gameState === 'over') {
            restartGame();
        }
    }
});

canvas.addEventListener('touchstart', (e) => {
    if (gameState === 'playing') {
        bird.velocity = bird.lift;
        e.preventDefault();
    }
});

canvas.addEventListener('click', () => {
    if (gameState === 'playing') {
        bird.velocity = bird.lift;
    }
});