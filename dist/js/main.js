// Make sure sw are supported
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker
            .register('../serviceWorker.js')
            .then(reg => console.log(`Service Worker: Registered ${reg}`))
            .catch(err => console.log(`Service Worker: Error: ${err}`));
    });
}


'use strict'
'MINESWEEPER GAME'
//global veriables in here:
var gSettings = {
    BOARD_SIZE: 16,
    BOMB_QUANTITY: 40,
}
var gGameState = {
    isOn: false,
    openCellsCount: 0,
    markedCellsCount: 0,
    boardIsReady: true,
    hints: 3,
}
var gBoard


initGame();



function startIndependentClock() {
    //clock stops independently when the game stops.
    var seconds = 0;
    var interval = setInterval(function () {
        if (gGameState.isOn === false) {
            clearInterval(interval);
        } else {
            seconds += 1;
            var currSeconds = seconds.toString().padStart(3, '0')
            document.querySelector('.clock span').innerText = currSeconds
        }
    }, 1000);
}



function renderBombsCount() {
    if (gGameState.isOn === true) {
        var currBombsCount = gSettings.BOMB_QUANTITY - gGameState.markedCellsCount
        currBombsCount = currBombsCount.toString().padStart(3, '0')
        document.querySelector('.bombsCount span').innerText = currBombsCount
    }
}

/////////////////////////////end of game functions///////////////////////////////
function handlePlayerWon() {
    GameOver()
    CSSForPlayerWon()

}
function handlePlayerLost(bombTd) {
    GameOver()
    CSSForPlayerLost(bombTd)
}

function GameOver() {
    gGameState.isOn = false
    gGameState.boardIsReady = false
    applyCSSOnSmiley()
}

function isPlayerWon() {
    return (gGameState.openCellsCount === gBoard.length * gBoard[0].length - gSettings.BOMB_QUANTITY)
}


function pressStartGame(elTd) {
    if (gGameState.isOn === false && gGameState.boardIsReady === true) {
        //init CSS for HINT
        document.querySelector('.hint').style.borderColor = 'green'
        ///
        var cell = getCell(elTd)
        if (cell.isBomb === true) {
            //set the board again and "press" the new td in this location
            var cellI = getIdxI(elTd)
            var cellJ = getIdxJ(elTd)
            initGame()
            elTd = document.getElementById(`${cellI}_${cellJ}`)
            pressStartGame(elTd)
            tdLeftClicked(elTd)
        } else {
            gGameState.isOn = true
            startIndependentClock()
        }
    }
}

function initGame() {

    //init global veriables
    gGameState.boardIsReady = true
    gGameState.isOn = false
    gGameState.openCellsCount = 0
    gGameState.markedCellsCount = 0
    gGameState.hints = 3
    document.querySelector('.bombsCount span').innerText = gSettings.BOMB_QUANTITY.toString().padStart(3, '0')
    document.querySelector('.clock span').innerText = '000'

    //init gBoard
    gBoard = getEmptyBoard(gSettings.BOARD_SIZE, gSettings.BOARD_SIZE)
    plantBombsOnGBoard(gSettings.BOMB_QUANTITY)
    initPeripheralBombsCountToGBoard()

    //create HTML table
    document.querySelector('table').innerHTML = getStrHtmlTableWithIds(gSettings.BOARD_SIZE, gSettings.BOARD_SIZE)

    //disable a contextmenu on rightclick
    document.addEventListener("contextmenu", function (e) {
        e.preventDefault();
    }, false);

    //init CSS on html & smiley
    var elTds = document.querySelectorAll('td')
    for (let i = 0; i < elTds.length; i++) {
        elTds[i].classList = 'blank'
        elTds[i].addEventListener('mousedown', (ev) => {
            if (!getCell(ev.target).isOpen && gGameState.isOn === true && ev.target.classList[0] != 'flagged') {
                ev.target.classList = 'open0'
            }
        })
        elTds[i].addEventListener('mouseout', (ev) => {
            if (!getCell(ev.target).isOpen && gGameState.isOn === true && ev.target.classList[0] != 'flagged') {
                ev.target.classList = 'blank'
            }
        })
    }
    var elSmiley = document.getElementById("smiley")
    elSmiley.classList = "happy"

    document.querySelector('.hint').style.borderColor = 'grey'
}


////////////////////GAMEPLAY MAIN FUNCTIONS/////////////////////////

function tdLeftClicked(elTd) {
    if (gGameState.isOn === false) return
    //getting all the cell info
    var cell = getCell(elTd)
    var iIdx = getIdxI(elTd)
    var jIdx = getIdxJ(elTd)
    //if its marked - do nothing
    if (cell.isMarked === true) return
    if (cell.isOpen === true) return
    //open cell
    cell.isOpen = true
    applyCSSOnCell(iIdx, jIdx, elTd)


    if (cell.isBomb === true) {
        handlePlayerLost(elTd)
    } else {
        if (cell.peripheralBombs === '0') {
            openPeripherals(iIdx, jIdx)
        }
        gGameState.openCellsCount++
        if (isPlayerWon()) handlePlayerWon()
    }
}

function openPeripherals(cellI, cellJ) {
    for (var i = cellI - 1; i <= cellI + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue;
        for (var j = cellJ - 1; j <= cellJ + 1; j++) {
            if (i === cellI && j === cellJ) continue;
            if (j < 0 || j >= gBoard[i].length) continue;
            if (gBoard[i][j].isMarked === true) continue;
            if (gBoard[i][j].isOpen === true) continue;
            var currTd = document.getElementById(`${i}_${j}`)
            tdLeftClicked(currTd)
        }
    }

}

function tdRightClicked(elTd) {
    if (gGameState.isOn === false) return

    var cell = getCell(elTd)
    toggleIsMarked(cell)
    var iIdx = getIdxI(elTd)
    var jIdx = getIdxJ(elTd)
    applyCSSOnCell(iIdx, jIdx, elTd)
}
function toggleIsMarked(cell) {
    if (cell.isMarked === true) {
        cell.isMarked = false
        gGameState.markedCellsCount--

    } else {
        if (gGameState.markedCellsCount === gSettings.BOMB_QUANTITY) return
        cell.isMarked = true
        gGameState.markedCellsCount++

    }
    renderBombsCount()
}


function showHint() {
    if (gGameState.isOn && gGameState.hints > 0) {
        //generate random eltd without a bomb
        function getClosedNoneBombTD() {
            var isFound = false
            while (!isFound) {
                var iIdx = getRandomInt(0, gBoard.length)
                var jIdx = getRandomInt(0, gBoard[0].length)
                if (gBoard[iIdx][jIdx].isBomb === false && gBoard[iIdx][jIdx].isOpen === false) {
                    var elTd = document.getElementById(`${iIdx}_${jIdx}`)
                    isFound = true
                }
            }
            return elTd
        }
        var elTd = getClosedNoneBombTD()

        tdLeftClickedForHint(elTd)

        function tdLeftClickedForHint(elTd) {
            console.log('activated!')
            if (gGameState.isOn === false) return
            //getting all the cell info
            var cell = getCell(elTd)
            var iIdx = getIdxI(elTd)
            var jIdx = getIdxJ(elTd)
            //if its marked - do nothing
            if (cell.isMarked === true) return
            if (cell.isOpen === true) return
            //open cell
            cell.isOpen = true
            applyCSSOnCell(iIdx, jIdx, elTd)

            setTimeout(function (cell, iIdx, jIdx, elTd) {
                cell.isOpen = false
                applyCSSOnCell(iIdx, jIdx, elTd)
            }, 1000, cell, iIdx, jIdx, elTd)

            if (cell.peripheralBombs === '0') {
                openPeripheralsForHint(iIdx, jIdx)
            }
        }
        function openPeripheralsForHint(cellI, cellJ) {
            for (var i = cellI - 1; i <= cellI + 1; i++) {
                if (i < 0 || i >= gBoard.length) continue;
                for (var j = cellJ - 1; j <= cellJ + 1; j++) {
                    if (i === cellI && j === cellJ) continue;
                    if (j < 0 || j >= gBoard[i].length) continue;
                    if (gBoard[i][j].isMarked === true) continue;
                    if (gBoard[i][j].isOpen === true) continue;
                    var currTd = document.getElementById(`${i}_${j}`)
                    tdLeftClickedForHint(currTd)
                }
            }

        }
        gGameState.hints--

        switch (gGameState.hints.toString()) {
            case '3':
                document.querySelector('.hint').style.borderColor = 'green'

                break;
            case '2':
                document.querySelector('.hint').style.borderColor = 'orange'

                break;
            case '1':
                document.querySelector('.hint').style.borderColor = 'red'

                break;
            case '0':
                document.querySelector('.hint').style.borderColor = 'grey'

                break;
        }


    }
}

function setLevelToBeginner() {
    document.querySelector('.dropdown-content').classList.toggle("show");
    gSettings.BOARD_SIZE = 9
    gSettings.BOMB_QUANTITY = 10
    initGame()
}

function setLevelToIntermediate() {
    document.querySelector('.dropdown-content').classList.toggle("show");
    gSettings.BOARD_SIZE = 16
    gSettings.BOMB_QUANTITY = 40
    initGame()
}

function setLevelToExpert() {
    document.querySelector('.dropdown-content').classList.toggle("show");
    gSettings.BOARD_SIZE = 22
    gSettings.BOMB_QUANTITY = 99
    initGame()
}



/////////////////////CSS functions////////////////////////////
function applyCSSOnCell(cellI, cellJ, elTd) {
    var cell = gBoard[cellI][cellJ]

    if (cell.isOpen === false) {
        if (cell.isMarked === false) {
            elTd.classList = 'blank'
        } else {
            elTd.classList = 'flagged'
        }
    }

    if (cell.isOpen === true) {
        if (cell.isBomb === true) {
            elTd.classList = 'bombRevealed'
        } else {
            elTd.classList = 'open' + cell.peripheralBombs
        }
    }



}


function CSSForPlayerWon() {
    for (let i = 0; i < gBoard.length; i++) {
        for (let j = 0; j < gBoard[0].length; j++) {
            if (gBoard[i][j].isBomb === true) {
                var currTd = document.getElementById(`${i}_${j}`)
                currTd.classList = 'flagged'
            }
        }
    }
    document.querySelector('.bombsCount span').innerText = '000'
}

function CSSForPlayerLost(bombTd) {
    for (let i = 0; i < gBoard.length; i++) {
        for (let j = 0; j < gBoard[0].length; j++) {
            if (gBoard[i][j].isBomb === true) {
                var currTd = document.getElementById(`${i}_${j}`)
                currTd.classList = 'bombRevealed'
            }
        }
    }

    bombTd.classList = 'bombDeath'
}

function applyCSSOnSmiley(ev) {
    var smileyClass = 'happy'
    if (ev && gGameState.isOn) {
        if (ev.type === 'mouseup') {
            smileyClass = 'happy'
        }
        if (ev.type === 'mousedown') {
            switch (ev.toElement.nodeName) {
                case 'BUTTON':
                    smileyClass = 'happyPressed'
                    break;
                case 'TD':
                    if (gGameState.isOn) {
                        smileyClass = 'surprised'
                    }
                    break;
            }
        }


    } else {
        if (!gGameState.boardIsReady) {
            smileyClass = (isPlayerWon()) ? "sunglasses" : "dead"
        }
    }

    var elSmiley = document.getElementById("smiley")
    elSmiley.classList = smileyClass
}


/////////////util functions//////////////////////
function getCell(elTd) {
    var cellIndex = elTd.id.split('_')
    var iIdx = +cellIndex[0]
    var jIdx = +cellIndex[1]
    var cell = gBoard[iIdx][jIdx]
    return cell
}
function getIdxI(elTd) {
    var cellIndex = elTd.id.split('_')
    var iIdx = +cellIndex[0]
    return iIdx
}
function getIdxJ(elTd) {
    var cellIndex = elTd.id.split('_')
    var jIdx = +cellIndex[1]
    return jIdx
}
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}



//////////////////////////init-related functions////////////////////
function getEmptyBoard(rows, cols) {
    var board = []
    for (let i = 0; i < rows; i++) {
        var currRow = []
        board[i] = currRow
        for (let j = 0; j < cols; j++) {
            var newCell = {
                isBomb: false,
                isOpen: false,
                isMarked: false,
                peripheralBombs: -1,
            }
            board[i][j] = newCell
        }
    }
    return board
}

function plantBombsOnGBoard(bombsAmount) {
    var plantCount = 0
    while (plantCount < bombsAmount) {
        var iIdx = getRandomInt(0, gBoard.length)
        var jIdx = getRandomInt(0, gBoard[0].length)
        if (gBoard[iIdx][jIdx].isBomb === false) {
            gBoard[iIdx][jIdx].isBomb = true
            plantCount++
        }
    }
}

function initPeripheralBombsCountToGBoard() {
    for (let i = 0; i < gBoard.length; i++) {
        for (let j = 0; j < gBoard[0].length; j++) {
            //dont insert peripheralBombs count to bombs
            if (gBoard[i][j].isBomb === false) {
                gBoard[i][j].peripheralBombs = getPeripheralBombsCount(i, j).toString()
            }
        }
    }

}
function getPeripheralBombsCount(cellI, cellJ) {
    var bombsCount = 0;
    for (var i = cellI - 1; i <= cellI + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue;
        for (var j = cellJ - 1; j <= cellJ + 1; j++) {
            if (i === cellI && j === cellJ) continue;
            if (j < 0 || j >= gBoard[i].length) continue;
            if (gBoard[i][j].isBomb === true) bombsCount++;
        }
    }
    return bombsCount;
}

function getStrHtmlTableWithIds(rows, cols) {
    var strHtml = `<tbody>`
    for (let i = 0; i < rows; i++) {
        var currRowStrHtml = `<tr>`
        for (let j = 0; j < cols; j++) {
            currRowStrHtml += `<td id="${i}_${j}" onclick="pressStartGame(this),tdLeftClicked(this)" oncontextmenu="tdRightClicked(this)" onmousedown="applyCSSOnSmiley(event)" onmouseup="applyCSSOnSmiley(event)" ></td>`
        }
        currRowStrHtml += `</tr>`
        strHtml += currRowStrHtml
    }
    strHtml += `<tbody>`
    return strHtml
}

function dropdownCSS() {
    document.querySelector('.dropdown-content').classList.toggle("show");
}