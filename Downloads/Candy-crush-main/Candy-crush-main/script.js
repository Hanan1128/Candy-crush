/**
 * Candy Crush - Bubbly Arcade Edition
 * Standardized Game Engine, Screen Transitions, Sound Manager, and Match-3 Gameplay Loop.
 */

// ========================================================
// 🔊 SOUND EFFECTS MANAGER (Web Audio API Synthesizer)
// ========================================================
const SoundManager = {
    audioCtx: null,
    enabled: true,

    init() {
        if (this.audioCtx) return;
        try {
            // Create AudioContext on demand (required by modern browsers)
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn("Web Audio API not supported", e);
        }
    },

    playMatch() {
        if (!this.enabled || !this.audioCtx) return;
        this.init();
        
        const now = this.audioCtx.currentTime;
        // Sweeping melodic match sound (3 cascading notes)
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, index) => {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + index * 0.08);
            
            gain.gain.setValueAtTime(0.15, now + index * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.01, now + index * 0.08 + 0.3);
            
            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            
            osc.start(now + index * 0.08);
            osc.stop(now + index * 0.08 + 0.35);
        });
    },

    playSwap() {
        if (!this.enabled || !this.audioCtx) return;
        this.init();
        
        const now = this.audioCtx.currentTime;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.1);
        
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        
        osc.start(now);
        osc.stop(now + 0.1);
    },

    playBloop() {
        if (!this.enabled || !this.audioCtx) return;
        this.init();
        
        const now = this.audioCtx.currentTime;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.setValueAtTime(120, now + 0.05);
        
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        
        osc.start(now);
        osc.stop(now + 0.15);
    },

    playLevelUp() {
        if (!this.enabled || !this.audioCtx) return;
        this.init();
        
        const now = this.audioCtx.currentTime;
        const notes = [523.25, 659.25, 783.99, 987.77, 1046.50]; // Sweet major 7th ascension
        notes.forEach((freq, index) => {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + index * 0.1);
            
            gain.gain.setValueAtTime(0.12, now + index * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.01, now + index * 0.1 + 0.4);
            
            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            
            osc.start(now + index * 0.1);
            osc.stop(now + index * 0.1 + 0.45);
        });
    },

    playGameOver() {
        if (!this.enabled || !this.audioCtx) return;
        this.init();
        
        const now = this.audioCtx.currentTime;
        const notes = [392.00, 349.23, 311.13, 261.63]; // Melancholy descending
        notes.forEach((freq, index) => {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + index * 0.15);
            
            gain.gain.setValueAtTime(0.15, now + index * 0.15);
            gain.gain.exponentialRampToValueAtTime(0.01, now + index * 0.15 + 0.45);
            
            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            
            osc.start(now + index * 0.15);
            osc.stop(now + index * 0.15 + 0.5);
        });
    }
};

// ========================================================
// 🎮 GAME STATE MANAGER & UI TRANSITIONS
// ========================================================
const GameStateManager = {
    score: 0,
    targetScore: 500,
    moves: 25,
    level: 1,
    currentGameInstance: null,

    init() {
        this.setupEventListeners();
        this.showScreen('splash-screen');
        
        // Splash screen auto-transition after 2.5 seconds
        setTimeout(() => {
            this.showScreen('main-menu');
        }, 2500);
    },

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
        }
    },

    setupEventListeners() {
        // Start game button
        document.getElementById('btn-start').addEventListener('click', () => {
            SoundManager.init();
            this.startNewGame();
        });

        // Sound Toggle Button
        const btnSound = document.getElementById('btn-sound');
        btnSound.addEventListener('click', () => {
            SoundManager.enabled = !SoundManager.enabled;
            if (SoundManager.enabled) {
                btnSound.classList.add('active');
                btnSound.textContent = 'ON';
                SoundManager.init();
                SoundManager.playSwap();
            } else {
                btnSound.classList.remove('active');
                btnSound.textContent = 'OFF';
            }
        });

        // Restart Game Button
        document.getElementById('btn-restart').addEventListener('click', () => {
            this.startNewGame();
        });

        // Main Menu button
        document.getElementById('btn-menu').addEventListener('click', () => {
            this.showScreen('main-menu');
        });
    },

    startNewGame() {
        this.score = 0;
        this.level = 1;
        this.targetScore = 500;
        this.moves = 25;
        
        document.getElementById('score-val').textContent = this.score;
        document.getElementById('target-val').textContent = this.targetScore;
        document.getElementById('moves-val').textContent = this.moves;
        
        this.showScreen('game-screen');
        
        // Destroy old loop/listeners if any
        if (this.currentGameInstance) {
            this.currentGameInstance.destroy();
        }
        
        // Spawn gameplay logic
        this.currentGameInstance = createGame();
    },

    addScore(points) {
        this.score += points;
        document.getElementById('score-val').textContent = this.score;
        
        // Check Level Up / Target achievement
        if (this.score >= this.targetScore) {
            this.triggerLevelUp();
        }
    },

    triggerLevelUp() {
        this.level++;
        this.targetScore = this.level * 500 + (this.level - 1) * 200; // Increment target
        this.moves = Math.min(25 + this.level * 2, 40); // Grant slightly more moves per level
        
        document.getElementById('target-val').textContent = this.targetScore;
        document.getElementById('moves-val').textContent = this.moves;
        
        SoundManager.playLevelUp();
        
        // Display nice level up overlay banner
        const banner = document.getElementById('game-banner');
        const bannerText = document.getElementById('banner-text');
        bannerText.textContent = `LEVEL ${this.level}!`;
        banner.classList.add('show');
        
        setTimeout(() => {
            banner.classList.remove('show');
        }, 1800);
    },

    useMove() {
        this.moves--;
        document.getElementById('moves-val').textContent = this.moves;
        
        if (this.moves <= 0) {
            this.endGame("Out of moves!");
        }
    },

    endGame(reason) {
        SoundManager.playGameOver();
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('game-over-reason').textContent = reason;
        
        if (this.currentGameInstance) {
            this.currentGameInstance.destroy();
            this.currentGameInstance = null;
        }
        
        this.showScreen('game-over-screen');
    }
};


// ========================================================
// 🧩 GAMEPLAY RULES & GRAPHICS (ENGINE ROOT)
// ========================================================
function createGame() {
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    
    const ROWS = 7;
    const COLS = 7;
    const NUM_CANDY_TYPES = 6;
    
    let board = [];
    let selectedTile = null;
    let isInteracting = false;
    let isSwapping = false;
    let isFalling = false;
    let isMatching = false;
    
    let particles = [];
    let bubbles = []; // Floating soda bubbles in the background
    let animationFrameId = null;
    
    // Board layout metrics (calculated on resize)
    let gridWidth, gridHeight;
    let cellSize;
    let startX, startY;
    
    // Drag/touch tracking state
    let touchStartX = 0;
    let touchStartY = 0;
    let isDragging = false;
    
    // Particle class for satisfying explosions
    class Particle {
        constructor(x, y, color) {
            this.x = x;
            this.y = y;
            this.vx = (Math.random() - 0.5) * 8;
            this.vy = (Math.random() - 0.5) * 8 - 2;
            this.radius = Math.random() * 6 + 4;
            this.alpha = 1;
            this.color = color;
            this.decay = Math.random() * 0.02 + 0.015;
        }
        
        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.vy += 0.15; // Gravity
            this.alpha -= this.decay;
        }
        
        draw(c) {
            c.save();
            c.globalAlpha = this.alpha;
            c.fillStyle = this.color;
            c.shadowColor = this.color;
            c.shadowBlur = 8;
            c.beginPath();
            c.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            c.fill();
            c.restore();
        }
    }
    
    // Soda bubble class for soda bubble effect
    class SodaBubble {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = canvas.height + Math.random() * 50;
            this.vy = -Math.random() * 2 - 0.5;
            this.radius = Math.random() * 8 + 3;
            this.alpha = Math.random() * 0.4 + 0.1;
        }
        
        update() {
            this.y += this.vy;
            this.x += Math.sin(this.y * 0.05) * 0.4; // Light weave
            if (this.y < -10) {
                this.y = canvas.height + 10;
                this.x = Math.random() * canvas.width;
            }
        }
        
        draw(c) {
            c.save();
            c.globalAlpha = this.alpha;
            c.strokeStyle = '#00f3ff';
            c.lineWidth = 1.5;
            c.beginPath();
            c.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            c.stroke();
            c.restore();
        }
    }
    
    // Candy Tile Class definition
    class Tile {
        constructor(row, col, type) {
            this.row = row;
            this.col = col;
            this.type = type;
            
            // For dropping and swapping animations
            this.x = col;
            this.y = -1 - (ROWS - row); // Initial start high above for entry drop
            this.targetX = col;
            this.targetY = row;
            
            this.isMatched = false;
            this.scale = 1.0;
        }
        
        update() {
            // Smoothly interpolate positions
            const speed = 0.22;
            if (Math.abs(this.x - this.targetX) > 0.001) {
                this.x += (this.targetX - this.x) * speed;
            } else {
                this.x = this.targetX;
            }
            
            if (Math.abs(this.y - this.targetY) > 0.001) {
                this.y += (this.targetY - this.y) * speed;
            } else {
                this.y = this.targetY;
            }
            
            // Pop effect scaling down when matched
            if (this.isMatched && this.scale > 0.01) {
                this.scale -= 0.12;
                if (this.scale < 0) this.scale = 0;
            }
        }
        
        draw(c) {
            if (this.scale <= 0) return;
            
            // Translate layout positions to absolute canvas pixels
            const renderX = startX + this.x * cellSize + cellSize / 2;
            const renderY = startY + this.y * cellSize + cellSize / 2;
            const size = (cellSize * 0.8) * this.scale;
            
            c.save();
            c.translate(renderX, renderY);
            
            // Selected outline pulse glow
            if (selectedTile && selectedTile.row === this.row && selectedTile.col === this.col) {
                c.strokeStyle = 'rgba(0, 243, 255, 0.8)';
                c.shadowColor = '#00f3ff';
                c.shadowBlur = 15;
                c.lineWidth = 4;
                c.beginPath();
                c.arc(0, 0, cellSize / 2 - 3, 0, Math.PI * 2);
                c.stroke();
                c.shadowBlur = 0; // Reset
            }
            
            // Draw vector-style candy based on its type
            this.drawCandyShape(c, size);
            
            c.restore();
        }
        
        drawCandyShape(c, size) {
            const r = size / 2;
            let grad;
            
            switch (this.type) {
                case 0: // Red Jelly Heart
                    grad = c.createRadialGradient(-r/4, -r/4, r/6, 0, 0, r);
                    grad.addColorStop(0, '#ff4d6d');
                    grad.addColorStop(0.5, '#ff003c');
                    grad.addColorStop(1, '#80001c');
                    c.fillStyle = grad;
                    
                    // Draw Heart
                    c.beginPath();
                    c.moveTo(0, r/4);
                    c.bezierCurveTo(-r/2, -r/3, -r, -r/3, -r, r/6);
                    c.bezierCurveTo(-r, r/2, -r/4, r*0.8, 0, r);
                    c.bezierCurveTo(r/4, r*0.8, r, r/2, r, r/6);
                    c.bezierCurveTo(r, -r/3, r/2, -r/3, 0, r/4);
                    c.closePath();
                    c.fill();
                    
                    // Highlight gloss
                    c.fillStyle = 'rgba(255, 255, 255, 0.3)';
                    c.beginPath();
                    c.ellipse(-r/3, -r/6, r/6, r/12, -Math.PI/6, 0, Math.PI*2);
                    c.fill();
                    break;
                    
                case 1: // Blue Soda Diamond
                    grad = c.createLinearGradient(-r, -r, r, r);
                    grad.addColorStop(0, '#00f5ff');
                    grad.addColorStop(0.5, '#00b4d8');
                    grad.addColorStop(1, '#003049');
                    c.fillStyle = grad;
                    
                    c.beginPath();
                    c.moveTo(0, -r);
                    c.lineTo(r, 0);
                    c.lineTo(0, r);
                    c.lineTo(-r, 0);
                    c.closePath();
                    c.fill();
                    
                    // Inner neon star
                    c.strokeStyle = '#fff';
                    c.lineWidth = 1.5;
                    c.beginPath();
                    c.moveTo(0, -r*0.6);
                    c.lineTo(0, r*0.6);
                    c.moveTo(-r*0.6, 0);
                    c.lineTo(r*0.6, 0);
                    c.stroke();
                    break;
                    
                case 2: // Green Lemon Drop
                    grad = c.createRadialGradient(-r/4, -r/4, r/8, 0, 0, r);
                    grad.addColorStop(0, '#9ef01a');
                    grad.addColorStop(0.6, '#38b000');
                    grad.addColorStop(1, '#004b23');
                    c.fillStyle = grad;
                    
                    c.beginPath();
                    c.ellipse(0, 0, r, r * 0.7, Math.PI / 4, 0, Math.PI * 2);
                    c.fill();
                    
                    // Highlights
                    c.fillStyle = 'rgba(255, 255, 255, 0.4)';
                    c.beginPath();
                    c.arc(-r/3, -r/4, r/5, 0, Math.PI*2);
                    c.fill();
                    break;
                    
                case 3: // Yellow Lemon Star
                    grad = c.createRadialGradient(0, 0, r/4, 0, 0, r);
                    grad.addColorStop(0, '#fff3b0');
                    grad.addColorStop(0.5, '#ffea00');
                    grad.addColorStop(1, '#ff9f1c');
                    c.fillStyle = grad;
                    
                    // Five point star
                    c.beginPath();
                    for (let i = 0; i < 10; i++) {
                        const angle = (Math.PI / 5) * i - Math.PI / 2;
                        const dist = (i % 2 === 0) ? r : r * 0.4;
                        c.lineTo(Math.cos(angle) * dist, Math.sin(angle) * dist);
                    }
                    c.closePath();
                    c.fill();
                    
                    // Center shiny circle
                    c.fillStyle = '#fff';
                    c.beginPath();
                    c.arc(0, 0, r/4, 0, Math.PI*2);
                    c.fill();
                    break;
                    
                case 4: // Purple Grape Sphere
                    grad = c.createRadialGradient(-r/3, -r/3, r/8, 0, 0, r);
                    grad.addColorStop(0, '#e0aaff');
                    grad.addColorStop(0.4, '#7b2cbf');
                    grad.addColorStop(1, '#240046');
                    c.fillStyle = grad;
                    
                    c.beginPath();
                    c.arc(0, 0, r, 0, Math.PI*2);
                    c.fill();
                    
                    // Highlight gloss arc
                    c.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                    c.lineWidth = 3;
                    c.beginPath();
                    c.arc(0, 0, r * 0.7, -Math.PI*0.7, -Math.PI*0.3);
                    c.stroke();
                    break;
                    
                case 5: // Orange Swirl Hexagon
                    grad = c.createLinearGradient(0, -r, 0, r);
                    grad.addColorStop(0, '#ff9e00');
                    grad.addColorStop(1, '#e85d04');
                    c.fillStyle = grad;
                    
                    c.beginPath();
                    for (let i = 0; i < 6; i++) {
                        const angle = (Math.PI / 3) * i;
                        c.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
                    }
                    c.closePath();
                    c.fill();
                    
                    // Inner pattern
                    c.strokeStyle = 'rgba(255, 255, 255, 0.4)';
                    c.lineWidth = 2;
                    c.beginPath();
                    c.arc(0, 0, r * 0.5, 0, Math.PI * 1.5);
                    c.stroke();
                    break;
            }
        }
        
        getColorString() {
            const colors = ['#ff003c', '#00f5ff', '#38b000', '#ffea00', '#7b2cbf', '#ff9e00'];
            return colors[this.type] || '#ffffff';
        }
    }

    // ========================================================
    // INITIALIZATION & SIZING
    // ========================================================
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        // Setup margins and safety grids
        const hudEl = document.querySelector('.game-hud');
        const hudHeight = hudEl ? hudEl.offsetHeight + 40 : 120;
        
        const availableWidth = canvas.width * 0.94;
        const availableHeight = canvas.height - hudHeight - 40;
        
        // Calculate max cell size that fits both dimensions
        cellSize = Math.floor(Math.min(availableWidth / COLS, availableHeight / ROWS));
        
        // Clamp cell size for tablets so it doesn't look ridiculously huge
        cellSize = Math.min(cellSize, 65);
        
        gridWidth = cellSize * COLS;
        gridHeight = cellSize * ROWS;
        
        // Center grid horizontally, place it below HUD vertically
        startX = (canvas.width - gridWidth) / 2;
        startY = hudHeight + (availableHeight - gridHeight) / 2;
    }
    
    // Auto-generate some background soda bubbles
    function initBubbles() {
        bubbles = [];
        for (let i = 0; i < 15; i++) {
            bubbles.push(new SodaBubble());
        }
    }

    // ========================================================
    // MATCH-3 ALGORITHMS (MATCH, FALL, POP, FILL)
    // ========================================================
    
    function generateBoard() {
        board = [];
        for (let r = 0; r < ROWS; r++) {
            board[r] = [];
            for (let c = 0; c < COLS; c++) {
                let type;
                // Generate and ensure no matching triplets at startup
                do {
                    type = Math.floor(Math.random() * NUM_CANDY_TYPES);
                } while (
                    (c >= 2 && board[r][c-1].type === type && board[r][c-2].type === type) ||
                    (r >= 2 && board[r-1][c].type === type && board[r-2][c].type === type)
                );
                
                board[r][c] = new Tile(r, c, type);
            }
        }
        
        // Ensure board has at least one possible match, else reshuffle
        if (!hasPossibleMatches()) {
            generateBoard();
        }
    }
    
    function getTile(row, col) {
        if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return null;
        return board[row][col];
    }
    
    function checkMatches() {
        let matchedAny = false;
        
        // Reset flags
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if (board[r][c]) board[r][c].isMatched = false;
            }
        }
        
        // 1. Horizontal Matches
        for (let r = 0; r < ROWS; r++) {
            let matchRun = 1;
            let matchType = -1;
            for (let c = 0; c < COLS; c++) {
                const currentType = board[r][c] ? board[r][c].type : -2;
                if (c === 0) {
                    matchRun = 1;
                    matchType = currentType;
                } else {
                    if (currentType === matchType && currentType !== -1) {
                        matchRun++;
                    } else {
                        if (matchRun >= 3) {
                            for (let i = c - matchRun; i < c; i++) {
                                board[r][i].isMatched = true;
                                matchedAny = true;
                            }
                        }
                        matchRun = 1;
                        matchType = currentType;
                    }
                }
            }
            if (matchRun >= 3) {
                for (let i = COLS - matchRun; i < COLS; i++) {
                    board[r][i].isMatched = true;
                    matchedAny = true;
                }
            }
        }
        
        // 2. Vertical Matches
        for (let c = 0; c < COLS; c++) {
            let matchRun = 1;
            let matchType = -1;
            for (let r = 0; r < ROWS; r++) {
                const currentType = board[r][c] ? board[r][c].type : -2;
                if (r === 0) {
                    matchRun = 1;
                    matchType = currentType;
                } else {
                    if (currentType === matchType && currentType !== -1) {
                        matchRun++;
                    } else {
                        if (matchRun >= 3) {
                            for (let i = r - matchRun; i < r; i++) {
                                board[i][c].isMatched = true;
                                matchedAny = true;
                            }
                        }
                        matchRun = 1;
                        matchType = currentType;
                    }
                }
            }
            if (matchRun >= 3) {
                for (let i = ROWS - matchRun; i < ROWS; i++) {
                    board[i][c].isMatched = true;
                    matchedAny = true;
                }
            }
        }
        
        return matchedAny;
    }
    
    function processMatches() {
        let matchCount = 0;
        
        // Generate sparkling particles before removing tiles
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const tile = board[r][c];
                if (tile && tile.isMatched) {
                    matchCount++;
                    const renderX = startX + tile.x * cellSize + cellSize / 2;
                    const renderY = startY + tile.y * cellSize + cellSize / 2;
                    
                    // Create particles
                    for (let p = 0; p < 8; p++) {
                        particles.push(new Particle(renderX, renderY, tile.getColorString()));
                    }
                    board[r][c] = null;
                }
            }
        }
        
        if (matchCount > 0) {
            SoundManager.playMatch();
            // Match score scaling (more points for cascade or large matches)
            const pts = matchCount * 15;
            GameStateManager.addScore(pts);
            
            // Initiate gravity drop
            isFalling = true;
            applyGravity();
        } else {
            isMatching = false;
            // Check if board gets jammed
            if (!hasPossibleMatches()) {
                shuffleBoard();
            }
        }
    }
    
    function applyGravity() {
        let columnsShifted = false;
        
        for (let c = 0; c < COLS; c++) {
            let emptySpaces = 0;
            // Process bottom to top
            for (let r = ROWS - 1; r >= 0; r--) {
                if (board[r][c] === null) {
                    emptySpaces++;
                } else if (emptySpaces > 0) {
                    // Shift down
                    const tile = board[r][c];
                    board[r + emptySpaces][c] = tile;
                    tile.targetY = r + emptySpaces;
                    tile.row = r + emptySpaces;
                    board[r][c] = null;
                    columnsShifted = true;
                }
            }
            
            // Spawn new replacement candies falling in from above screen
            for (let i = 0; i < emptySpaces; i++) {
                const targetRow = emptySpaces - 1 - i;
                const newType = Math.floor(Math.random() * NUM_CANDY_TYPES);
                const tile = new Tile(targetRow, c, newType);
                
                // Position above screen
                tile.y = -1 - i;
                tile.x = c;
                
                board[targetRow][c] = tile;
                columnsShifted = true;
            }
        }
        
        // Wait briefly for fall animation to settle before checking cascades
        setTimeout(() => {
            if (checkMatches()) {
                processMatches();
            } else {
                isFalling = false;
                isMatching = false;
            }
        }, 320);
    }
    
    function swapTiles(t1, t2, isReverting = false) {
        isSwapping = true;
        
        // Swap model indices
        const tempRow = t1.row;
        const tempCol = t1.col;
        
        t1.row = t2.row;
        t1.col = t2.col;
        t1.targetX = t2.col;
        t1.targetY = t2.row;
        
        t2.row = tempRow;
        t2.col = tempCol;
        t2.targetX = tempCol;
        t2.targetY = tempRow;
        
        board[t1.row][t1.col] = t1;
        board[t2.row][t2.col] = t2;
        
        SoundManager.playSwap();
        
        setTimeout(() => {
            if (!isReverting) {
                // Check if match is made
                if (checkMatches()) {
                    isMatching = true;
                    GameStateManager.useMove();
                    processMatches();
                    isSwapping = false;
                } else {
                    // No match -> revert back!
                    swapTiles(t1, t2, true);
                    SoundManager.playBloop();
                }
            } else {
                isSwapping = false;
            }
        }, 220);
    }
    
    // AI Shuffling algorithm when no matches are possible
    function shuffleBoard() {
        const banner = document.getElementById('game-banner');
        const bannerText = document.getElementById('banner-text');
        bannerText.textContent = "SHUFFLING...";
        banner.classList.add('show');
        
        setTimeout(() => {
            generateBoard();
            banner.classList.remove('show');
        }, 1200);
    }
    
    // Verify if there is at least one possible swap that makes a match
    function hasPossibleMatches() {
        // Iterate through all possible horizontal & vertical adjacent pairs
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                // Test Horizontal Swap
                if (c < COLS - 1) {
                    if (testSwapAndCheck(r, c, r, c + 1)) return true;
                }
                // Test Vertical Swap
                if (r < ROWS - 1) {
                    if (testSwapAndCheck(r, c, r + 1, c)) return true;
                }
            }
        }
        return false;
    }
    
    function testSwapAndCheck(r1, c1, r2, c2) {
        // Swap temporarily
        const temp = board[r1][c1];
        board[r1][c1] = board[r2][c2];
        board[r2][c2] = temp;
        
        const matches = checkTempMatches();
        
        // Revert back
        const temp2 = board[r1][c1];
        board[r1][c1] = board[r2][c2];
        board[r2][c2] = temp2;
        
        return matches;
    }
    
    function checkTempMatches() {
        // Light verification of matched run of 3 or more on temporary board
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const type = board[r][c] ? board[r][c].type : -1;
                if (type === -1) continue;
                
                // Horizontal triplet check
                if (c < COLS - 2 &&
                    board[r][c+1] && board[r][c+1].type === type &&
                    board[r][c+2] && board[r][c+2].type === type) return true;
                    
                // Vertical triplet check
                if (r < ROWS - 2 &&
                    board[r+1][c] && board[r+1][c].type === type &&
                    board[r+2][c] && board[r+2][c].type === type) return true;
            }
        }
        return false;
    }

    // ========================================================
    // TOUCH & MOUSE INPUTS
    // ========================================================
    
    function getGridCoords(clientX, clientY) {
        const rect = canvas.getBoundingClientRect();
        const x = clientX - rect.left - startX;
        const y = clientY - rect.top - startY;
        
        const col = Math.floor(x / cellSize);
        const row = Math.floor(y / cellSize);
        
        if (row >= 0 && row < ROWS && col >= 0 && col < COLS) {
            return { row, col };
        }
        return null;
    }
    
    function handleStart(clientX, clientY) {
        if (isSwapping || isFalling || isMatching) return;
        
        const coords = getGridCoords(clientX, clientY);
        if (coords) {
            touchStartX = clientX;
            touchStartY = clientY;
            isDragging = true;
            
            const clickedTile = board[coords.row][coords.col];
            if (selectedTile) {
                // If adjacent, swap them
                const diffRow = Math.abs(selectedTile.row - coords.row);
                const diffCol = Math.abs(selectedTile.col - coords.col);
                
                if ((diffRow === 1 && diffCol === 0) || (diffRow === 0 && diffCol === 1)) {
                    swapTiles(selectedTile, clickedTile);
                    selectedTile = null;
                } else {
                    selectedTile = clickedTile;
                }
            } else {
                selectedTile = clickedTile;
            }
        } else {
            selectedTile = null;
        }
    }
    
    function handleMove(clientX, clientY) {
        if (!isDragging || !selectedTile) return;
        
        const dx = clientX - touchStartX;
        const dy = clientY - touchStartY;
        const minSwipeDist = cellSize * 0.45; // 45% cell size swipe threshold
        
        if (Math.abs(dx) > minSwipeDist || Math.abs(dy) > minSwipeDist) {
            isDragging = false; // Trigger swipe once
            
            let targetRow = selectedTile.row;
            let targetCol = selectedTile.col;
            
            if (Math.abs(dx) > Math.abs(dy)) {
                // Horizontal Swipe
                targetCol += dx > 0 ? 1 : -1;
            } else {
                // Vertical Swipe
                targetRow += dy > 0 ? 1 : -1;
            }
            
            const targetTile = getTile(targetRow, targetCol);
            if (targetTile) {
                swapTiles(selectedTile, targetTile);
            }
            selectedTile = null;
        }
    }
    
    function handleEnd() {
        isDragging = false;
    }
    
    // Register touch & mouse events
    function addInputListeners() {
        // Touch events (for mobile)
        canvas.addEventListener('touchstart', (e) => {
            if (e.touches.length > 0) {
                handleStart(e.touches[0].clientX, e.touches[0].clientY);
            }
            e.preventDefault();
        }, { passive: false });
        
        canvas.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                handleMove(e.touches[0].clientX, e.touches[0].clientY);
            }
            e.preventDefault();
        }, { passive: false });
        
        canvas.addEventListener('touchend', () => {
            handleEnd();
        }, { passive: true });
        
        // Mouse events (for desktop backup)
        canvas.addEventListener('mousedown', (e) => {
            handleStart(e.clientX, e.clientY);
        });
        
        canvas.addEventListener('mousemove', (e) => {
            handleMove(e.clientX, e.clientY);
        });
        
        canvas.addEventListener('mouseup', () => {
            handleEnd();
        });
    }

    // ========================================================
    // MAIN LOOP & RENDERING
    // ========================================================
    
    function update() {
        // Update particles
        for (let i = particles.length - 1; i >= 0; i--) {
            particles[i].update();
            if (particles[i].alpha <= 0) {
                particles.splice(i, 1);
            }
        }
        
        // Update background bubbles
        bubbles.forEach(b => b.update());
        
        // Update tiles
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if (board[r][c]) {
                    board[r][c].update();
                }
            }
        }
    }
    
    function draw() {
        // Clean deep dark background
        ctx.fillStyle = '#0a0915';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw bubbles
        bubbles.forEach(b => b.draw(ctx));
        
        // Draw board container frame / neon panel
        ctx.save();
        ctx.strokeStyle = 'rgba(157, 78, 221, 0.4)';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#9d4edd';
        ctx.shadowBlur = 10;
        ctx.strokeRect(startX - 6, startY - 6, gridWidth + 12, gridHeight + 12);
        
        // Subtle background grid backing
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(20, 18, 43, 0.6)';
        ctx.fillRect(startX, startY, gridWidth, gridHeight);
        ctx.restore();
        
        // Draw faint horizontal/vertical grid separators
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        for (let r = 1; r < ROWS; r++) {
            ctx.beginPath();
            ctx.moveTo(startX, startY + r * cellSize);
            ctx.lineTo(startX + gridWidth, startY + r * cellSize);
            ctx.stroke();
        }
        for (let c = 1; c < COLS; c++) {
            ctx.beginPath();
            ctx.moveTo(startX + c * cellSize, startY);
            ctx.lineTo(startX + c * cellSize, startY + gridHeight);
            ctx.stroke();
        }
        
        // Draw tiles
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if (board[r][c]) {
                    board[r][c].draw(ctx);
                }
            }
        }
        
        // Draw flying matching explosion particles
        particles.forEach(p => p.draw(ctx));
    }
    
    function tick() {
        update();
        draw();
        animationFrameId = requestAnimationFrame(tick);
    }
    
    // Window Resize listener mapping
    const onResize = () => {
        resizeCanvas();
    };
    window.addEventListener('resize', onResize);

    // Initial setups
    resizeCanvas();
    initBubbles();
    generateBoard();
    addInputListeners();
    
    // Boot up requestAnimationFrame Game loop
    tick();
    
    // Return controller/destructor
    return {
        destroy() {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
            window.removeEventListener('resize', onResize);
            canvas.replaceWith(canvas.cloneNode(true)); // Flushes all EventListeners completely
        }
    };
}


// ========================================================
// 🚀 BOOTSTRAP INITIALIZER
// ========================================================
window.addEventListener('DOMContentLoaded', () => {
    GameStateManager.init();
});
