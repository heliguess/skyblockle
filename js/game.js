import { GameState, daggers } from "./state.js";
import { pairOf, getTodayString } from "./utils.js";
import { addGrid, buildShareRow } from "./grid.js";
import { tempMessage, setAlert, clearAlert, showShareButton, enableInput, updateGiveUpVisibility} from "./ui.js";

const guessInput = document.getElementById("guessInput");
const guessBtn = document.getElementById("guessBtn");

function clearGuessRows() {
    const cells = document.querySelectorAll("#grid .cell:not(.title)");
    cells.forEach(cell => cell.remove());
}

function restoreDailyRows() {
    const savedGuesses = JSON.parse(localStorage.getItem("skyblockdle_guesses") || "[]");
    GameState.shareRows = JSON.parse(localStorage.getItem("skyblockdle_shareRows") || "[]");
    GameState.gaveUp = localStorage.getItem("skyblockdle_gaveUp") === "true";
    GameState.guessedItems = [];

    savedGuesses.forEach(name => {
        const foundItem = GameState.items.find(e => e.name === name);
        if (!foundItem) return;

        GameState.guessedItems.push(foundItem);
        addGrid([
            foundItem.name,
            foundItem.id,
            foundItem.damage,
            foundItem.strength,
            foundItem.rarity,
            foundItem.weapon_type,
            foundItem.ability,
            foundItem.material
        ], true);
    });

    if (GameState.gaveUp && GameState.ansData) {
        addGrid(GameState.ansData, true);
    }
}

function returnToMainMenu() {
    GameState.practiceActive = false;
    GameState.practiceGameOver = false;

    if (GameState.dailyItemAns && GameState.dailyAnsData) {
        GameState.itemAns = GameState.dailyItemAns;
        GameState.ansData = GameState.dailyAnsData;
    }

    clearGuessRows();
    restoreDailyRows();

    const backBtn = document.getElementById("practiceBackBtn");
    if (backBtn) backBtn.style.display = "none";

    lockDailyGame();

    const playedToday = localStorage.getItem("skyblockdle_last_played") === getTodayString();
    if (playedToday) {
        const savedGuesses = JSON.parse(localStorage.getItem("skyblockdle_guesses") || "[]");
        showShareButton(savedGuesses.length);
    }

    updateGiveUpVisibility();
}

(function applyDailyLockout() {
        
    const today = getTodayString();
    const lastPlayed = localStorage.getItem("skyblockdle_last_played");
    const guessesDate = localStorage.getItem("skyblockdle_guesses_date");

    if ((lastPlayed && lastPlayed !== today) || (guessesDate && guessesDate !== today)) {
        localStorage.removeItem("skyblockdle_guesses");
        localStorage.removeItem("skyblockdle_shareRows");
        localStorage.removeItem("skyblockdle_last_played");
        localStorage.removeItem("skyblockdle_guesses_date");
        localStorage.removeItem("skyblockdle_gaveUp");
    }


    if (lastPlayed === today) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", lockDailyGame);
        } else {
            lockDailyGame();
        }
    }
})();

function lockDailyGame() {
    const gi = document.getElementById("guessInput");
    const gb = document.getElementById("guessBtn");
    const al = document.getElementById("alert");
    const pb = document.getElementById("practiceBtn");

    if (gi) gi.disabled = true;
    if (gb) gb.disabled = true;
    if (al) al.innerHTML = "Come back tomorrow!";
    GameState.gameOver = true;

    if (pb) {
        pb.style.display = "inline-block";
        pb.onclick = () => {
            console.log("Loading practice mode");
            loadPracticeGame(GameState.items);
        };
    }
}

(function restoreDailyGame() {
    if (!GameState.items || GameState.items.length === 0) {
    console.log("Loading last session");
    setTimeout(restoreDailyGame, 300);
    return;
    }
    const savedGuesses = JSON.parse(localStorage.getItem("skyblockdle_guesses") || "[]");
    GameState.shareRows = JSON.parse(localStorage.getItem("skyblockdle_shareRows") || "[]");
    const restoredLastPlayed = localStorage.getItem("skyblockdle_last_played");
    const savedGuessesDate = localStorage.getItem("skyblockdle_guesses_date");
    GameState.gaveUp = localStorage.getItem("skyblockdle_gaveUp") === "true";


    const todayStr = getTodayString();

    // restore if guesses are from today OR the user already completed today's game
    const shouldRestore = (savedGuessesDate === todayStr && savedGuesses.length > 0)
                          || (restoredLastPlayed === todayStr && (savedGuesses.length > 0 || GameState.shareRows.length > 0));

    if (shouldRestore) {
        savedGuesses.forEach(name => {
            const foundItem = GameState.items.find(e => e.name === name);
            if (foundItem) {
                GameState.guessedItems.push(foundItem);
                updateGiveUpVisibility();
                addGrid([
                    foundItem.name,
                    foundItem.id,
                    foundItem.damage,
                    foundItem.strength,
                    foundItem.rarity,
                    foundItem.weapon_type,
                    foundItem.ability,
                    foundItem.material
                ], true);
                    buildShareRow(GameState.shareRows);
            }
        });

        if (restoredLastPlayed === getTodayString()) {
            showShareButton(GameState.guessedItems.length);
        }
    } else {
        localStorage.removeItem("skyblockdle_guesses");
        localStorage.removeItem("skyblockdle_shareRows");
        localStorage.removeItem("skyblockdle_guesses_date");
    }

    if (GameState.gaveUp) {
    addGrid(GameState.ansData, true);
    lockDailyGame();
    showShareButton(GameState.guessedItems.length);
    }
})();

function loadPracticeGame(itemsGiven) {
    if (!GameState.practiceActive) {
        GameState.dailyItemAns = GameState.itemAns;
        GameState.dailyAnsData = GameState.ansData;
    }

    GameState.practiceActive = true;
    GameState.gaveUp = false;
    GameState.practiceGameOver = false;
    updateGiveUpVisibility();
    enableInput();
    clearAlert();
    
    // random index
    const randomIndex = Math.floor(Math.random() * itemsGiven.length);
    const groupName = pairOf(itemsGiven[randomIndex].name);
    
    if (groupName) {
        GameState.itemAns = {...itemsGiven[randomIndex], name: groupName};
    } else {
        GameState.itemAns = itemsGiven[randomIndex];
    }

    GameState.ansData = [GameState.itemAns.name, GameState.itemAns.id, GameState.itemAns.damage, GameState.itemAns.strength, GameState.itemAns.rarity, GameState.itemAns.weapon_type, GameState.itemAns.ability, GameState.itemAns.material];
    
    GameState.guessedItems = [];
    GameState.shareRows = [];
    
    clearGuessRows();
    
    guessInput.disabled = false;
    guessBtn.disabled = false;
    document.getElementById("practiceBtn").style.display = "none";
    document.getElementById("shareBtn").style.display = "none";
    document.getElementById("practiceBackBtn").style.display = "inline-block";
}

export function checkAnswer() {
    let guess = document.getElementById("guessInput").value
        let foundItem = GameState.items.find(e => e.name.toLowerCase() === guess.toLowerCase());

        if(guess.toLowerCase() == "cowshed"){
            tempMessage("Moo! 🐮")
            return;
        }

        if (guess.toLowerCase() === "meowdding") {
            const mensajes = ["meow", "mrrp", "mrrow", "purr", "meoww :3", ":3", ":3c"];
            tempMessage(mensajes[Math.floor(Math.random() * mensajes.length)]);
            return;
        }

        if(guess.toLowerCase() == "furrybutts" || guess.toLowerCase() == "furbur"){
            tempMessage("cute")
            return;
        }

        if(foundItem){
            let itemData = [foundItem.name, foundItem.id, foundItem.damage, foundItem.strength, foundItem.rarity, foundItem.weapon_type, foundItem.ability, foundItem.material];

            const guessedNames = GameState.guessedItems.map(i => i.name)
            const pairGroup = pairOf(foundItem.name)
            const pairItems = pairGroup ? daggers[pairGroup] : [foundItem.name]
            const alreadyGuessed = pairItems.some(name => guessedNames.includes(name))
            if(alreadyGuessed){
                tempMessage("You already tried that item!")
                return;
            } else{
                GameState.guessedItems.push(foundItem)
                updateGiveUpVisibility();
                if (!GameState.practiceActive) {
                    localStorage.setItem("skyblockdle_guesses", JSON.stringify(GameState.guessedItems.map(i => i.name)));
                    localStorage.setItem("skyblockdle_guesses_date", getTodayString());
                }
                clearAlert();
                document.getElementById("guessInput").value = "";
                addGrid(itemData);
            }

            

            if(foundItem.name  === GameState.itemAns.name || pairOf(foundItem.name) === GameState.itemAns.name){
                if (!GameState.practiceActive) {
                    GameState.gameOver = true;
                    updateGiveUpVisibility();
                    localStorage.setItem("skyblockdle_last_played", getTodayString());
                    document.getElementById("guessInput").value = "";
                    document.getElementById("guessBtn").disabled = true;
                    document.getElementById("guessInput").disabled = true;
                    const pb = document.getElementById("practiceBtn");
                    setTimeout(() => {
                        setAlert("You won!", true);
                        document.getElementById("guessInput").placeholder = "Yay!";
        
                        showShareButton(GameState.guessedItems.length);
                        pb.style.display = "inline-block";
                        pb.onclick = () => {
                        console.log("Loading practice mode");
                        loadPracticeGame(GameState.items);
                    };
                    }, 300*6);

                } else{
                    GameState.practiceGameOver = true;
                    updateGiveUpVisibility();
                    document.getElementById("guessInput").value = "";
                    document.getElementById("guessBtn").disabled = true;
                    document.getElementById("guessInput").disabled = true;
                    setTimeout(() => {
                        document.getElementById("guessInput").placeholder = "Yay!"
                        setAlert("Good job!", true);
                        const pb = document.getElementById("practiceBtn");
                        pb.style.display = "inline-block";
                        pb.onclick = () => {
                        console.log("Loading practice mode");
                        loadPracticeGame(GameState.items);
                    };
                    }, 300*6);
                }
            } else {
                setTimeout(() => {
                    tempMessage("Not correct! Try again!");
                }, 300*6);
            }
        }else{
            tempMessage("Item not found");
        }
}

export function startGame(mode) {
    GameState.gameMode = mode;
    GameState.guessedItems = [];
    GameState.shareRows = [];
}

export function giveUp() {
    if (GameState.practiceActive) {
        if (GameState.practiceGameOver) return; 

        GameState.practiceGameOver = true;

        addGrid(GameState.ansData, false);

        const gi = document.getElementById("guessInput");
        const gb = document.getElementById("guessBtn");
        if (gi) gi.disabled = true;
        if (gb) gb.disabled = true;

        setAlert("Answer revealed!", true);

        const pb = document.getElementById("practiceBtn");
        if (pb) {
            pb.style.display = "inline-block";
            pb.onclick = () => loadPracticeGame(GameState.items);
        }

        updateGiveUpVisibility();
        return;
    }

    if (GameState.gaveUp) return;
    GameState.gaveUp = true;
    GameState.gameOver = true;

    addGrid(GameState.ansData, false);

    localStorage.setItem("skyblockdle_gaveUp", "true");
    localStorage.setItem("skyblockdle_shareRows", JSON.stringify(GameState.shareRows));
    localStorage.setItem("skyblockdle_last_played", getTodayString());

    lockDailyGame();
    showShareButton(GameState.guessedItems.length);
    updateGiveUpVisibility();
}
document.getElementById("giveUpBtn").addEventListener("click", () => {
    if (confirm("Are you sure you want to give up?")) {
        giveUp();
    }
});

document.getElementById("practiceBackBtn").addEventListener("click", e => {
    e.preventDefault();
    returnToMainMenu();
});