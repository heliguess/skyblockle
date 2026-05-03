import { GameState } from "./state.js";
import { pairOf } from "./utils.js";

export function addGrid(itemData, isRestore = false) {
    const ROW_STAGGER_MS = 0;
    const CELL_OFFSET_MS = 300;
    const DURATION_MS = 300;

    const cols = Math.max(grid.querySelectorAll(".cell.title").length, 1);
    const existingCells = grid.querySelectorAll(".cell:not(.title)").length;
    let existingRows = Math.floor(existingCells / cols);
    let rowResults = [];
    let displayIndex = 0;
    let cellsToAdd = [];
    
    itemData.forEach((element, index) => {

    if (index === 1) {
        return;
    }
    if (index === 7) {
        return;
    }
        const cell = document.createElement('div');
        cell.className = "cell";

        if(Array.isArray(element)){
            if (element.length === 0) {
                cell.textContent = "No ability";
            } else {
                cell.innerHTML = element.join("<br>");
            }
        } else if (element === itemData[2] || element === itemData[3]){
            cell.innerHTML = element
            if(element < GameState.ansData[index]){
                cell.innerHTML += " <span class='arrow'>↑</span>"
                cell.classList.add("higher");
            } else if(element > GameState.ansData[index]){
                cell.innerHTML += " <span class='arrow'> ↓</span>"
                cell.classList.add("lower");
            }
        }else if (element === itemData[0]){
            let parsedName = itemData[0];
            const pair = pairOf(itemData[0]);
            if (pair) {
                parsedName = pair;
            }
            
            if(element == "Aspect of the Jerry, Signature Edition"){
                parsedName = "AOTJ, Signature Edition"
            } else if (element == "§4Sin§5seeker Scythe"){
                parsedName = "Sinseeker Scythe"
            }

            let imgSrc;
            let fallbackSrc = `img/vanilla/${itemData[7].toLowerCase()}.png`;
            if(GameState.texture == 'hplus') {
                imgSrc = `img/hplus/${itemData[1].toLowerCase()}.png`
            } else if (GameState.texture == 'fursky') {
                imgSrc = `img/fursky/${itemData[1].toLowerCase()}.png`
            } else {
                imgSrc = fallbackSrc;
            }
        
            cell.innerHTML = `<div class="imgCell"><img alt='${parsedName}' data-id='${itemData[1]}' data-material='${itemData[7]}' title='${parsedName}' height='55px'><div>${parsedName}</div></div>`;
            
            const img = cell.querySelector('img');
            img.src = imgSrc;
            img.onerror = function() {
                console.log(`${imgSrc} not found. Falling back to ${fallbackSrc}`)
                this.onerror = null;
                this.src = fallbackSrc;
            };
        }else{
            cell.innerHTML = element
        }

    let result = checkBg(cell, index, element, GameState.ansData);

        //if (index > 0) rowResults.push(result);
        if (typeof result !== "undefined") rowResults.push(result);
        
        if (!cell.classList.contains('title')) {
            if (isRestore) {
                cell.style.animation = 'none';
                cell.style.opacity = '1';
                cell.style.transform = 'none';
            } else {
                const rowBaseDelay = existingRows * ROW_STAGGER_MS;
                const cellDelay = rowBaseDelay + (displayIndex * CELL_OFFSET_MS);
                cell.style.animation = `reveal ${DURATION_MS}ms ease ${cellDelay}ms both`;
            }
            displayIndex++;
    }

        cellsToAdd.push(cell);
    });
    
    const firstNonTitleCell = grid.querySelector(".cell:not(.title)");
    cellsToAdd.forEach(cell => {
        if (firstNonTitleCell) {
            grid.insertBefore(cell, firstNonTitleCell);
        } else {
            grid.appendChild(cell);
        }
    });

    if (!isRestore && rowResults.length > 0) {
    GameState.shareRows.push(buildShareRow(rowResults));
    if (!GameState.practiceActive) {
        localStorage.setItem("skyblockdle_shareRows", JSON.stringify(GameState.shareRows));
    }
}
}

export function checkBg(cell, index, itemData, itemAns) {
    let answerVal = itemAns[index];
    const dataPair = pairOf(itemData);
    if (index === 7) return;

    let results = [];

    // Higher/Lower logic (only for specific indices, e.g., 2 and 3)
    if (index === 2 || index === 3) {
        if (itemData < answerVal) {
            results.push("higher");
            cell.classList.add("higher");
        } else if (itemData > answerVal) {
            results.push("lower");
            cell.classList.add("lower");
        }
    }

    // Arrays / abilities
    if (Array.isArray(itemData) || Array.isArray(answerVal) || itemData === null || answerVal === null) {
        const color = abilityColor(itemData, answerVal);
        cell.classList.add(color);
        results.push(color);
        return results.join(" ");
    }

    // Pair check
    if (dataPair && dataPair === answerVal) {
        cell.classList.add("won");
        results.push("won");
    } else if (itemData === answerVal) {
        if (index === 0) {
            cell.classList.add("won");
            results.push("won");
        } else {
            cell.classList.add("correct");
            results.push("correct");
        }
    } else {
        if (index === 0) {
            cell.classList.add("lost");
            results.push("lost");
        } else {
            cell.classList.add("absent");
            results.push("absent");
        }
    }

    return results.join(" ");
}

export function abilityColor(foundArr, ansArr) {
    foundArr = Array.isArray(foundArr) ? foundArr : [];
    ansArr = Array.isArray(ansArr) ? ansArr : [];

    let matches = foundArr.filter(v => ansArr.includes(v)).length;

    let exactMatch = matches === foundArr.length && matches === ansArr.length;

    if (exactMatch) return "correct";
    if (matches >= 1) return "present";
    return "absent";
}

export function buildShareRow(cellResults) {
    if (GameState.gaveUp) {
        return "🏳️".repeat(cellResults.length);
    }
    return cellResults.map(res => {
        if (res.includes("higher")) return "⬆️";
        if (res.includes("lower")) return "⬇️";
        if (res.includes("won")) return "✅";
        if (res.includes("correct")) return "🟩";
        if (res.includes("lost")) return "❌";
        if (res.includes("present")) return "🟥";
        return "🟥";
    }).join("");
}