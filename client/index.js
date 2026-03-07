const io = require('socket.io-client');
const blessed = require('blessed');
const fs = require('fs');

const SERVER_URL = process.argv[2] || 'http://localhost:3000';
const socket = io(SERVER_URL);

// --- Blessed Setup ---
const screen = blessed.screen({
    smartCSR: true,
    title: 'ASCII Collab'
});

// Canvas Area
const canvasBox = blessed.box({
    top: 0,
    left: 0,
    width: '70%',
    height: '100%',
    border: { type: 'line' },
    style: {
        border: { fg: 'blue' }
    },
    label: ' Canvas (Use Arrow Keys & Type, [1-7] for Colors)'
});

// Chat Area
const chatBox = blessed.box({
    top: 0,
    left: '70%',
    width: '30%',
    height: '70%',
    border: { type: 'line' },
    style: {
        border: { fg: 'magenta' }
    },
    label: ' Chat '
});

const chatText = blessed.log({
    parent: chatBox,
    top: 0,
    left: 0,
    width: '100%-2',
    height: '100%-2',
    scrollable: true,
    alwaysScroll: true,
    tags: true
});

// Status Area
const statusBox = blessed.box({
    top: '70%',
    left: '70%',
    width: '30%',
    height: '30%',
    border: { type: 'line' },
    style: {
        border: { fg: 'green' }
    },
    label: ' Status '
});

const statusText = blessed.text({
    parent: statusBox,
    top: 0,
    left: 0,
    content: 'Connecting...'
});

screen.append(canvasBox);
screen.append(chatBox);
screen.append(statusBox);

let myUser = null;
let canvasState = [];
let allUsers = {};
const ROWS = 50;
const COLS = 100;
let currentColor = 'white';
const colors = ['red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white'];

// Input Handling
let chatMode = false;
let chatBuffer = '';

// Drawing Modes
const DRAWING_MODES = ['PLACEMENT', 'TYPEWRITER', 'BRUSH'];
let currentDrawingModeIndex = 0; // Starts at PLACEMENT
let activeBrushChar = '█'; // Default brush character if none typed yet

function getStatusContent() {
    let modeText = chatMode ? `Mode: CHAT\nTyping: ${chatBuffer}` : `Mode: ${DRAWING_MODES[currentDrawingModeIndex]}\nColor: ${currentColor}\nMe: ${myUser ? myUser.nickname : '...'}`;
    return modeText;
}

screen.key(['escape', 'C-c'], () => {
    return process.exit(0);
});

screen.key(['C-s'], () => {
    let exportText = '';
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (canvasState && canvasState[r] && canvasState[r][c]) {
                exportText += canvasState[r][c].char;
            } else {
                exportText += ' ';
            }
        }
        exportText += '\n';
    }
    fs.writeFileSync('canvas_export.txt', exportText, 'utf8');
    chatText.log(`{yellow-fg}[SYSTEM] Canvas exported to canvas_export.txt!{/yellow-fg}`);
    screen.render();
});

screen.key(['C-l'], () => {
    socket.emit('clear_canvas');
});

screen.on('keypress', (ch, key) => {
    if (chatMode) {
        if (ch === '/') {
            chatMode = false;
            chatBuffer = '';
            statusText.setContent(getStatusContent());
            screen.render();
            return;
        } else if (key.name === 'enter') {
            if (chatBuffer.trim().length > 0) {
                socket.emit('chat', chatBuffer);
            }
            chatBuffer = '';
            statusText.setContent(getStatusContent());
            screen.render();
            return;
        } else if (key.name === 'backspace') {
            chatBuffer = chatBuffer.slice(0, -1);
        } else if (ch) {
            chatBuffer += ch;
        }
        statusText.setContent(getStatusContent());
        screen.render();
        return;
    }

    // Go to Chat Mode
    if (ch === '/') {
        chatMode = true;
        statusText.setContent(getStatusContent());
        screen.render();
        return;
    }

    // Cycle Drawing Modes
    if (key.name === 'tab') {
        currentDrawingModeIndex = (currentDrawingModeIndex + 1) % DRAWING_MODES.length;
        statusText.setContent(getStatusContent());
        screen.render();
        return;
    }

    // Color picking
    if (ch >= '1' && ch <= '7') {
        currentColor = colors[parseInt(ch) - 1];
        statusText.setContent(getStatusContent());
        screen.render();
        return;
    }

    // Movement Helper to handle BRUSH mode trailing
    function moveCursor(dx, dy) {
        if (!myUser) return;
        let newX = myUser.x + dx;
        let newY = myUser.y + dy;

        // Bounds check
        if (newX >= 0 && newX < COLS && newY >= 0 && newY < ROWS) {
            myUser.x = newX;
            myUser.y = newY;
            socket.emit('move', { x: myUser.x, y: myUser.y });

            if (DRAWING_MODES[currentDrawingModeIndex] === 'BRUSH') {
                socket.emit('draw', { x: myUser.x, y: myUser.y, char: activeBrushChar, color: currentColor });
                if (canvasState[myUser.y] && canvasState[myUser.y][myUser.x]) {
                    canvasState[myUser.y][myUser.x] = { char: activeBrushChar, color: currentColor };
                }
            }
        }
    }

    // Movement Inputs
    if (key.name === 'up') {
        moveCursor(0, -1);
    } else if (key.name === 'down') {
        moveCursor(0, 1);
    } else if (key.name === 'left') {
        moveCursor(-1, 0);
    } else if (key.name === 'right') {
        moveCursor(1, 0);
    } else if (ch && ch.length === 1 && ch.match(/[a-zA-Z0-9.,?!@#$%^&*()_+\-=\[\]{}|\\;:'"<>\/`~ ]/)) {
        // Draw character
        if (myUser) {
            // Automatically capture the last typed char as the active brush
            activeBrushChar = ch;

            socket.emit('draw', { x: myUser.x, y: myUser.y, char: ch, color: currentColor });
            // Minor optimistic update
            if (canvasState[myUser.y] && canvasState[myUser.y][myUser.x]) {
                canvasState[myUser.y][myUser.x] = { char: ch, color: currentColor };
            }

            // Handle TYPEWRITER mode auto-advance
            if (DRAWING_MODES[currentDrawingModeIndex] === 'TYPEWRITER') {
                let nextX = myUser.x + 1;
                let nextY = myUser.y;
                if (nextX >= COLS) {
                    nextX = 0;
                    nextY++;
                }
                if (nextY < ROWS) {
                    myUser.x = nextX;
                    myUser.y = nextY;
                    socket.emit('move', { x: myUser.x, y: myUser.y });
                }
            }
        }
    } else if (DRAWING_MODES[currentDrawingModeIndex] === 'TYPEWRITER' && key.name === 'backspace') {
        if (myUser) {
            let prevX = myUser.x - 1;
            let prevY = myUser.y;
            if (prevX < 0 && prevY > 0) {
                prevX = COLS - 1;
                prevY--;
            }
            if (prevX >= 0) {
                myUser.x = prevX;
                myUser.y = prevY;
                // Clear the character where we are moving backwards to
                socket.emit('draw', { x: myUser.x, y: myUser.y, char: ' ', color: 'white' });
                if (canvasState[myUser.y] && canvasState[myUser.y][myUser.x]) {
                    canvasState[myUser.y][myUser.x] = { char: ' ', color: 'white' };
                }
                socket.emit('move', { x: myUser.x, y: myUser.y });
            }
        }
    }
    renderCanvas();
});

// Render the grid
function renderCanvas() {
    if (!myUser) return;
    let content = '';

    // Make sure to set tags true for canvasBox too so colors render
    canvasBox.parseTags = true;

    const displayRows = canvasBox.height - 2;
    const displayCols = canvasBox.width - 2;

    for (let r = 0; r < Math.min(ROWS, displayRows); r++) {
        for (let c = 0; c < Math.min(COLS, displayCols); c++) {
            let charToDraw = canvasState[r][c].char;
            let cellColor = canvasState[r][c].color;
            let isCursorHere = false;
            let cursorColor = '';

            // Check if any user (including me) is at this position
            for (const id in allUsers) {
                const u = allUsers[id];
                if (u.x === c && u.y === r) {
                    isCursorHere = true;
                    cursorColor = u.color;
                    break; // just show one cursor if overlapping
                }
            }

            if (isCursorHere) {
                // Invert colors for the cursor: Background is cursorColor, text is black 
                content += `{${cursorColor}-bg}{black-fg}${charToDraw}{/black-fg}{/${cursorColor}-bg}`;
            } else {
                content += `{${cellColor}-fg}${charToDraw}{/${cellColor}-fg}`;
            }
        }
        if (r < Math.min(ROWS, displayRows) - 1) content += '\n';
    }

    canvasBox.setContent(content);
    screen.render();
}

// --- Socket Events ---
socket.on('connect', () => {
    statusText.setContent('Connected! Getting state...');
    screen.render();
});

socket.on('init', (data) => {
    canvasState = data.canvas;
    allUsers = data.users;
    myUser = data.me;
    currentColor = myUser.color;
    statusText.setContent(getStatusContent());
    renderCanvas();
});

socket.on('user_joined', (user) => {
    allUsers[user.id] = user;
    chatText.log(`{green-fg}* ${user.nickname} joined{/green-fg}`);
    renderCanvas();
});

socket.on('user_left', (id) => {
    if (allUsers[id]) {
        chatText.log(`{red-fg}* ${allUsers[id].nickname} left{/red-fg}`);
        delete allUsers[id];
    }
    renderCanvas();
});

socket.on('cursor_moved', ({ id, x, y }) => {
    if (allUsers[id]) {
        allUsers[id].x = x;
        allUsers[id].y = y;
    }
    renderCanvas();
});

socket.on('cell_updated', ({ x, y, char, color }) => {
    if (canvasState[y] && canvasState[y][x]) {
        canvasState[y][x] = { char, color };
    }
    renderCanvas();
});

socket.on('canvas_cleared', (emptyCanvas) => {
    canvasState = emptyCanvas;
    chatText.log(`{yellow-fg}[SYSTEM] Canvas was cleared!{/yellow-fg}`);
    renderCanvas();
});

socket.on('chat_message', ({ sender, message, color }) => {
    chatText.log(`{${color}-fg}${sender}{/${color}-fg}: ${message}`);
    screen.render();
});

socket.on('disconnect', () => {
    statusText.setContent('Disconnected from server.');
    screen.render();
});
