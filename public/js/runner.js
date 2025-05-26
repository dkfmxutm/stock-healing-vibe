// 게임 요소
const character = document.getElementById('character');
const obstacle = document.getElementById('obstacle');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const levelElement = document.getElementById('level');
const finalScoreElement = document.getElementById('finalScore');
const finalHighScoreElement = document.getElementById('finalHighScore');
const gameOverScreen = document.getElementById('gameOver');
const restartBtn = document.getElementById('restartBtn');
const changeCharacterBtn = document.getElementById('changeCharacterBtn');
const game = document.getElementById('game');
const characterSelect = document.getElementById('characterSelect');
const gameScreen = document.getElementById('gameScreen');
const startGameBtn = document.getElementById('startGameBtn');
const parallaxLayers = document.querySelectorAll('.bg-layer');

// 게임 상태
let isJumping = false;
let isGameOver = false;
let score = 0;
let highScore = localStorage.getItem('runnerHighScore') || 0;
let level = 1;
let obstacleSpeed = 4;
let selectedCharacter = null;
let gameLoop;
let obstacleInterval;
let difficultyInterval;

// 캐릭터 설정
const characters = {
    bull: {
        jumpHeight: 220,
        jumpDuration: 600,
        emoji: '🐃'
    },
    bear: {
        jumpHeight: 200,
        jumpDuration: 500,
        emoji: '🐻'
    },
    rabbit: {
        jumpHeight: 180,
        jumpDuration: 400,
        emoji: '🐰'
    }
};

// 난이도 설정
const difficultyLevels = {
    1: { speed: 4, interval: 2000, scoreMultiplier: 1 },
    2: { speed: 5, interval: 1800, scoreMultiplier: 1.2 },
    3: { speed: 6, interval: 1600, scoreMultiplier: 1.4 },
    4: { speed: 7, interval: 1400, scoreMultiplier: 1.6 },
    5: { speed: 8, interval: 1200, scoreMultiplier: 1.8 },
    6: { speed: 9, interval: 1000, scoreMultiplier: 2 },
    7: { speed: 10, interval: 900, scoreMultiplier: 2.2 },
    8: { speed: 11, interval: 800, scoreMultiplier: 2.4 },
    9: { speed: 12, interval: 700, scoreMultiplier: 2.6 },
    10: { speed: 13, interval: 600, scoreMultiplier: 3 }
};

// 캐릭터 선택 이벤트
document.querySelectorAll('.character-option').forEach(option => {
    option.addEventListener('click', () => {
        document.querySelectorAll('.character-option').forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');
        selectedCharacter = option.dataset.character;
        startGameBtn.disabled = false;
    });
});

// 게임 시작
startGameBtn.addEventListener('click', () => {
    if (!selectedCharacter) return;
    
    characterSelect.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    
    // 선택된 캐릭터 설정 적용
    character.className = selectedCharacter;
    const characterConfig = characters[selectedCharacter];
    character.style.setProperty('--jump-height', `${characterConfig.jumpHeight}px`);
    character.style.setProperty('--jump-duration', `${characterConfig.jumpDuration}ms`);
    character.querySelector('.character-emoji').textContent = characterConfig.emoji;
    
    startGame();
});

// 점프 함수
function jump() {
    if (isJumping || isGameOver) return;
    
    isJumping = true;
    character.classList.add('jump');
    
    // 먼지 효과
    const dustEffect = character.querySelector('.dust-effect');
    dustEffect.style.animation = 'dustPoof 0.3s ease-out';
    
    setTimeout(() => {
        character.classList.remove('jump');
        isJumping = false;
        dustEffect.style.animation = '';
    }, characters[selectedCharacter].jumpDuration);
}

// 패럴랙스 효과
function updateParallax() {
    parallaxLayers.forEach(layer => {
        const speed = layer.dataset.speed;
        const xPos = (game.offsetWidth * speed) % game.offsetWidth;
        layer.style.transform = `translateX(${-xPos}px)`;
    });
}

// 장애물 생성 및 이동
function createObstacle() {
    if (isGameOver) return;

    const newObstacle = document.createElement('div');
    newObstacle.className = 'obstacle';
    newObstacle.innerHTML = '<div class="obstacle-sprite"></div>';
    game.appendChild(newObstacle);
    
    let position = game.offsetWidth;
    newObstacle.style.right = '0px';
    
    function moveObstacle() {
        if (isGameOver) {
            newObstacle.remove();
            return;
        }
        
        position -= obstacleSpeed;
        newObstacle.style.right = `${game.offsetWidth - position}px`;
        
        // 충돌 감지
        const characterRect = character.getBoundingClientRect();
        const obstacleRect = newObstacle.getBoundingClientRect();
        
        if (
            characterRect.right - 20 > obstacleRect.left &&
            characterRect.left + 20 < obstacleRect.right &&
            characterRect.bottom - 10 > obstacleRect.top
        ) {
            gameOver();
            return;
        }
        
        // 장애물이 화면을 벗어나면 제거
        if (position < -50) {
            newObstacle.remove();
            updateScore(100 * difficultyLevels[level].scoreMultiplier);
            return;
        }
        
        requestAnimationFrame(moveObstacle);
    }
    
    requestAnimationFrame(moveObstacle);
}

// 점수 업데이트
function updateScore(points) {
    score += points;
    scoreElement.textContent = Math.floor(score);
    
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('runnerHighScore', highScore);
        highScoreElement.textContent = Math.floor(highScore);
    }
    
    // 레벨 업 체크
    const newLevel = Math.min(10, Math.floor(score / 1000) + 1);
    if (newLevel > level) {
        levelUp(newLevel);
    }
}

// 레벨 업
function levelUp(newLevel) {
    level = newLevel;
    levelElement.textContent = level;
    
    // 난이도 설정 적용
    const difficulty = difficultyLevels[level];
    obstacleSpeed = difficulty.speed;
    
    // 레벨 업 효과
    levelElement.style.animation = 'none';
    levelElement.offsetHeight; // 리플로우 강제
    levelElement.style.animation = 'fadeInUp 0.5s ease';
    
    // 장애물 생성 간격 조정
    clearInterval(obstacleInterval);
    obstacleInterval = setInterval(createObstacle, difficulty.interval);
}

// 게임 오버
function gameOver() {
    isGameOver = true;
    clearInterval(obstacleInterval);
    finalScoreElement.textContent = Math.floor(score);
    finalHighScoreElement.textContent = Math.floor(highScore);
    gameOverScreen.classList.remove('hidden');
}

// 게임 재시작
function restartGame() {
    // 게임 상태 초기화
    isGameOver = false;
    score = 0;
    level = 1;
    obstacleSpeed = difficultyLevels[1].speed;
    
    // UI 초기화
    scoreElement.textContent = '0';
    levelElement.textContent = '1';
    highScoreElement.textContent = Math.floor(highScore);
    gameOverScreen.classList.add('hidden');
    
    // 장애물 제거
    document.querySelectorAll('.obstacle').forEach(obs => obs.remove());
    
    // 게임 다시 시작
    startGame();
}

// 캐릭터 변경
changeCharacterBtn.addEventListener('click', () => {
    gameScreen.classList.add('hidden');
    characterSelect.classList.remove('hidden');
    gameOverScreen.classList.add('hidden');
    
    // 게임 상태 초기화
    isGameOver = false;
    score = 0;
    level = 1;
    
    // 장애물 제거
    document.querySelectorAll('.obstacle').forEach(obs => obs.remove());
});

// 게임 시작
function startGame() {
    // 초기 설정
    const difficulty = difficultyLevels[1];
    obstacleSpeed = difficulty.speed;
    
    // 기존 장애물 제거
    document.querySelectorAll('.obstacle').forEach(obs => obs.remove());
    
    // 장애물 생성 시작
    clearInterval(obstacleInterval);
    obstacleInterval = setInterval(createObstacle, difficulty.interval);
    
    // 게임 루프 시작
    function gameLoop() {
        if (!isGameOver) {
            updateParallax();
            requestAnimationFrame(gameLoop);
        }
    }
    requestAnimationFrame(gameLoop);
}

// 이벤트 리스너
document.addEventListener('keydown', (event) => {
    if (event.code === 'Space') {
        event.preventDefault();
        jump();
    }
});

// 모바일 터치 지원
game.addEventListener('touchstart', (event) => {
    event.preventDefault();
    jump();
});

// 재시작 버튼
restartBtn.addEventListener('click', restartGame);

// 최고 점수 표시
highScoreElement.textContent = Math.floor(highScore); 