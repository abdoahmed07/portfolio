document.addEventListener("DOMContentLoaded", () => {

    // ── STATE ──────────────────────────────────────────────────
    let mode         = 1;       // 1 = vs bot, 2 = 2 players
    let board        = [];
    let currentPlayer= "X";
    let gameOver     = false;
    let winsX        = 0;
    let winsO        = 0;
    let draws        = 0;
    let p1Name       = "Player 1";
    let p2Name       = "Bot";

    const WIN_LINES = [
        [0,1,2],[3,4,5],[6,7,8], // rows
        [0,3,6],[1,4,7],[2,5,8], // cols
        [0,4,8],[2,4,6]          // diagonals
    ];

    // ── DOM ────────────────────────────────────────────────────
    const setupScreen  = document.getElementById("setupScreen");
    const gameScreen   = document.getElementById("gameScreen");
    const lbScreen     = document.getElementById("lbScreen");
    const modePills    = document.querySelectorAll(".mode-pill");
    const p1Group      = document.getElementById("p1Group");
    const p2Group      = document.getElementById("p2Group");
    const p1Input      = document.getElementById("p1Name");
    const p2Input      = document.getElementById("p2Name");
    const errorMsg     = document.getElementById("errorMsg");
    const playBtn      = document.getElementById("playBtn");
    const backBtn      = document.getElementById("backBtn");
    const boardEl      = document.getElementById("board");
    const nameXEl      = document.getElementById("nameX");
    const nameOEl      = document.getElementById("nameO");
    const winsXEl      = document.getElementById("winsX");
    const winsOEl      = document.getElementById("winsO");
    const drawCountEl  = document.getElementById("drawCount");
    const scoreXEl     = document.getElementById("scoreX");
    const scoreOEl     = document.getElementById("scoreO");
    const turnTextEl   = document.getElementById("turnText");
    const turnDotEl    = document.getElementById("turnDot");
    const resultBanner = document.getElementById("resultBanner");
    const resultTextEl = document.getElementById("resultText");
    const nextRoundBtn = document.getElementById("nextRoundBtn");
    const lbToggle     = document.getElementById("lbToggle");
    const lbBackBtn    = document.getElementById("lbBackBtn");
    const lbList       = document.getElementById("lbList");

    // ── SCREEN NAV ─────────────────────────────────────────────
    function showScreen(el) {
        [setupScreen, gameScreen, lbScreen].forEach(s => s.classList.remove("active"));
        el.classList.add("active");
    }

    // ── MODE PILLS ─────────────────────────────────────────────
    modePills.forEach(pill => {
        pill.addEventListener("click", () => {
            modePills.forEach(p => p.classList.remove("active"));
            pill.classList.add("active");
            mode = parseInt(pill.dataset.mode);
            p2Group.classList.toggle("hidden", mode === 1);
            p1Input.labels[0].textContent = mode === 1 ? "Your name" : "Player 1 name";
        });
    });

    // ── START GAME ─────────────────────────────────────────────
    playBtn.addEventListener("click", () => {
        p1Name = p1Input.value.trim() || "Player 1";
        p2Name = mode === 1 ? "Bot" : (p2Input.value.trim() || "Player 2");

        if (!p1Input.value.trim()) {
            errorMsg.classList.remove("hidden");
            p1Input.focus();
            return;
        }
        if (mode === 2 && !p2Input.value.trim()) {
            errorMsg.classList.remove("hidden");
            p2Input.focus();
            return;
        }
        errorMsg.classList.add("hidden");

        winsX = 0; winsO = 0; draws = 0;
        updateScoreDisplay();
        startRound();
        showScreen(gameScreen);
    });

    // ── BACK ───────────────────────────────────────────────────
    backBtn.addEventListener("click", () => {
        showScreen(setupScreen);
    });

    // ── ROUND ──────────────────────────────────────────────────
    function startRound() {
        board        = Array(9).fill("");
        currentPlayer= "X";
        gameOver     = false;

        resultBanner.classList.add("hidden");
        renderBoard();
        updateTurnUI();
    }

    function renderBoard() {
        boardEl.innerHTML = "";
        for (let i = 0; i < 9; i++) {
            const cell = document.createElement("div");
            cell.className = "cell";
            cell.dataset.idx = i;
            cell.addEventListener("click", handleCellClick);
            boardEl.appendChild(cell);
        }
    }

    // ── CELL CLICK ─────────────────────────────────────────────
    function handleCellClick(e) {
        const idx = parseInt(e.currentTarget.dataset.idx);
        if (gameOver || board[idx] !== "") return;
        placeMove(idx, currentPlayer);
    }

    function placeMove(idx, player) {
        board[idx] = player;
        const cell = boardEl.children[idx];
        cell.classList.add("taken");
        const mark = document.createElement("span");
        mark.className = `mark ${player.toLowerCase()}`;
        mark.textContent = player;
        cell.appendChild(mark);

        const winLine = getWinLine(player);
        if (winLine) {
            highlightWin(winLine);
            handleWin(player);
        } else if (board.every(c => c !== "")) {
            handleDraw();
        } else {
            currentPlayer = player === "X" ? "O" : "X";
            updateTurnUI();
            if (mode === 1 && currentPlayer === "O") {
                setTimeout(doBotMove, 420);
            }
        }
    }

    // ── WIN / DRAW ─────────────────────────────────────────────
    function getWinLine(player) {
        return WIN_LINES.find(line => line.every(i => board[i] === player)) || null;
    }

    function highlightWin(line) {
        line.forEach(i => boardEl.children[i].classList.add("win-cell"));
    }

    function handleWin(player) {
        gameOver = true;
        const winner = player === "X" ? p1Name : p2Name;
        if (player === "X") { winsX++; scoreXEl.classList.add("active-turn"); }
        else                 { winsO++; scoreOEl.classList.add("active-turn"); }
        updateScoreDisplay();
        showResult(`${winner} wins! 🎉`);
        updateLeaderboard(winner);
    }

    function handleDraw() {
        gameOver = true;
        draws++;
        updateScoreDisplay();
        showResult("It's a draw!");
    }

    function showResult(msg) {
        resultTextEl.textContent = msg;
        resultBanner.classList.remove("hidden");
    }

    nextRoundBtn.addEventListener("click", () => {
        scoreXEl.classList.remove("active-turn");
        scoreOEl.classList.remove("active-turn");
        startRound();
    });

    // ── TURN UI ────────────────────────────────────────────────
    function updateTurnUI() {
        const name = currentPlayer === "X" ? p1Name : p2Name;
        turnTextEl.textContent = `${name}'s turn (${currentPlayer})`;

        scoreXEl.classList.toggle("active-turn", currentPlayer === "X");
        scoreOEl.classList.toggle("active-turn", currentPlayer === "O");

        turnDotEl.style.background = currentPlayer === "X"
            ? "var(--x-col)"
            : "var(--o-col)";
    }

    function updateScoreDisplay() {
        nameXEl.textContent  = p1Name;
        nameOEl.textContent  = p2Name;
        winsXEl.textContent  = winsX;
        winsOEl.textContent  = winsO;
        drawCountEl.textContent = draws;
    }

    // ── BOT (smarter: win > block > center > corner > edge) ───
    function doBotMove() {
        if (gameOver) return;

        const idx = getBotMove();
        placeMove(idx, "O");
    }

    function getBotMove() {
        // 1. Win if possible
        const win = findBestMove("O");
        if (win !== -1) return win;

        // 2. Block player from winning
        const block = findBestMove("X");
        if (block !== -1) return block;

        // 3. Take center
        if (board[4] === "") return 4;

        // 4. Take a corner
        const corners = [0,2,6,8].filter(i => board[i] === "");
        if (corners.length) return corners[Math.floor(Math.random() * corners.length)];

        // 5. Take any edge
        const edges = [1,3,5,7].filter(i => board[i] === "");
        if (edges.length) return edges[Math.floor(Math.random() * edges.length)];

        return board.findIndex(c => c === "");
    }

    function findBestMove(player) {
        for (const line of WIN_LINES) {
            const vals = line.map(i => board[i]);
            const empties = line.filter(i => board[i] === "");
            if (vals.filter(v => v === player).length === 2 && empties.length === 1) {
                return empties[0];
            }
        }
        return -1;
    }

    // ── LEADERBOARD (localStorage — works without a server) ───
    function getStoredLeaderboard() {
        try {
            return JSON.parse(localStorage.getItem("tttLeaderboard") || "[]");
        } catch { return []; }
    }

    function saveStoredLeaderboard(data) {
        localStorage.setItem("tttLeaderboard", JSON.stringify(data));
    }

    function updateLeaderboard(winnerName) {
        const lb = getStoredLeaderboard();
        const existing = lb.find(e => e.name.toLowerCase() === winnerName.toLowerCase());
        if (existing) {
            existing.wins++;
        } else {
            lb.push({ name: winnerName, wins: 1 });
        }
        lb.sort((a, b) => b.wins - a.wins);
        saveStoredLeaderboard(lb);
        renderLeaderboard(lb);
    }

    function fetchLeaderboard() {
        renderLeaderboard(getStoredLeaderboard());
    }

    function renderLeaderboard(data) {
        lbList.innerHTML = "";
        if (!data || data.length === 0) {
            lbList.innerHTML = '<li class="lb-empty">No entries yet. Win a game to appear here!</li>';
            return;
        }
        data.forEach((entry, i) => {
            const li = document.createElement("li");
            li.className = "lb-entry";
            const rankClass = i === 0 ? "gold" : i === 1 ? "silver" : i === 2 ? "bronze" : "";
            li.innerHTML = `
                <span class="lb-rank ${rankClass}">${i + 1}</span>
                <span class="lb-name">${entry.name}</span>
                <span class="lb-wins">${entry.wins} win${entry.wins !== 1 ? "s" : ""}</span>
            `;
            lbList.appendChild(li);
        });
    }

    // ── LEADERBOARD TOGGLE ─────────────────────────────────────
    lbToggle.addEventListener("click", () => {
        fetchLeaderboard();
        showScreen(lbScreen);
    });

    lbBackBtn.addEventListener("click", () => {
        showScreen(gameScreen.classList.contains("active") || setupScreen.classList.contains("active")
            ? gameScreen : setupScreen);
        // just go back to wherever makes sense
        if (!gameOver && board.some(c => c !== "")) showScreen(gameScreen);
        else showScreen(setupScreen);
    });

    // initial leaderboard fetch
    fetchLeaderboard();
});