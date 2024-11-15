const socket = io();
const backboard = document.getElementById('backboard');
const cat_gifs = document.getElementsByClassName('cat_spinner');
const display = document.getElementById('display')
console.log(display);
var audio = new Audio('audioremix.mp3');


socket.on('init', (data) => {
    grid = decomp(data);
    //console.log(grid);
});
let rainbowInterval = null; // Initialize interval as null to track active status

let timer = null;
let startTime = 0;
let elapsedTime = 0;
let isRunning = false;

function start(){
    if (!isRunning) {
        startTime = Date.now() - elapsedTime;
        timer = setInterval(update, 10);
        isRunning = true;
    }
}

function update(){
    const currentTime = Date.now();
    elapsedTime = currentTime - startTime;
    let hours = Math.floor(elapsedTime / (1000 * 60 * 60 ))
    let minutes = Math.floor(elapsedTime / (1000 * 60) % 60)
    let seconds = Math.floor(elapsedTime / (1000) % 60)
    let milliseconds = Math.floor( elapsedTime % 1000 / 10 );

    hours = String(hours).padStart(2, "0");
    minutes = String(minutes).padStart(2, "0");
    seconds = String(seconds).padStart(2, "0");
    milliseconds = String(milliseconds).padStart(2, "0");

    display.textContent = `${hours}:${minutes}:${seconds}:${milliseconds}`
}

function stop(){
    if (isRunning){
        clearInterval(timer);
        elapsedTime = Date.now() - startTime;
        isRunning = false;
    }
}

function reset() {
    clearInterval(timer);
    startTime = 0;
    elapsedTime = 0;
    isRunning = false;
    display.textContent = "00:00:00:00"; 
}

socket.on('RAINBOW', (data) => {
    if (data === true) {
        if (audio.paused) {
            audio.play().catch((error) => {
                console.error('Audio play failed:', error);
            });
        }
        for (let gif of cat_gifs) {
            const currentSrc = gif.src.split('/').pop();
            if (currentSrc  !== 'spincat.gif'){
                if (display.textContent == "00:00:00:00") {
                    start();
                } else {
                    reset();
                    start();
                }
                gif.src = 'spincat.gif';
            }
        }
        if (!rainbowInterval) { // Only start a new interval if none exists
            let hue = 0;
            rainbowInterval = setInterval(() => {
                backboard.style.backgroundColor = `hsl(${hue}, 100%, 50%)`;
                hue = (hue + 5) % 360;
            }, 100); // Change color every 100ms
        }
    } else {
        audio.pause();
        audio.currentTime = 0;
        for (let gif of cat_gifs) {
            const currentSrc = gif.src.split('/').pop();
            if (currentSrc !== 'sadcat.png'){
                stop();
                gif.src = 'sadcat.png';
            }
        }
        clearInterval(rainbowInterval); // Stop the rainbow effect
        rainbowInterval = null; // Reset interval tracker
        backboard.style.backgroundColor = 'black';
    }
});


function decomp(data){
    temp = LZString.decompress(data);
    temp = temp.split(",");
    temp2 = [];
    for (var i = 0; i < temp.length; i += 40) {
        temp2.push(temp.slice(i, i + 40));
    }
    return temp2
}

function setup() {
    let canvas = createCanvas(400, 400);
    canvas.parent("canvas");
    w = 10;
    cols = width / w;
    rows = height / w;
    grid = make2DArray(cols, rows);
    socket.emit('getCanvas');
}

function mouseDragged() {
    let col = floor(mouseX / w);
    let row = floor(mouseY / w);
    if (col >= 0 && col < cols && row >= 0 && row < rows && grid[col][row] == 0) {
        grid[col][row] = 1;
        socket.emit('add', { col, row }); // Fixed emit to send an object
    }
}

function draw() {
    background(0);
    for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
            stroke(255);
            fill(grid[i][j] * 255);
            let x = i * w;
            let y = j * w;
            square(x, y, w);
        }
    }
}

function make2DArray(cols, rows) {
    let arr = new Array(cols);
    for (let i = 0; i < arr.length; i++) {
        arr[i] = new Array(rows).fill(0);
    }
    return arr;
}


