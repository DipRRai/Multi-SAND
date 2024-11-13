const express = require("express");
const path = require('path');
const app = express();
const LZString = require('lz-string');
const PORT = 3000;
const server = app.listen(PORT, () => console.log('server started'));
const io = require("socket.io")(server);

app.use(express.static(path.join(__dirname, 'public')));

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

function compareArr(md1,md2){

}

io.on('connection', (socket) => {
    console.log(socket.id);
    io.emit('init', LZString.compress(canvasArr.flat().toString()));

    socket.on('getCanvas', () => {
      io.emit('init', LZString.compress(canvasArr.flat().toString()));
    });

    let intervalId = null;

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
            }, 33); // 30 frames per second
        }
    });
  
});
