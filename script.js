const colCount = 15;
const rowCount = 25;
const itemSize = 25;

const DEG = Math.PI / 180;

const playBtn = document.getElementById('playBtn');
const resumeBtn = document.getElementById('resumeBtn');
const pauseBtn = document.getElementById('pauseBtn');
pauseBtn.onclick = pause;

const container = document.createElement('div');
container.classList.add('container', 'blurLayer');
let rules = [...document.styleSheets[1].cssRules];
for (let i = 0; i < rules.length; i++) {
    if (rules[i].selectorText === '.blurLayer') {
        rules[i].style.width = colCount * itemSize + 'px';
        rules[i].style.height = rowCount * itemSize + 'px';
    }
}

for (let i = 0; i < colCount * rowCount; i++) {
    const cell = document.createElement('div');
    cell.classList.add('cell');
    cell.style.width = itemSize + 'px';
    cell.style.height = itemSize + 'px';
    cell.dataset.index = i;
    // cell.textContent = i;

    container.append(cell);
}

document.getElementById('wrapper').prepend(container);

function min(arr, cord) {
    let minEl = Infinity;
    for (let i = 0; i < arr.length; i++) {
        if (arr[i][cord] < minEl) {
            minEl = arr[i][cord];
        }
    }

    return minEl;
}

function max(arr, cord) {
    let maxEl = -Infinity;
    for (let i = 0; i < arr.length; i++) {
        if (arr[i][cord] > maxEl) {
            maxEl = arr[i][cord];
        }
    }

    return maxEl;
}

class Figure {
    constructor(center, cords) {
        this._center = center;
        this._cords = cords;
    }

    get center() {
        return this._center;
    }

    get cords() {
        return this._cords;
    }

    set center(newCenter) {
        this._center = newCenter;
    }

    bottom() {
        let minY = min(this.cords, 1);

        return this.center - colCount * minY;
    }

    rotate(angle=-90*DEG) {
        //Step 1.
        for (let i = 0; i < this.cords.length; i++) {
            this.cords[i][1] += this.cords[i][0] * Math.round( -Math.sin(angle) );
        }
    
        //Step 2.
        for (let i = 0; i < this.cords.length; i++) {
            this.cords[i][0] += this.cords[i][1] * Math.round( Math.tan(angle / 2) );
        }
    
        //Step 3.
        for (let i = 0; i < this.cords.length; i++) {
            this.cords[i][1] += this.cords[i][0] * Math.round( -Math.sin(angle) );
        }

        while ((this.center + min(this.cords, 0)) % colCount > this.center % colCount) {
            this.move();
        }
        while (this.center % colCount > (this.center + max(this.cords, 0)) % colCount) {
            this.move(false);
        }
    
        return this;
    }

    canMove(direction) {
        let minY = min(this.cords, 1);
        let maxY = max(this.cords, 1);
        for (let i = minY; i <= maxY; i++) {
            let row = this.cords.filter( (el) => {return el[1] === i;} );
            let rowMinX = min(row, 0);
            let prevCell = document.querySelector(`.cell[data-index="${this.center - i * colCount + rowMinX - 1}"]`);
            let rowMaxX = max(row, 0);
            let nextCell = document.querySelector(`.cell[data-index="${this.center - i * colCount + rowMaxX + 1}"]`);
            if (direction === 'left' && ((this.center + rowMinX) % colCount === 0 || prevCell && prevCell.classList.contains('floor'))) {
                return false;
            }
            if (direction === 'right' && ((this.center + rowMaxX + 1) % colCount === 0 || nextCell && nextCell.classList.contains('floor'))) {
                return false;
            }
        }
    
        let minX = min(this.cords, 0);
        let maxX = max(this.cords, 0);
        for (let i = minX; i <= maxX; i++) {
            let col = this.cords.filter( (el) => {return el[0] === i;} );
            let colMinY = min(col, 1);
            let nextCell = document.querySelector(`.cell[data-index="${this.center + i - (colMinY - 1) * colCount}"]`);
            if (direction === 'down' && (this.center + i - (colMinY - 1) * colCount >= rowCount * colCount || nextCell && nextCell.classList.contains('floor'))) {
                return false;
            }
        }
    
        return true;
    }

    move(moveRight=true){
        if (moveRight) {
            this.center++;
        }
        if (!moveRight) {
            this.center--;
        }
    }

    fall() {
        this.center += colCount;
    }
};

class Square extends Figure {
    constructor (center) {
        super(center, [[0, 0], [1, 0], [1, -1], [0, -1]]);
        this.name = 'square';
    }

    rotate(angle=-90*DEG) {
        return this;
    }
}

class L extends Figure {
    constructor (center) {
        super(center, [[0, 0], [1, 0], [-1, 0], [-1, -1]]);
        this.name = 'l';
    }
}

class ReverseL extends Figure {
    constructor (center) {
        super(center, [[0, 0], [1, 0], [-1, 0], [1, -1]]);
        this.name = 'reversel';
    }
}

class Z extends Figure {
    constructor (center) {
        super(center, [[0, 0], [1, 0], [0, 1], [-1, 1]]);
        this.name = 'z';
    }
}

class ReverseZ extends Figure {
    constructor (center) {
        super(center, [[0, 0], [-1, 0], [0, 1], [1, 1]]);
        this.name = 'reversez';
    }
}

class T extends Figure {
    constructor (center) {
        super(center, [[0, 0], [-1, 0], [0, 1], [1, 0]]);
        this.name = 't';
    }
}

class Stick extends Figure {
    constructor (center) {
        super(center, [[0, 0], [-1, 0], [1, 0], [2, 0]]);
        this.name = 'stick';
    }
}

function removeClassFromAll(className) {
    if ( !Array.isArray(className) ) {
        className = [className];
    }
    let c = [].join.call(className, '.');
    let cells = document.querySelectorAll(`.${c}`);
    let length = cells.length;
    for (let i = 0; i < length; i++) {
        cells[i].classList.remove(...className);
    }
}

function drawFigure(fig, className) {
    if ( !Array.isArray(className) ) {
        className = [className];                      // FOR THE SPREAD SYNTAX
    }
    for (let i = 0; i < fig.cords.length; i++) {
        let activeCellIndex = fig.center + fig.cords[i][0] - fig.cords[i][1] * colCount;
        let activeCell = document.querySelector(`.cell[data-index="${activeCellIndex}"]`);
        if (activeCell) {
            activeCell.classList.add(...className);
        }
    }
}

function isFilled(rowIndex=0) {
    let rowFilled = true;
    for (let i = 0; i < colCount; i++) {
        let currentCell = document.querySelector(`.cell[data-index="${colCount * rowIndex + i}"]`);
        if ( !currentCell.classList.contains('floor') ) {
            rowFilled = false;
        }
    }

    return rowFilled;
}

function clear(filledRows) {
    for (let i = 0; i < filledRows.length; i++) {
        let j = 0;
        let currentCell = document.querySelector(`.cell[data-index="${colCount * filledRows[i]}"]`);
        let t = null;

        function clearCell() {
            // ROW CLEAR ANIMATION
            currentCell.className = 'cell';
            if (j < colCount - 1) {
                j++;
                currentCell = document.querySelector(`.cell[data-index="${colCount * filledRows[i] + j}"]`);
                t = setTimeout(function () {
                    clearCell();
                }, 50);
            }
        }

        t = setTimeout(function () {
            clearCell();
        }, 50);
    }

    setTimeout(function () {
        for (let i = filledRows[filledRows.length - 1] - 1; i >= 0; i--) {
            for (let j = 0; j < colCount; j++) {
                let currentCell = document.querySelector(`.cell[data-index="${colCount * i + j}"]`);
                let lowerCell = document.querySelector(`.cell[data-index="${colCount * (i + filledRows.length) + j}"]`);
    
                lowerCell.className = currentCell.className;
                currentCell.className = 'cell';
            }
        }
    }, 400 + 50 * colCount);

    let scores = [0, 10, 20, 50, 100];
    let scoreElem = document.querySelector('#scores span');
    scoreElem.textContent = +scoreElem.textContent + scores[filledRows.length] + '';
    
}

function blurAnimation(elem) {
    let id = null;
    let blurValue = 0;
    let opacityValue = 0;
    elem.style.backdropFilter = `blur(${blurValue}px)`;
    elem.style.opacity = opacityValue;
    clearInterval(id);
    id = setInterval(function () {
        if (opacityValue >= 0.9934) {
            clearInterval(id);
        } else {
            blurValue += 0.0264;
            opacityValue += 0.0066;
            elem.style.backdropFilter = `blur(${blurValue}px)`;
            elem.style.opacity = opacityValue;
        }
    }, 5);
}

let keyPressHandler;
let run = null;
let f;

function createFigure() {
    let randFig = Math.floor(Math.random() * 7);

    switch (randFig) {
        case 0:
            f = new Square();
            break;
        case 1:
            f = new L();
            break;
        case 2:
            f = new ReverseL();
            break;
        case 3:
            f = new Z();
            break;
        case 4:
            f = new ReverseZ();
            break;
        case 5:
            f = new T();
            break;
        case 6:
            f = new Stick();
            break;
        default:
            break;
    }
    let randAngle = Math.floor(Math.random() * 4);
    for (let i = 0; i < randAngle; i++) {
        f.rotate();
    }

    let randCell = Math.floor(Math.random() * (colCount - max(f.cords, 0) + min(f.cords, 0))) - min(f.cords, 0);
    f.center = randCell + colCount * (min(f.cords, 1) - 1);
    
    drawFigure(f, ['active', f.name]);
    
    keyPressHandler = function (e) {
        console.log(`Key "${e.key}"`);
        if (e.key === 'z') {
            f.rotate();
            removeClassFromAll(['active', f.name]);
            drawFigure(f, ['active', f.name]);
        }
        if (e.key === 'ArrowUp') {
            f.rotate(90*DEG);
            removeClassFromAll(['active', f.name]);
            drawFigure(f, ['active', f.name]);
        }
        if (e.key === 'ArrowLeft' && f.canMove('left')) {
            f.move(false);
            removeClassFromAll(['active', f.name]);
            drawFigure(f, ['active', f.name]);
        }
        if (e.key === 'ArrowRight' && f.canMove('right')) {
            f.move();
            removeClassFromAll(['active', f.name]);
            drawFigure(f, ['active', f.name]);
        }
        if (e.key === 'ArrowDown') {
            clearInterval(run);
            run = setInterval(function () {
                fallAnimation(f);
            }, 500);
            if (f.canMove('down')) {
                f.fall()
            };
            removeClassFromAll(['active', f.name]);
            drawFigure(f, ['active', f.name]);
        }
        if (e.key === ' ') {
            while (f.canMove('down')) {
                f.fall();
            }
            removeClassFromAll(['active', f.name]);
            drawFigure(f, ['active', f.name]);
        }
    };
    document.body.addEventListener("keydown", keyPressHandler);
    console.log(f);
    return f;
}

function endGame() {
    document.getElementById('gameEndText').textContent = 'GAME OVER';
    playBtn.textContent = 'Play again';
    document.getElementById('newGame').style.display = 'block';
    blurAnimation(document.getElementById('newGame'));
}

function startGame() {
    document.querySelector('#scores span').textContent = '0';
    let occupiedCells = [...document.getElementsByClassName('floor'), ...document.getElementsByClassName('active')];
    let length = occupiedCells.length;
    for (let i = 0; i < length; i++) {
        occupiedCells[i].className = 'cell';
    }
    f = null;
    document.body.removeEventListener('keydown', keyPressHandler);
    play();
}

function play() {
    pauseBtn.onclick = pause;
    resumeBtn.style.display = 'none';
    document.getElementById('newGame').style.display = 'none';
    if (!f) {
        f = createFigure();
    }

    run = setInterval(function () {
        // OLD VERSION
        // const activeEl = document.querySelectorAll('.cell.active');
        // for (let i = 0; i < activeEl.length; i++) {
        //     const activeIndex = activeEl[i].dataset.index;
        //     const nextIndex = +activeIndex + colCount;
        //     let nextEl = document.querySelector(`.cell[data-index="${nextIndex}"]`);
    
        //     if (nextIndex >= colCount * rowCount) {
        //         clearInterval(run);
        //     } else {
        //         activeEl[i].classList.remove('active');
        //         // nextEl = document.querySelector(`.cell[data-index="${nextIndex - rowCount * colCount}"]`);
        //         nextEl.classList.add('active');
        //     }
        // }

        fallAnimation(f);
    }, 500);
}

function pause() {
    clearInterval(run);
    pauseBtn.onclick = null;
    document.getElementById('gameEndText').textContent = 'PAUSED';
    document.getElementById('newGame').style.display = 'block';
    playBtn.textContent = 'New game';
    resumeBtn.style.display = 'block';
    blurAnimation(document.getElementById('newGame'));
}

function fallAnimation(f) {
    if ( !f.canMove('down') && f.center - max(f.cords, 1) < 0 ) {
        f = null;
        document.body.removeEventListener('keydown', keyPressHandler);
        clearInterval(run);
        endGame();
        return;
    }
    
    
    if ( !f.canMove('down') ) {
        removeClassFromAll('active');
        drawFigure(f, 'floor');
        let filledRows = [];
        for (let i = min(f.cords, 1); i <= max(f.cords, 1); i++) {
            let rowIndex = Math.floor(f.center / colCount) - i;
            if ( rowIndex >= 0 && isFilled(rowIndex) ) {
                filledRows.push(rowIndex);
            }
        }
        clear(filledRows);

        f = null;
        document.body.removeEventListener('keydown', keyPressHandler);
        clearInterval(run);

        f = createFigure();
        run = setInterval(function () {
            fallAnimation(f);
        }, 500);
    }

    f.fall();
    removeClassFromAll(['active', f.name]);
    drawFigure(f, ['active', f.name]);
}

