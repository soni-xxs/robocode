
const symbols = [
    { icon: "🍒", multiplier: 5, name: "CHERRIES" },
    { icon: "🍋", multiplier: 10, name: "LEMONS" },
    { icon: "🍉", multiplier: 15, name: "WATERMELONS" },
    { icon: "🍇", multiplier: 20, name: "GRAPES" },
    { icon: "⭐", multiplier: 30, name: "STARS" },
    { icon: "💎", multiplier: 50, name: "DIAMONDS" },
    { icon: "7️⃣", multiplier: 100, name: "SEVEN" }
];

const MIN_BET = 10;
const BET_STEP = 10;
const MAX_HISTORY = 7;
const JACKPOT_VALUE = 1000;

const elements = {
    balance: document.getElementById("balance"),
    headerBalance: document.getElementById("headerBalance"),
    betAmount: document.getElementById("betAmount"),
    totalSpins: document.getElementById("totalSpins"),
    totalWinnings: document.getElementById("totalWinnings"),
    jackpot: document.getElementById("jackpot"),

    spinButton: document.getElementById("spinButton"),
    increaseBet: document.getElementById("increaseBet"),
    decreaseBet: document.getElementById("decreaseBet"),
    maxBet: document.getElementById("maxBet"),
    autoButton: document.getElementById("autoButton"),
    autoStatus: document.getElementById("autoStatus"),

    resultMessage: document.getElementById("resultMessage"),
    historyList: document.getElementById("historyList"),

    winOverlay: document.getElementById("winOverlay"),
    winTitle: document.getElementById("winTitle"),
    winAmount: document.getElementById("winAmount"),
    closeWin: document.getElementById("closeWin"),

    reels: [
        document.getElementById("reel1"),
        document.getElementById("reel2"),
        document.getElementById("reel3")
    ]
};

let game = {
    balance: 1000,
    bet: 10,
    totalSpins: 0,
    totalWinnings: 0,
    jackpot: JACKPOT_VALUE,
    history: [],
    clickerClicks: 0
};

let isSpinning = false;
let autoSpin = false;
let audioContext = null;
let spinSoundTimer = null;
let autoTimer = null;

function createClicker() {
    const style = document.createElement("style");

    style.textContent = `
        .coin-clicker {
            display: none;
            max-width: 500px;
            margin: 45px auto 30px;
            padding: 30px 20px;
            text-align: center;
            border: 2px solid #f6c453;
            border-radius: 20px;
            background: linear-gradient(145deg, #281438, #12091e);
            box-shadow: 0 0 25px rgba(246, 196, 83, 0.2);
            color: white;
        }

        .coin-clicker h2 {
            color: #f6c453;
            font-size: 22px;
            margin-bottom: 12px;
            letter-spacing: 2px;
        }

        .coin-clicker p {
            color: #c9b8d8;
            margin-bottom: 18px;
        }

        .coin-clicker .coin-reward {
            font-size: 38px;
            font-weight: bold;
            color: #42e88b;
            margin: 15px;
            text-shadow: 0 0 15px #42e88b;
        }

        .coin-clicker button {
            padding: 18px 30px;
            border: 2px solid #ffe7a0;
            border-radius: 12px;
            background: linear-gradient(135deg, #ffdf83, #d28b24);
            color: #321a05;
            font-size: 15px;
            font-weight: bold;
            cursor: pointer;
            transition: 0.2s;
        }

        .coin-clicker button:hover {
            transform: scale(1.05);
            box-shadow: 0 0 25px #f6c453;
        }

        .coin-clicker button:active {
            transform: scale(0.95);
        }

        .coin-clicker .click-count {
            margin-top: 20px;
            color: #f6c453;
            font-size: 13px;
        }

        .coin-clicker .floating-coin {
            position: fixed;
            pointer-events: none;
            color: #42e88b;
            font-size: 22px;
            font-weight: bold;
            animation: coinFly 0.8s ease-out forwards;
            z-index: 9999;
        }

        @keyframes coinFly {
            from {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
            to {
                opacity: 0;
                transform: translateY(-70px) scale(1.4);
            }
        }
    `;

    document.head.appendChild(style);

    const clicker = document.createElement("section");
    clicker.className = "coin-clicker";
    clicker.id = "coinClicker";

    clicker.innerHTML = `
        <h2>💰 FREE COINS 💰</h2>
        <p>У тебе закінчилися монети? Заробляй їх кліками!</p>
        <div class="coin-reward">+1 🪙</div>
        <button id="earnCoinButton">💰 ОТРИМАТИ МОНЕТУ</button>
        <div class="click-count">
            ВСЬОГО КЛІКІВ: <strong id="clickerClicks">0</strong>
        </div>
    `;

    document.body.appendChild(clicker);

    elements.clicker = clicker;
    elements.earnCoinButton = document.getElementById("earnCoinButton");
    elements.clickerClicks = document.getElementById("clickerClicks");

    elements.earnCoinButton.addEventListener("click", earnCoin);
}

function earnCoin(event) {
    game.balance += 1;
    game.clickerClicks++;

    updateInterface();

    const coin = document.createElement("span");
    coin.className = "floating-coin";
    coin.textContent = "+1";

    coin.style.left = event.clientX + "px";
    coin.style.top = event.clientY + "px";

    document.body.appendChild(coin);

    setTimeout(() => {
        coin.remove();
    }, 800);

    playTone(650, 0.1, 0.04, "sine");
}

function loadGame() {
    try {
        const saved = localStorage.getItem("royalSlotsSave");

        if (!saved) return;

        const data = JSON.parse(saved);

        if (
            !data ||
            !Number.isSafeInteger(data.balance) ||
            data.balance < 0 ||
            !Number.isSafeInteger(data.bet) ||
            data.bet < MIN_BET ||
            !Number.isSafeInteger(data.totalSpins) ||
            data.totalSpins < 0 ||
            !Number.isSafeInteger(data.totalWinnings) ||
            data.totalWinnings < 0 ||
            !Number.isSafeInteger(data.jackpot) ||
            data.jackpot < JACKPOT_VALUE ||
            !Array.isArray(data.history)
        ) {
            return;
        }

        game.balance = data.balance;
        game.bet = data.bet;
        game.totalSpins = data.totalSpins;
        game.totalWinnings = data.totalWinnings;
        game.jackpot = data.jackpot;

        game.clickerClicks =
            Number.isSafeInteger(data.clickerClicks) && data.clickerClicks >= 0
                ? data.clickerClicks
                : 0;

        game.history = data.history
            .filter(item =>
                item &&
                Array.isArray(item.symbols) &&
                item.symbols.length === 3 &&
                item.symbols.every(symbol =>
                    symbols.some(s => s.icon === symbol)
                ) &&
                Number.isSafeInteger(item.profit) &&
                typeof item.result === "string"
            )
            .slice(0, MAX_HISTORY);

        if (game.bet > game.balance && game.balance >= MIN_BET) {
            game.bet = Math.floor(game.balance / BET_STEP) * BET_STEP;
        }

        if (game.balance < MIN_BET) {
            game.bet = MIN_BET;
        }

    } catch (error) {
        console.warn("Could not load saved game:", error);
    }
}

function saveGame() {
    try {
        localStorage.setItem(
            "royalSlotsSave",
            JSON.stringify(game)
        );
    } catch (error) {
        console.warn("Could not save game:", error);
    }
}

function updateInterface() {
    elements.balance.textContent = game.balance.toLocaleString("uk-UA");
    elements.headerBalance.textContent = game.balance.toLocaleString("uk-UA");

    elements.betAmount.textContent = game.bet.toLocaleString("uk-UA");

    elements.totalSpins.textContent = game.totalSpins.toLocaleString("uk-UA");

    elements.totalWinnings.textContent =
        game.totalWinnings.toLocaleString("uk-UA");

    elements.jackpot.textContent =
        game.jackpot.toLocaleString("uk-UA");

    elements.spinButton.disabled =
        isSpinning || game.balance < game.bet || game.balance < MIN_BET;

    elements.increaseBet.disabled =
        isSpinning ||
        game.bet + BET_STEP > game.balance;

    elements.decreaseBet.disabled =
        isSpinning || game.bet <= MIN_BET;

    elements.maxBet.disabled =
        isSpinning || game.balance < MIN_BET;

    elements.autoButton.disabled =
        isSpinning && !autoSpin;

    elements.spinButton.style.opacity =
        elements.spinButton.disabled ? "0.6" : "1";

    elements.clicker.style.display =
        game.balance < MIN_BET ? "block" : "none";

    elements.clickerClicks.textContent =
        game.clickerClicks.toLocaleString("uk-UA");

    saveGame();
}

function getRandomSymbol() {
    const index = Math.floor(Math.random() * symbols.length);
    return symbols[index];
}

function setMessage(message, type = "") {
    elements.resultMessage.textContent = message;
    elements.resultMessage.className = "result-message";

    if (type) {
        elements.resultMessage.classList.add(type);
    }
}

function getAudioContext() {
    if (!audioContext) {
        const AudioContextClass =
            window.AudioContext || window.webkitAudioContext;

        if (!AudioContextClass) return null;

        audioContext = new AudioContextClass();
    }

    if (audioContext.state === "suspended") {
        audioContext.resume();
    }

    return audioContext;
}

function playTone(frequency, duration, volume = 0.08, type = "sine") {
    const context = getAudioContext();

    if (!context) return;

    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(
        frequency,
        context.currentTime
    );

    gain.gain.setValueAtTime(volume, context.currentTime);

    gain.gain.exponentialRampToValueAtTime(
        0.001,
        context.currentTime + duration
    );

    oscillator.connect(gain);
    gain.connect(context.destination);

    oscillator.start();
    oscillator.stop(context.currentTime + duration);
}

function startSpinSound() {
    stopSpinSound();

    playTone(180, 0.12, 0.04, "square");

    spinSoundTimer = setInterval(() => {
        playTone(160 + Math.random() * 100, 0.08, 0.025, "square");
    }, 130);
}

function stopSpinSound() {
    if (spinSoundTimer !== null) {
        clearInterval(spinSoundTimer);
        spinSoundTimer = null;
    }
}

function playStopSound() {
    playTone(300, 0.12, 0.06, "triangle");
}

function playWinSound() {
    const notes = [523, 659, 784, 1046, 1318];

    notes.forEach((note, index) => {
        setTimeout(() => {
            playTone(note, 0.35, 0.09, "sine");
        }, index * 130);
    });
}

function playBonusSound() {
    playTone(660, 0.18, 0.07);
    setTimeout(() => playTone(880, 0.2, 0.07), 150);
}

function spinReel(reel, duration) {
    return new Promise(resolve => {
        reel.classList.remove("winner");
        reel.classList.add("spinning");

        const symbolElement = reel.querySelector(".symbol");

        const animationInterval = setInterval(() => {
            const randomSymbol = getRandomSymbol();
            symbolElement.textContent = randomSymbol.icon;
        }, 80);

        setTimeout(() => {
            clearInterval(animationInterval);

            const finalSymbol = getRandomSymbol();

            symbolElement.textContent = finalSymbol.icon;

            reel.classList.remove("spinning");

            playStopSound();

            resolve(finalSymbol);
        }, duration);
    });
}

function evaluateResult(results) {
    const counts = {};

    results.forEach(symbol => {
        counts[symbol.icon] = (counts[symbol.icon] || 0) + 1;
    });

    const matchedSymbol = results.find(
        symbol => counts[symbol.icon] >= 2
    );

    if (!matchedSymbol) {
        return {
            type: "lose",
            multiplier: 0,
            message: "NO WIN - TRY AGAIN!"
        };
    }

    if (counts[matchedSymbol.icon] === 3) {
        return {
            type: "triple",
            multiplier: matchedSymbol.multiplier,
            message: matchedSymbol.name + " - BIG WIN!"
        };
    }

    return {
        type: "bonus",
        multiplier: 2,
        message: "TWO MATCH - BONUS!"
    };
}

function showWinPopup(amount, title) {
    elements.winAmount.textContent = amount.toLocaleString("uk-UA");
    elements.winTitle.textContent = title;

    elements.winOverlay.classList.add("show");
}

function closeWinPopup() {
    elements.winOverlay.classList.remove("show");
}

function addHistory(results, profit, resultType) {
    const historyItem = {
        symbols: results.map(symbol => symbol.icon),
        profit: profit,
        result: resultType,
        time: Date.now()
    };

    game.history.unshift(historyItem);

    if (game.history.length > MAX_HISTORY) {
        game.history.pop();
    }

    renderHistory();
}

function renderHistory() {
    elements.historyList.innerHTML = "";

    if (game.history.length === 0) {
        elements.historyList.innerHTML =
            '<p class="empty-history">No games yet...</p>';

        return;
    }

    game.history.forEach(item => {
        const row = document.createElement("div");
        row.className = "history-item";

        const symbolsElement = document.createElement("span");
        symbolsElement.className = "history-symbols";
        symbolsElement.textContent = item.symbols.join(" ");

        const profitElement = document.createElement("span");

        profitElement.className = "history-profit";

        if (item.profit <= 0) {
            profitElement.classList.add("loss");
        }

        profitElement.textContent =
            (item.profit > 0 ? "+" : "") +
            item.profit.toLocaleString("uk-UA");

        row.append(symbolsElement, profitElement);

        elements.historyList.appendChild(row);
    });
}

function showWinningReels() {
    elements.reels.forEach(reel => {
        reel.classList.add("winner");
    });
}

function clearWinningReels() {
    elements.reels.forEach(reel => {
        reel.classList.remove("winner");
    });
}

function stopAutoSpin() {
    autoSpin = false;

    if (autoTimer !== null) {
        clearTimeout(autoTimer);
        autoTimer = null;
    }

    elements.autoButton.classList.remove("active");
    elements.autoButton.innerHTML = "▶ AUTO SPIN";
    elements.autoStatus.textContent = "AUTO SPIN: OFF";

    updateInterface();
}

function scheduleAutoSpin() {
    if (!autoSpin) return;

    if (game.balance < game.bet || game.balance < MIN_BET) {
        stopAutoSpin();
        setMessage("NOT ENOUGH COINS!", "lose");
        return;
    }

    autoTimer = setTimeout(() => {
        autoTimer = null;

        if (autoSpin && !isSpinning) {
            startSpin();
        }
    }, 1800);
}

function startAutoSpin() {
    if (autoSpin) {
        stopAutoSpin();
        return;
    }

    if (isSpinning || game.balance < MIN_BET) {
        setMessage("NOT ENOUGH COINS!", "lose");
        return;
    }

    if (game.balance < game.bet) {
        setMessage("LOWER YOUR BET FIRST!", "lose");
        return;
    }

    autoSpin = true;

    elements.autoButton.classList.add("active");
    elements.autoButton.innerHTML = "■ STOP AUTO";
    elements.autoStatus.textContent = "AUTO SPIN: ON";

    startSpin();
}

async function startSpin() {
    if (isSpinning) return;

    if (game.balance < game.bet || game.balance < MIN_BET) {
        setMessage("NOT ENOUGH COINS!", "lose");
        stopAutoSpin();
        updateInterface();
        return;
    }

    isSpinning = true;

    closeWinPopup();
    clearWinningReels();

    game.balance -= game.bet;
    game.totalSpins++;

    const currentBet = game.bet;

    setMessage("GOOD LUCK...");

    updateInterface();

    startSpinSound();

    try {
        const results = await Promise.all([
            spinReel(elements.reels[0], 1300),
            spinReel(elements.reels[1], 1900),
            spinReel(elements.reels[2], 2500)
        ]);

        stopSpinSound();

        const result = evaluateResult(results);

        let payout = 0;
        let netProfit = -currentBet;

        if (result.multiplier > 0) {
            payout = currentBet * result.multiplier;

            game.balance += payout;
            game.totalWinnings += payout;

            netProfit = payout - currentBet;

            showWinningReels();

            if (result.type === "triple") {
                setMessage(
                    result.message + " +" + payout,
                    "win"
                );

                playWinSound();

                if (!autoSpin) {
                    showWinPopup(
                        payout,
                        result.multiplier === 100
                            ? "JACKPOT!"
                            : "BIG WIN!"
                    );
                }

            } else {
                setMessage(
                    result.message + " +" + payout,
                    "bonus"
                );

                playBonusSound();

                if (!autoSpin) {
                    showWinPopup(payout, "BONUS WIN!");
                }
            }

        } else {
            setMessage(result.message, "lose");
        }

        addHistory(
            results,
            netProfit,
            result.type
        );

        updateInterface();

    } catch (error) {
        console.error("Spin error:", error);

        stopSpinSound();

        setMessage("SOMETHING WENT WRONG!", "lose");

    } finally {
        isSpinning = false;

        updateInterface();

        if (autoSpin) {
            scheduleAutoSpin();
        }
    }
}

function increaseBet() {
    if (isSpinning) return;

    if (game.bet + BET_STEP > game.balance) {
        setMessage("NOT ENOUGH COINS!", "lose");
        return;
    }

    game.bet += BET_STEP;

    updateInterface();
    setMessage("BET INCREASED");
}

function decreaseBet() {
    if (isSpinning) return;

    if (game.bet <= MIN_BET) return;

    game.bet = Math.max(
        MIN_BET,
        game.bet - BET_STEP
    );

    updateInterface();
    setMessage("BET DECREASED");
}

function setMaxBet() {
    if (isSpinning) return;

    if (game.balance < MIN_BET) {
        setMessage("NOT ENOUGH COINS!", "lose");
        return;
    }

    game.bet = Math.floor(game.balance / BET_STEP) * BET_STEP;

    updateInterface();
    setMessage("MAX BET ACTIVATED");
}

elements.spinButton.addEventListener("click", () => {
    if (!autoSpin) {
        startSpin();
    }
});

elements.increaseBet.addEventListener("click", increaseBet);

elements.decreaseBet.addEventListener("click", decreaseBet);

elements.maxBet.addEventListener("click", setMaxBet);

elements.autoButton.addEventListener("click", startAutoSpin);

elements.closeWin.addEventListener("click", closeWinPopup);

elements.winOverlay.addEventListener("click", event => {
    if (event.target === elements.winOverlay) {
        closeWinPopup();
    }
});

document.addEventListener("keydown", event => {
    if (event.code === "Space" && !isSpinning && !autoSpin) {
        event.preventDefault();
        startSpin();
    }

    if (event.key === "Escape") {
        closeWinPopup();
    }
});

createClicker();
loadGame();
renderHistory();
updateInterface();
setMessage("GOOD LUCK!");
