// 게임 요소
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const finalScoreElement = document.getElementById('finalScore');
const finalHighScoreElement = document.getElementById('finalHighScore');

// 캔버스 크기 설정
canvas.width = 800;
canvas.height = 600;

// 게임 상태
let gameLoop;
let score = 0;
let highScore = localStorage.getItem('brickBreakerHighScore') || 0;
let isGameOver = false;
let isPaused = false;

// 패들 설정
const paddle = {
    width: 120,
    height: 15,
    x: canvas.width / 2 - 60,
    y: canvas.height - 30,
    speed: 12,
    dx: 0
};

// 공 설정
const ball = {
    radius: 10,
    x: canvas.width / 2,
    y: canvas.height - 50,
    speed: 5,
    dx: 5,
    dy: -5
};

// 벽돌 설정
const brickRowCount = 6;
const brickColumnCount = 10;
const brickWidth = 65;
const brickHeight = 25;
const brickPadding = 10;
const brickOffsetTop = 60;
const brickOffsetLeft = 45;

const bricks = [];
for (let c = 0; c < brickColumnCount; c++) {
    bricks[c] = [];
    for (let r = 0; r < brickRowCount; r++) {
        const brickX = c * (brickWidth + brickPadding) + brickOffsetLeft;
        const brickY = r * (brickHeight + brickPadding) + brickOffsetTop;
        bricks[c][r] = { x: brickX, y: brickY, status: 1 };
    }
}

// 키보드 컨트롤
let rightPressed = false;
let leftPressed = false;

document.addEventListener('keydown', (e) => {
    if (e.key === 'Right' || e.key === 'ArrowRight') rightPressed = true;
    if (e.key === 'Left' || e.key === 'ArrowLeft') leftPressed = true;
    if (e.key === 'r' || e.key === 'R') restartGame();
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'Right' || e.key === 'ArrowRight') rightPressed = false;
    if (e.key === 'Left' || e.key === 'ArrowLeft') leftPressed = false;
});

// 터치 컨트롤 개선
let touchX = null;
let touchSensitivity = 1.5; // 터치 감도 조절

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault(); // 스크롤 방지
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    touchX = touch.clientX - rect.left;
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (!touchX) return;
    
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const currentX = touch.clientX - rect.left;
    
    // 터치 감도를 높이고 부드럽게 이동
    const deltaX = (currentX - touchX) * touchSensitivity;
    paddle.x = Math.max(0, Math.min(canvas.width - paddle.width, paddle.x + deltaX));
    
    touchX = currentX;
});

canvas.addEventListener('touchend', () => {
    touchX = null;
});

// 충돌 감지
function collisionDetection() {
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            const brick = bricks[c][r];
            if (brick.status === 1) {
                if (
                    ball.x > brick.x &&
                    ball.x < brick.x + brickWidth &&
                    ball.y > brick.y &&
                    ball.y < brick.y + brickHeight
                ) {
                    ball.dy = -ball.dy;
                    brick.status = 0;
                    updateScore(10);
                    
                    // 모든 벽돌이 깨졌는지 확인
                    if (checkWin()) {
                        showGameOver(true);
                        return;
                    }
                }
            }
        }
    }
}

// 승리 확인
function checkWin() {
    return bricks.every(column => column.every(brick => brick.status === 0));
}

// 점수 업데이트
function updateScore(points) {
    score += points;
    scoreElement.textContent = score;
    
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('brickBreakerHighScore', highScore);
        highScoreElement.textContent = highScore;
    }
}

// 게임 오버 화면
function showGameOver(isWin = false) {
    isGameOver = true;
    cancelAnimationFrame(gameLoop);
    
    finalScoreElement.textContent = score;
    finalHighScoreElement.textContent = highScore;
    gameOverScreen.classList.remove('hidden');
    
    const gameOverTitle = gameOverScreen.querySelector('h2');
    gameOverTitle.textContent = isWin ? '승리!' : '게임 오버!';
    gameOverTitle.style.color = isWin ? 'var(--success-color)' : 'var(--accent-color)';
}

// 게임 재시작
function restartGame() {
    isGameOver = false;
    score = 0;
    scoreElement.textContent = '0';
    gameOverScreen.classList.add('hidden');
    
    // 공과 패들 위치 초기화
    ball.x = canvas.width / 2;
    ball.y = canvas.height - 50;
    ball.dx = 5;
    ball.dy = -5;
    paddle.x = canvas.width / 2 - paddle.width / 2;
    
    // 벽돌 초기화
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            bricks[c][r].status = 1;
        }
    }
    
    // 게임 시작
    startGame();
}

// 게임 요소 그리기
function drawBall() {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.closePath();
}

function drawPaddle() {
    ctx.beginPath();
    ctx.rect(paddle.x, paddle.y, paddle.width, paddle.height);
    ctx.fillStyle = '#2ecc71';
    ctx.fill();
    ctx.closePath();
}

function drawBricks() {
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            if (bricks[c][r].status === 1) {
                ctx.beginPath();
                ctx.rect(bricks[c][r].x, bricks[c][r].y, brickWidth, brickHeight);
                ctx.fillStyle = `hsl(${c * 30 + r * 20}, 70%, 60%)`;
                ctx.fill();
                ctx.closePath();
            }
        }
    }
}

// 게임 업데이트
function update() {
    if (isGameOver) return;
    
    // 패들 이동
    if (rightPressed && paddle.x < canvas.width - paddle.width) {
        paddle.x += paddle.speed;
    }
    if (leftPressed && paddle.x > 0) {
        paddle.x -= paddle.speed;
    }
    
    // 공 이동
    ball.x += ball.dx;
    ball.y += ball.dy;
    
    // 벽 충돌
    if (ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) {
        ball.dx = -ball.dx;
    }
    if (ball.y - ball.radius < 0) {
        ball.dy = -ball.dy;
    }
    
    // 패들 충돌
    if (
        ball.y + ball.radius > paddle.y &&
        ball.x > paddle.x &&
        ball.x < paddle.x + paddle.width
    ) {
        ball.dy = -ball.dy;
        
        // 패들의 위치에 따라 공의 방향 변경
        const hitPoint = (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
        ball.dx = hitPoint * 5;
    }
    
    // 바닥 충돌 (게임 오버)
    if (ball.y + ball.radius > canvas.height) {
        showGameOver();
    }
    
    // 벽돌 충돌
    collisionDetection();
}

// 게임 렌더링
function draw() {
    // 화면 클리어
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 게임 요소 그리기
    drawBricks();
    drawBall();
    drawPaddle();
    
    // 게임 상태 업데이트
    update();
    
    // 다음 프레임
    if (!isGameOver) {
        gameLoop = requestAnimationFrame(draw);
    }
}

// 화면 크기에 따른 게임 요소 조정
function resizeGame() {
    const container = canvas.parentElement;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    // 캔버스 크기 조정
    if (window.innerWidth <= 768) {
        canvas.width = containerWidth;
        canvas.height = 450;
    } else {
        canvas.width = 800;
        canvas.height = 600;
    }
    
    // 게임 요소 위치 재조정
    paddle.y = canvas.height - 30;
    paddle.x = canvas.width / 2 - paddle.width / 2;
    ball.x = canvas.width / 2;
    ball.y = canvas.height - 50;
    
    // 벽돌 재배치
    const brickTotalWidth = brickColumnCount * (brickWidth + brickPadding) - brickPadding;
    const newOffsetLeft = (canvas.width - brickTotalWidth) / 2;
    
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            if (bricks[c] && bricks[c][r]) {
                const brickX = c * (brickWidth + brickPadding) + newOffsetLeft;
                const brickY = r * (brickHeight + brickPadding) + brickOffsetTop;
                bricks[c][r].x = brickX;
                bricks[c][r].y = brickY;
            }
        }
    }
}

// 윈도우 리사이즈 이벤트
window.addEventListener('resize', () => {
    resizeGame();
});

// 게임 시작 시 크기 초기화
function startGame() {
    startScreen.classList.add('hidden');
    resizeGame();
    draw();
}

// 이벤트 리스너
startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', restartGame);

// 최고 점수 표시
highScoreElement.textContent = highScore; 