# Collaborative ASCII Art Canvas (ascii-collab)

`ascii-collab` is a real-time, terminal-based multiplayer drawing board. Connect to a central server and use your terminal as a shared, peer-to-peer grid where you can place colored ASCII characters, chat, and collaborate with others in real-time. It's like r/place, but entirely text-based!

## Features
- **Real-Time Collaboration**: Changes to the canvas sync instantly across all connected clients via WebSockets.
- **Terminal UI**: A robust terminal interface powered by `blessed` with Canvas, Chat, and Status panels.
- **Smart Drawing Modes**: 
  - **PLACEMENT**: Standard drawing, cursor remains still.
  - **TYPEWRITER**: Cursor automatically advances to the right, behaving like a text editor.
  - **BRUSH**: Traces paths automatically as you move the cursor using the current brush character.
- **Rich Color Palette**: Choose from 7 distinct ANSI colors for your brush.
- **Live Chat**: Send messages to other active users on the server while drawing.
- **Export Canvas**: Save your masterpiece as raw text at any point.
- **Clear Canvas**: Wipe the board clean for everyone to start fresh.

## Technology Stack
- **Server**: Node.js, Express, Socket.io
- **Client**: Node.js, Socket.io-client, Blessed (Terminal rendering)

---

## Installation & Setup

1. **Clone the repository and install dependencies**
   ```bash
   npm install
   ```

2. **Start the Server**
   Start the WebSocket server to host the canvas.
   ```bash
   node server/index.js
   ```

3. **Run the Client**
   Open a new terminal window / session and join the canvas.
   ```bash
   node client/index.js
   ```

---

## Controls & Usage

### Movement & Drawing
- **Arrow Keys**: Move your cursor around the grid.
- **`1` through `7`**: Change your brush color.
- **Alphanumeric Keys & Symbols**: Type any standard character or symbol to draw it on the grid!

### Modes & Tools
- **`Tab`**: Cycle through the 3 Smart Drawing Modes (Placement, Typewriter, Brush)
- **`Backspace`**: In Typewriter mode, deletes the previous character and steps backward.
- **`/` (Forward Slash)**: Toggle the Mini-Chat! Type your message and press `Enter` to send it. Press `/` again to exit chat.
- **`Ctrl+S`**: Export the current canvas to a `canvas_export.txt` file in the project directory.
- **`Ctrl+L`**: Clear the canvas for all users.
- **`Ctrl+C`**: Exit the application.

---

## Technical Details

- The canvas state consists of a fixed boundary size (e.g. 100 cols x 50 rows).
- Only valid alphanumeric and symbol characters are allowed on the canvas. Arrow keys and modifier keys are handled appropriately by the frontend before sending a `draw` event back to the server.
- The cursor is rendered by inverting the character cell colors. If a user with a Red brush is hovering over a Blue "A", the rendered cell will momentarily become a Red background with Black text.

## Known Limitations
- Rendering speed is tied intimately to your terminal emulator's performance with ANSI color codes and the `blessed` library's event loop.
- The project currently utilizes a global room structure via Socket.io.
