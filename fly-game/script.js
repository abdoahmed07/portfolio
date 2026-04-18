document.addEventListener("DOMContentLoaded", () => {

    // ── MODES CONFIG ───────────────────────────────────────────
    const MODES = {
        infinite:  { label: "Infinite",    missLimit: Infinity, timer: null },
        lives:     { label: "3 Lives",     missLimit: 3,        timer: null },
        time:      { label: "Time Attack", missLimit: Infinity, timer: 30   },
        precision: { label: "Precision",   missLimit: 1,        timer: null },
    };

    const SPEEDS = {
        low:    { ms: 2200, label: "Slow",   t: "0.55s" },
        medium: { ms: 1100, label: "Medium", t: "0.45s" },
        fast:   { ms: 580,  label: "Fast",   t: "0.28s" },
        insane: { ms: 300,  label: "Insane", t: "0.15s" },
    };
    const SPEED_ORDER = ["low","medium","fast","insane"];

    // ── STATE ──────────────────────────────────────────────────
    let hits         = 0;
    let misses       = 0;
    let combo        = 0;
    let timeLeft     = 30;
    let speed        = "medium";
    let selectedMode = null;
    let gameMode     = "lives";
    let moveInterval = null;
    let timerInterval= null;
    let paused       = false;
    let gameActive   = false;
    let currentPos   = { x: 50, y: 50 };

    const bestScores = JSON.parse(localStorage.getItem("flyBests") || "{}");

    // ── DOM ────────────────────────────────────────────────────
    const container      = document.getElementById("container");
    const scoreDisplay   = document.getElementById("scoreDisplay");
    const comboDisplay   = document.getElementById("comboDisplay");
    const timerDisplay   = document.getElementById("timerDisplay");
    const livesDisplay   = document.getElementById("livesDisplay");
    const rightLabel     = document.getElementById("rightLabel");
    const speedLabel     = document.getElementById("speedLabel");
    const pauseButton    = document.getElementById("pauseButton");
    const startScreen    = document.getElementById("startScreen");
    const modeScreen     = document.getElementById("modeScreen");
    const gameOverScreen = document.getElementById("gameOverScreen");

    // ── MODE CARDS ─────────────────────────────────────────────
    const playModeBtn = document.getElementById("playModeBtn");
    playModeBtn.disabled = true;
    playModeBtn.style.opacity = "0.4";
    playModeBtn.style.cursor = "not-allowed";

    document.querySelectorAll(".mode-card").forEach(card => {
        card.addEventListener("click", () => {
            document.querySelectorAll(".mode-card").forEach(c => c.classList.remove("mode-card--selected"));
            card.classList.add("mode-card--selected");
            selectedMode = card.dataset.mode;
            playModeBtn.disabled = false;
            playModeBtn.style.opacity = "1";
            playModeBtn.style.cursor = "pointer";
        });
    });

    // ── SCORE ──────────────────────────────────────────────────
    function calcScore() {
        const base = hits * 10 + Math.max(0, combo - 1) * 5;
        if (gameMode === "lives" || gameMode === "precision") {
            return Math.max(0, base - misses * 8);
        }
        return base;
    }

    // ── HUD ────────────────────────────────────────────────────
    function updateHUD() {
        const score = calcScore();
        scoreDisplay.textContent = score;
        scoreDisplay.classList.remove("bump");
        void scoreDisplay.offsetWidth;
        scoreDisplay.classList.add("bump");
        setTimeout(() => scoreDisplay.classList.remove("bump"), 120);

        if (combo >= 2) {
            comboDisplay.textContent = `x${combo}`;
            comboDisplay.classList.remove("hidden");
            comboDisplay.style.animation = "none";
            void comboDisplay.offsetWidth;
            comboDisplay.style.animation = "";
        } else {
            comboDisplay.classList.add("hidden");
        }

        renderLives();
    }

    function renderLives() {
        livesDisplay.innerHTML = "";

        if (gameMode === "time" || gameMode === "infinite") {
            // show raw miss count
            const span = document.createElement("span");
            span.className = "hud-val";
            span.style.color = "#fff";
            span.textContent = misses;
            livesDisplay.appendChild(span);
            return;
        }

        const total = MODES[gameMode].missLimit;
        for (let i = 0; i < total; i++) {
            const s = document.createElement("span");
            s.className = "life" + (i < misses ? " used" : "");
            s.textContent = "✕";
            livesDisplay.appendChild(s);
        }
    }

    function setupHUDForMode() {
        const cfg = MODES[gameMode];

        if (cfg.timer) {
            timerDisplay.classList.remove("hidden");
            timerDisplay.textContent = cfg.timer;
            timerDisplay.classList.remove("urgent");
            // hide combo in time mode so timer has center stage
        } else {
            timerDisplay.classList.add("hidden");
        }

        rightLabel.textContent = (gameMode === "time") ? "Misses" :
                                  (gameMode === "infinite") ? "Misses" : "Lives";
    }

    // ── TIMER ─────────────────────────────────────────────────
    function startTimer() {
        timeLeft = MODES.time.timer;
        timerDisplay.textContent = timeLeft;
        timerDisplay.classList.remove("urgent");

        timerInterval = setInterval(() => {
            if (paused) return;
            timeLeft--;
            timerDisplay.textContent = timeLeft;
            if (timeLeft <= 10) timerDisplay.classList.add("urgent");
            if (timeLeft <= 0) { clearInterval(timerInterval); endGame(); }
        }, 1000);
    }

    // ── FLY MOVEMENT ──────────────────────────────────────────
    function getFly() { return document.getElementById("fly"); }

    function moveFly() {
        const f = getFly();
        if (!f || paused) return;
        const cw = container.clientWidth, ch = container.clientHeight;
        const fw = f.offsetWidth || 38, fh = f.offsetHeight || 38;
        const newX = Math.random() * (cw - fw - 10) + 5;
        const newY = Math.random() * (ch - fh - 10) + 5;
        f.style.transition = `left ${SPEEDS[speed].t} cubic-bezier(0.34,1.2,0.64,1), top ${SPEEDS[speed].t} cubic-bezier(0.34,1.2,0.64,1)`;
        f.style.left = `${newX}px`;
        f.style.top  = `${newY}px`;
        currentPos = { x: newX, y: newY };
    }

    function startMoving() {
        clearInterval(moveInterval);
        if (!gameActive || paused) return;
        moveInterval = setInterval(moveFly, SPEEDS[speed].ms);
    }

    // ── HIT ───────────────────────────────────────────────────
    function handleHit(event) {
        if (!gameActive || paused) return;
        event.stopPropagation();
        const f = getFly();
        if (!f) return;

        hits++;
        combo++;
        updateHUD();
        spawnSplat(currentPos.x + 19, currentPos.y + 19);

        const dead = document.createElement("img");
        dead.src = "images/dfly.jpg";
        dead.alt = "dead fly";
        dead.className = "dead-fly";
        dead.style.left = `${currentPos.x}px`;
        dead.style.top  = `${currentPos.y}px`;
        f.replaceWith(dead);

        setTimeout(() => {
            dead.style.top = `${container.clientHeight - 46}px`;
            dead.style.opacity = "0";
        }, 80);

        setTimeout(() => {
            dead.remove();
            if (gameActive) spawnFly();
        }, 650);
    }

    // ── MISS ──────────────────────────────────────────────────
    function handleMiss(event) {
        if (!gameActive || paused) return;
        const t = event.target;
        // ignore clicks on the fly itself, controls bar, overlay screens, dead flies
        if (t.id === "fly") return;
        if (t.closest("#controls")) return;
        if (t.closest(".overlay-screen")) return;
        if (t.classList.contains("dead-fly")) return;
        if (t.id === "hud") return;

        misses++;
        combo = 0;
        updateHUD();

        const flash = document.createElement("div");
        flash.className = "miss-flash";
        document.body.appendChild(flash);
        setTimeout(() => flash.remove(), 320);

        const limit = MODES[gameMode].missLimit;
        if (misses >= limit) {
            document.body.classList.add("shake");
            setTimeout(() => document.body.classList.remove("shake"), 360);
            setTimeout(endGame, 400);
        }
    }

    // ── SPAWN FLY ─────────────────────────────────────────────
    function spawnFly() {
        if (!gameActive) return;
        let f = getFly();
        if (!f) {
            f = document.createElement("div");
            f.id = "fly";
            f.className = "fly";
            container.appendChild(f);
        }
        f.addEventListener("click", handleHit);
        moveFly();
    }

    // ── SPLAT ─────────────────────────────────────────────────
    function spawnSplat(cx, cy) {
        const colors = ["#2a2a2a","#555","#3a3a3a","#444","#c8f04d"];
        for (let i = 0; i < 8; i++) {
            const p = document.createElement("div");
            p.className = "splat";
            const size  = Math.random() * 8 + 4;
            const angle = Math.random() * Math.PI * 2;
            const dist  = Math.random() * 30 + 10;
            const tx    = Math.cos(angle) * dist;
            const ty    = Math.sin(angle) * dist;
            p.style.cssText = `width:${size}px;height:${size}px;left:${cx}px;top:${cy}px;background:${colors[Math.floor(Math.random()*colors.length)]};`;
            p.style.transform = `translate(${tx}px,${ty}px) scale(0)`;
            p.style.animation = `splatOut 0.4s ease-out forwards`;
            container.appendChild(p);
            setTimeout(() => p.remove(), 500);
        }
    }

    // ── SPEED ─────────────────────────────────────────────────
    function cycleSpeed() {
        const idx = SPEED_ORDER.indexOf(speed);
        speed = SPEED_ORDER[(idx + 1) % SPEED_ORDER.length];
        speedLabel.textContent = SPEEDS[speed].label;
        startMoving();
    }

    // ── PAUSE ─────────────────────────────────────────────────
    function togglePause() {
        paused = !paused;
        pauseButton.textContent = paused ? "▶ Resume" : "⏸ Pause";
        document.body.classList.toggle("paused", paused);
        if (!paused) startMoving();
        else clearInterval(moveInterval);
    }

    // ── GAME LIFECYCLE ────────────────────────────────────────
    function startGame() {
        hits   = 0;
        misses = 0;
        combo  = 0;
        paused = false;
        gameActive = true;
        gameMode = selectedMode;

        clearInterval(timerInterval);
        clearInterval(moveInterval);
        document.querySelectorAll(".dead-fly,.splat,.miss-flash").forEach(el => el.remove());
        const f = getFly();
        if (f) f.remove();

        startScreen.classList.add("hidden");
        modeScreen.classList.add("hidden");
        gameOverScreen.classList.add("hidden");
        document.body.classList.remove("paused");
        pauseButton.textContent = "⏸ Pause";

        setupHUDForMode();
        updateHUD();

        if (gameMode === "time") startTimer();

        spawnFly();
        startMoving();
    }

    function endGame() {
        gameActive = false;
        clearInterval(moveInterval);
        clearInterval(timerInterval);

        const score = calcScore();
        if (!bestScores[gameMode] || score > bestScores[gameMode]) {
            bestScores[gameMode] = score;
            localStorage.setItem("flyBests", JSON.stringify(bestScores));
        }

        document.getElementById("goMode").textContent      = MODES[gameMode].label + " — game over";
        document.getElementById("finalScore").textContent  = score;
        document.getElementById("finalHits").textContent   = hits;
        document.getElementById("finalMisses").textContent = misses;
        document.getElementById("finalBest").textContent   = bestScores[gameMode] || 0;

        const msgs = [[0,"Keep trying…"],[50,"Not bad."],[100,"Nice reflexes."],[200,"You're dangerous."],[350,"Fly slayer. 🪰"]];
        let msg = msgs[0][1];
        for (const [t, m] of msgs) { if (score >= t) msg = m; }
        document.getElementById("finalMessage").textContent = msg;

        const f = getFly();
        if (f) f.remove();

        setTimeout(() => gameOverScreen.classList.remove("hidden"), 500);
    }

    function showModeScreen() {
        gameActive = false;
        clearInterval(moveInterval);
        clearInterval(timerInterval);
        document.querySelectorAll(".dead-fly,.splat,.miss-flash").forEach(el => el.remove());
        const f = getFly();
        if (f) f.remove();

        // reset mode selection state
        document.querySelectorAll(".mode-card").forEach(c => c.classList.remove("mode-card--selected"));
        selectedMode = null;
        playModeBtn.disabled = true;
        playModeBtn.style.opacity = "0.4";
        playModeBtn.style.cursor = "not-allowed";

        startScreen.classList.add("hidden");
        gameOverScreen.classList.add("hidden");
        modeScreen.classList.remove("hidden");
    }

    // ── EVENTS ────────────────────────────────────────────────
    document.getElementById("startBtn").addEventListener("click",      showModeScreen);
    document.getElementById("playModeBtn").addEventListener("click",   startGame);
    document.getElementById("restartBtn").addEventListener("click",    startGame);
    document.getElementById("changeModeBtn").addEventListener("click", showModeScreen);
    document.getElementById("speedButton").addEventListener("click",   cycleSpeed);
    document.getElementById("pauseButton").addEventListener("click",   togglePause);
    document.getElementById("giveUpButton").addEventListener("click",  endGame);
    document.addEventListener("click", handleMiss);
    window.addEventListener("resize", () => { if (gameActive) moveFly(); });

    speedLabel.textContent = SPEEDS[speed].label;
});