const express = require("express");
const path = require('path');
const app = express();
const LZString = require('lz-string');
const PORT = 3000;
const server = app.listen(PORT, () => console.log('server started'));
const io = require("socket.io")(server);

app.use(express.static(path.join(__dirname, 'docs')));

const ROWS = 40;
const COLS = 40;
var canvasArr = Array.from({ length: ROWS }, () => new Array(COLS).fill(0));
let flatGrid = canvasArr.flat();

function simulate(canvasArr) {
  let nextGrid = Array.from({ length: ROWS }, () => new Array(COLS).fill(0));
  for (let i = 0; i < COLS; i++) {
    for (let j = 0; j < ROWS; j++) {
        let state = canvasArr[i][j];
        if (state === 1) {
            let below = (j < ROWS - 1) ? canvasArr[i][j + 1] : 1; // Make sure not to go out of bounds
            let belowR = (i < COLS - 1 && j < ROWS - 1) ? canvasArr[i + 1][j + 1] : 1; // Check boundaries
            let belowL = (i > 0 && j < ROWS - 1) ? canvasArr[i - 1][j + 1] : 1; // Check boundaries
            if (below === 0) {
                nextGrid[i][j + 1] = 1;
                nextGrid[i][j] = 0;
            } else {
                if (belowR === 0) {
                    nextGrid[i][j] = 0;
                    nextGrid[i + 1][j + 1] = 1;
                } else if (belowL === 0) {
                    nextGrid[i][j] = 0;
                    nextGrid[i - 1][j + 1] = 1;
                } else {
                    nextGrid[i][j] = 1;
                }
            }
        }
    }
  }
  return nextGrid;
}

function randFlipZero(grid) {
  let ones = [];
  for (let i = 0; i < grid.length; i++) { // Use < instead of <=
    for (let j = 0; j < grid[i].length; j++) { // Use < instead of <=
      if (grid[i][j] === 1) {
        ones.push([i, j]);
      }
    }
  }

  if (ones.length === 0) return false;
  const [x, y] = ones[Math.floor(Math.random() * ones.length)];
  grid[x][y] = 0;
  return true;
}

io.on('connection', (socket) => {
    console.log(socket.id);
    io.emit('init', LZString.compress(canvasArr.flat().toString()));

    socket.on('getCanvas', () => {
      io.emit('init', LZString.compress(canvasArr.flat().toString()));
    });

    let intervalId = null;

    setInterval(() => {
    const removed = randFlipZero(canvasArr);
    io.emit('RAINBOW', removed);
    if (removed) {
      if (!intervalId) {
        intervalId = setInterval(() => {
            const temp = simulate(canvasArr);
            if (JSON.stringify(canvasArr) === JSON.stringify(temp)) {
                clearInterval(intervalId);
                intervalId = null; // Reset intervalId to allow future updates
            } else {
                canvasArr = temp;
                io.emit('init', LZString.compress(canvasArr.flat().toString()));
            }
        }, 40);
    }
        io.emit('init', LZString.compress(canvasArr.flat().toString())); // Update clients if a 1 was removed
    }
    }, 100);


    

    socket.on('add', ({ col, row }) => {
        canvasArr[col][row] = 1;
        io.emit('init', LZString.compress(canvasArr.flat().toString()));
    
        if (!intervalId) {
            intervalId = setInterval(() => {
                const temp = simulate(canvasArr);
                if (JSON.stringify(canvasArr) === JSON.stringify(temp)) {
                    clearInterval(intervalId);
                    intervalId = null; // Reset intervalId to allow future updates
                } else {
                    canvasArr = temp;
                    io.emit('init', LZString.compress(canvasArr.flat().toString()));
                }
            }, 33);
        }
    });
  
});
