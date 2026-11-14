
const suits = ["♠", "♥", "♦", "♣"];
const values = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];

let deck = [];
let playerHand = [];
let dealerHand = [];
let selectedCards = [];
let balance = 1000;
let pot = 100;
let gameStarted = false;

const playerCards = document.getElementById("playerCards");
const dealerCards = document.getElementById("dealerCards");
const dealBtn = document.getElementById("dealBtn");
const drawBtn = document.getElementById("drawBtn");
const newBtn = document.getElementById("newBtn");

function createDeck() {
    deck = [];

    for (let suit of suits) {
        for (let value of values) {
            deck.push({ suit, value });
        }
    }

    deck.sort(() => Math.random() - 0.5);
}

function getCardValue(card) {
    return values.indexOf(card.value) + 2;
}

function takeCard() {
    return deck.pop();
}

function renderCard(card, hidden = false, index = -1) {
    if (hidden) {
        return `<div class="playing-card back">?</div>`;
    }

    const red = card.suit === "♥" || card.suit === "♦";
    const selected = selectedCards.includes(index);

    return `
        <div class="playing-card ${red ? "red" : ""} ${selected ? "selected" : ""}"
             data-index="${index}">
            ${card.value}${card.suit}
        </div>
    `;
}

function renderHands(revealDealer = false) {
    playerCards.innerHTML = playerHand.map((card, i) =>
        renderCard(card, false, i)
    ).join("");

    dealerCards.innerHTML = dealerHand.map(card =>
        renderCard(card, !revealDealer)
    ).join("");

    playerCards.querySelectorAll(".playing-card").forEach(card => {
        card.addEventListener("click", () => {
            if (!gameStarted || drawBtn.disabled) return;

            const index = Number(card.dataset.index);

            if (selectedCards.includes(index)) {
                selectedCards = selectedCards.filter(i => i !== index);
            } else {
                selectedCards.push(index);
            }

            renderHands();
        });
    });
}

function updateBalance() {
    document.getElementById("balance").textContent = balance;
    document.getElementById("playerChips").textContent = balance;
    document.getElementById("pot").textContent = pot;
}

function setMessage(message, info = "") {
    document.getElementById("message").textContent = message;
    document.getElementById("roundInfo").textContent = info;
}

function startGame() {
    if (gameStarted) return;

    if (balance < 50) {
        setMessage("NOT ENOUGH CHIPS!");
        return;
    }

    balance -= 50;
    pot = 100;

    createDeck();

    playerHand = [];
    dealerHand = [];
    selectedCards = [];

    for (let i = 0; i < 5; i++) {
        playerHand.push(takeCard());
        dealerHand.push(takeCard());
    }

    gameStarted = true;

    dealBtn.disabled = true;
    drawBtn.disabled = false;

    document.getElementById("instruction").textContent =
        "Click the cards you want to KEEP, then draw new cards.";

    setMessage("CHOOSE YOUR CARDS", "SELECT THE CARDS TO KEEP");

    renderHands();
    updateBalance();
}

function dealerStrategy() {
    const counts = {};

    dealerHand.forEach(card => {
        counts[card.value] = (counts[card.value] || 0) + 1;
    });

    const keep = dealerHand.filter(card =>
        counts[card.value] >= 2 || getCardValue(card) >= 12
    );

    while (keep.length > 5) keep.pop();

    const newHand = [...keep];

    while (newHand.length < 5) {
        newHand.push(takeCard());
    }

    dealerHand = newHand;
}

function getHandRank(hand) {
    const numbers = hand.map(getCardValue).sort((a, b) => b - a);

    const counts = {};

    numbers.forEach(value => {
        counts[value] = (counts[value] || 0) + 1;
    });

    const groups = Object.entries(counts)
        .map(([value, count]) => ({
            value: Number(value),
            count
        }))
        .sort((a, b) =>
            b.count - a.count || b.value - a.value
        );

    const flush = hand.every(card =>
        card.suit === hand[0].suit
    );

    const unique = [...new Set(numbers)].sort((a, b) => b - a);

    let straight = false;
    let straightHigh = 0;

    if (unique.length === 5) {
        if (unique[0] - unique[4] === 4) {
            straight = true;
            straightHigh = unique[0];
        } else if (unique.join(",") === "14,5,4,3,2") {
            straight = true;
            straightHigh = 5;
        }
    }

    const countsOnly = groups.map(g => g.count);

    if (straight && flush && straightHigh === 14 && unique.includes(10)) {
        return { rank: 9, name: "ROYAL FLUSH", values: [14] };
    }

    if (straight && flush) {
        return { rank: 8, name: "STRAIGHT FLUSH", values: [straightHigh] };
    }

    if (countsOnly[0] === 4) {
        return {
            rank: 7,
            name: "FOUR OF A KIND",
            values: groups.map(g => g.value)
        };
    }

    if (countsOnly[0] === 3 && countsOnly[1] === 2) {
        return {
            rank: 6,
            name: "FULL HOUSE",
            values: groups.map(g => g.value)
        };
    }

    if (flush) {
        return { rank: 5, name: "FLUSH", values: numbers };
    }

    if (straight) {
        return { rank: 4, name: "STRAIGHT", values: [straightHigh] };
    }

    if (countsOnly[0] === 3) {
        return {
            rank: 3,
            name: "THREE OF A KIND",
            values: groups.map(g => g.value)
        };
    }

    if (countsOnly[0] === 2 && countsOnly[1] === 2) {
        return {
            rank: 2,
            name: "TWO PAIR",
            values: groups.map(g => g.value)
        };
    }

    if (countsOnly[0] === 2) {
        return {
            rank: 1,
            name: "ONE PAIR",
            values: groups.map(g => g.value)
        };
    }

    return {
        rank: 0,
        name: "HIGH CARD",
        values: numbers
    };
}

function compareHands(player, dealer) {
    const p = getHandRank(player);
    const d = getHandRank(dealer);

    if (p.rank > d.rank) return 1;
    if (p.rank < d.rank) return -1;

    for (let i = 0; i < Math.max(p.values.length, d.values.length); i++) {
        const pv = p.values[i] || 0;
        const dv = d.values[i] || 0;

        if (pv > dv) return 1;
        if (pv < dv) return -1;
    }

    return 0;
}

function finishGame() {
    dealerStrategy();

    const playerRank = getHandRank(playerHand);
    const dealerRank = getHandRank(dealerHand);

    const result = compareHands(playerHand, dealerHand);

    renderHands(true);

    drawBtn.disabled = true;
    dealBtn.disabled = false;
    gameStarted = false;

    if (result === 1) {
        balance += pot;
        setMessage("🏆 YOU WIN!", playerRank.name + " BEATS " + dealerRank.name);
    } else if (result === -1) {
        setMessage("DEALER WINS!", dealerRank.name + " BEATS " + playerRank.name);
    } else {
        balance += 50;
        setMessage("IT'S A DRAW!", playerRank.name);
    }

    document.getElementById("instruction").textContent =
        "Press DEAL CARDS to play another round.";

    updateBalance();
}

function drawCards() {
    if (!gameStarted) return;

    const oldHand = [...playerHand];

    playerHand = oldHand.map((card, index) => {
        if (selectedCards.includes(index)) {
            return card;
        }

        return takeCard();
    });

    selectedCards = [];

    finishGame();
}

function resetGame() {
    balance = 1000;
    pot = 100;

    playerHand = [];
    dealerHand = [];
    selectedCards = [];

    gameStarted = false;

    dealBtn.disabled = false;
    drawBtn.disabled = true;

    playerCards.innerHTML = `
        <div class="empty-card">?</div>
        <div class="empty-card">?</div>
        <div class="empty-card">?</div>
        <div class="empty-card">?</div>
        <div class="empty-card">?</div>
    `;

    dealerCards.innerHTML = `
        <div class="playing-card back">?</div>
        <div class="playing-card back">?</div>
        <div class="playing-card back">?</div>
        <div class="playing-card back">?</div>
        <div class="playing-card back">?</div>
    `;

    setMessage("PRESS DEAL TO START", "READY FOR A NEW ROUND");

    document.getElementById("instruction").textContent =
        "Start the game and get your five cards.";

    updateBalance();
}

dealBtn.addEventListener("click", startGame);
drawBtn.addEventListener("click", drawCards);
newBtn.addEventListener("click", resetGame);

document.getElementById("rulesBtn").addEventListener("click", () => {
    document.getElementById("rulesModal").classList.add("active");
});

document.getElementById("closeRules").addEventListener("click", () => {
    document.getElementById("rulesModal").classList.remove("active");
});

document.getElementById("rulesModal").addEventListener("click", event => {
    if (event.target.id === "rulesModal") {
        event.currentTarget.classList.remove("active");
    }
});

updateBalance();
