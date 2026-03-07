const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// Shared canvas state
// 50 rows, 100 columns, each cell has { char: ' ', color: 'white' }
const ROWS = 50;
const COLS = 100;
const canvas = Array.from({ length: ROWS }, () =>
  Array.from({ length: COLS }, () => ({ char: ' ', color: 'white' }))
);

// Connected users
const users = {};

io.on('connection', (socket) => {
  // Initialize user
  const randomColor = ['red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white'][Math.floor(Math.random() * 7)];
  users[socket.id] = {
    id: socket.id,
    x: 0,
    y: 0,
    color: randomColor,
    nickname: `User_${socket.id.substring(0, 4)}`
  };

  // Send initial state to the new client
  socket.emit('init', {
    canvas,
    users,
    me: users[socket.id]
  });

  // Broadcast to others that someone joined
  socket.broadcast.emit('user_joined', users[socket.id]);

  socket.on('move', ({ x, y }) => {
    if (x >= 0 && x < COLS && y >= 0 && y < ROWS) {
      users[socket.id].x = x;
      users[socket.id].y = y;
      socket.broadcast.emit('cursor_moved', { id: socket.id, x, y });
    }
  });

  socket.on('draw', ({ x, y, char, color }) => {
    if (x >= 0 && x < COLS && y >= 0 && y < ROWS) {
      canvas[y][x] = { char, color };
      // Broadcast to EVERYONE including the sender
      io.emit('cell_updated', { x, y, char, color });
    }
  });

  socket.on('clear_canvas', () => {
    // Reset canvas array
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        canvas[r][c] = { char: ' ', color: 'white' };
      }
    }
    io.emit('canvas_cleared', canvas);
  });

  socket.on('chat', (message) => {
    io.emit('chat_message', { sender: users[socket.id].nickname, message, color: users[socket.id].color });
  });

  socket.on('disconnect', () => {
    delete users[socket.id];
    io.emit('user_left', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`ascii-collab server running on port ${PORT}`);
});
