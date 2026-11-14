
"use strict";

// ======================================
// ELEMENTS
// ======================================

const wheel = document.getElementById("wheel");
const wheelLabels = document.getElementById("wheelLabels");
const spinButton = document.getElementById("spinButton");

const balanceElement = document.getElementById("balance");
const betInput = document.getElementById("bet");

const resultElement = document.getElementById("result");
const resultBox = document.getElementById("resultBox");
const instruction = document.getElementById("instruction");

const maxButton = document.getElementById("maxButton");
const prizeCards = document.querySelectorAll(".prize-item");
const quickBetButtons = document.querySelectorAll(".quick-bet");

// ======================================
// GAME SETTINGS
// ======================================

let balance = 1000;
let currentRotation = 0;
let isSpinning = false;

const prizes = [
    {
        multiplier: 1.2,
        chance: 30,
        label: "1.2x",
        color: "#9d3be8"
    },
    {
        multiplier: 1.3,
        chance: 25,
        label: "1.3x",
        color: "#6829b5"
    },
    {
        multiplier: 2,
        chance: 20,
        label: "2x",
        color: "#236e69"
    },
    {
        multiplier: 3,
        chance: 12,
        label: "3x",
        color: "#2453a0"
    },
    {
        multiplier: 5,
        chance: 8,
        label: "5x",
        color: "#7139a5"
    },
    {
        multiplier: 10,
        chance: 5,
        label: "10x",
        color: "#c18b29"
    }
];

// Calculate sector angles automatically
prizes.forEach(prize => {
    prize.angle = prize.chance * 3.6;
});

// ======================================
// CREATE WHEEL
// ======================================

function createWheel() {

    let currentAngle = 0;
    const gradientParts = [];

    prizes.forEach(prize => {

        const nextAngle = currentAngle + prize.angle;

        gradientParts.push(
            `${prize.color} ${currentAngle}deg ${nextAngle}deg`
        );

        currentAngle = nextAngle;

    });

    wheel.style.background =
        `conic-gradient(from 0deg, ${gradientParts.join(", ")})`;

    createLabels();
}

// ======================================
// CREATE LABELS
// ======================================

function createLabels() {

    wheelLabels.innerHTML = "";

    const radius = wheel.clientWidth * 0.345;

    let currentAngle = 0;

    prizes.forEach(prize => {

        const middleAngle =
            currentAngle + prize.angle / 2;

        const radians =
            middleAngle * Math.PI / 180;

        const x = Math.sin(radians) * radius;
        const y = -Math.cos(radians) * radius;

        const label = document.createElement("div");

        label.className = "wheel-label";
        label.textContent = prize.label;

        label.style.transform =
            `translate(-50%, -50%) translate(${x}px, ${y}px)`;

        wheelLabels.appendChild(label);

        currentAngle += prize.angle;

    });
}

// ======================================
// BALANCE
// ======================================

function updateBalance() {

    balance = Math.round(balance * 100) / 100;

    balanceElement.textContent =
        "$" + balance.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });

}

// ======================================
// RESULT
// ======================================

function showResult(message, type = "") {

    resultElement.innerHTML = `
        <span class="result-dot"></span>
        ${message}
    `;

    resultElement.className = "result " + type;

    resultBox.style.borderColor =
        type === "win" ? "#399b75" :
        type === "lose" ? "#a34455" :
        "#49365d";

}

// ======================================
// RANDOM PRIZE
// ======================================

function getRandomPrize() {

    const random = Math.random() * 100;

    let accumulated = 0;

    for (const prize of prizes) {

        accumulated += prize.chance;

        if (random < accumulated) {
            return prize;
        }

    }

    return prizes[prizes.length - 1];
}

// ======================================
// HIGHLIGHT PRIZE
// ======================================

function highlightPrize(prize) {

    prizeCards.forEach(card => {

        card.classList.remove("active");

        if (
            Number(card.dataset.multiplier) ===
            prize.multiplier
        ) {
            card.classList.add("active");
        }

    });

}

function clearPrizeHighlight() {

    prizeCards.forEach(card => {
        card.classList.remove("active");
    });

}

// ======================================
// QUICK BET BUTTONS
// ======================================

quickBetButtons.forEach(button => {

    button.addEventListener("click", () => {

        if (isSpinning) return;

        const amount = Number(button.dataset.bet);

        if (!Number.isFinite(amount) || amount <= 0) return;

        betInput.value = Math.min(amount, balance).toFixed(2);

        showResult(`BET SELECTED: $${betInput.value}`);

    });

});

// ======================================
// MAX BUTTON
// ======================================

maxButton.addEventListener("click", () => {

    if (isSpinning) return;

    betInput.value = balance.toFixed(2);

    showResult(`MAX BET: $${betInput.value}`);

});

// ======================================
// CALCULATE ROTATION
// ======================================

function calculateRotation(prize) {

    let angleBefore = 0;

    for (const item of prizes) {

        if (item === prize) break;

        angleBefore += item.angle;

    }

    const prizeMiddle =
        angleBefore + prize.angle / 2;

    const normalizedRotation =
        ((currentRotation % 360) + 360) % 360;

    const targetAngle =
        (360 - ((normalizedRotation + prizeMiddle) % 360)) % 360;

    const extraSpins =
        360 * (5 + Math.floor(Math.random() * 4));

    return currentRotation + extraSpins + targetAngle;

}

// ======================================
// START GAME
// ======================================

function startGame() {

    if (isSpinning) return;

    const bet = Number(betInput.value);

    if (!Number.isFinite(bet) || bet <= 0) {

        showResult("ENTER A VALID BET!", "lose");

        instruction.textContent =
            "Please enter a valid amount.";

        return;
    }

    const roundedBet = Math.round(bet * 100) / 100;

    if (roundedBet > balance) {

        showResult("NOT ENOUGH BALANCE!", "lose");

        instruction.textContent =
            "You don't have enough money.";

        return;
    }

    if (roundedBet < 0.01) return;

    clearPrizeHighlight();

    // Take bet
    balance -= roundedBet;
    updateBalance();

    isSpinning = true;

    spinButton.disabled = true;

    spinButton.querySelector(".spin-text").textContent =
        "WAIT";

    instruction.innerHTML =
        '<span class="hint-icon">✦</span> THE WHEEL IS SPINNING...';

    showResult("GOOD LUCK! WISH YOU THE BEST!");

    // Select prize
    const prize = getRandomPrize();

    // Calculate rotation
    const targetRotation = calculateRotation(prize);

    currentRotation = targetRotation;

    // Animation duration
    const duration = 5500 + Math.random() * 1500;

    wheel.style.transition =
        `transform ${duration}ms cubic-bezier(0.12, 0.65, 0.12, 1)`;

    // Start animation
    wheel.style.transform =
        `rotate(${targetRotation}deg)`;

    // Finish animation
    setTimeout(() => {

        finishGame(prize, roundedBet);

    }, duration + 100);

}

// ======================================
// FINISH GAME
// ======================================

function finishGame(prize, bet) {

    const winnings =
        Math.round(bet * prize.multiplier * 100) / 100;

    // Add winnings
    balance += winnings;

    updateBalance();

    isSpinning = false;

    spinButton.disabled = false;

    spinButton.querySelector(".spin-text").textContent =
        "SPIN";

    // Highlight winning prize
    highlightPrize(prize);

    // Calculate profit
    const profit =
        Math.round((winnings - bet) * 100) / 100;

    // Show result
    showResult(
        `✦ ${prize.label} — YOU WON $${winnings.toFixed(2)}!`,
        "win"
    );

    instruction.innerHTML =
        `✦ PAYOUT: $${winnings.toFixed(2)} | PROFIT: $${profit.toFixed(2)}`;

}

// ======================================
// SPIN BUTTON
// ======================================

spinButton.addEventListener("click", startGame);

// ======================================
// INITIALIZATION
// ======================================

createWheel();

updateBalance();

showResult("READY TO PLAY");

window.addEventListener("resize", createLabels);
