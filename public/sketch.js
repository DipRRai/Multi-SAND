const socket = io();

// var string = "This is my compression test.";
// console.log("Size of sample is: " + string.length);
// var compressed = LZString.compress(string);
// console.log("Size of compressed sample is: " + compressed.length);
// string = LZString.decompress(compressed);
// console.log("Sample is: " + string);

socket.on('init', (data) => {
    grid = decomp(data);
    console.log(grid);
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


