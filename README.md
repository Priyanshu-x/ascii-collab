<div align="center">
  <h1>🎨 ASCII Collab</h1>
  <p><strong>A Real-Time, Multiplayer Terminal Drawing Board</strong></p>
  
  <p>
    <a href="#features">Features</a> •
    <a href="#download--play">Download & Play</a> •
    <a href="#controls">Controls</a> •
    <a href="#deployment">Deployment</a>
  </p>
</div>

---

`ascii-collab` is a real-time, terminal-based multiplayer drawing application. Connect to a central server and use your terminal as a shared grid where you can place colored ASCII characters, chat, and collaborate with others in real-time. It's like r/place, but entirely text-based!

## Features
- 🚀 **Zero Install Client:** Play instantly by downloading the standalone `.exe`! No Node.js required.
- ⚡ **Real-Time Collaboration**: Changes to the canvas sync instantly across all connected clients via WebSockets.
- 💻 **Terminal UI**: A robust terminal interface powered by `blessed` featuring Canvas, Chat, and Tool panels.
- 🛠️ **Smart Drawing Modes**: 
  - **TYPEWRITER**: Cursor automatically advances to the right, behaving like a text editor.
  - **BRUSH**: Traces paths automatically as you move the cursor.
- 🎨 **Rich Color Palette**: Choose from distinct ANSI colors for your brush.
- 💬 **Live Chat**: Send messages to other active users on the server while drawing.
- 💾 **Export / Clear**: Save your masterpiece to `canvas_export.txt` or wipe the board clean for everyone to start fresh.

---

## Download & Play

You do not need to install any code to play! We have packaged the app into a standalone executable that connects directly to the official public server (`ascii-collab.onrender.com`).

1. Go to the **[Releases](../../releases)** tab on GitHub.
2. Download the latest `ascii-collab.exe` file.
3. Double click the file, and your terminal will open directly into the global canvas! 
4. Share the file with friends to draw together!

---

## Controls

### Movement & Drawing
- **Arrow Keys**: Move your cursor around the grid.
- **`1` through `7`**: Change your brush color.
- **Alphanumeric Keys / Symbols**: Type any standard character or symbol to stamp it on the grid.

### Modes & Tools
- **`F1` or `?`**: Toggle the built-in Help Menu overlay!
- **`Tab`**: Cycle through the 2 Smart Drawing Modes (Typewriter, Brush)
- **`Backspace`**: In Typewriter mode, deletes the previous character and steps backward.
- **`Shift + Enter`**: Toggle the Mini-Chat! Type your message and press `Enter` to send it.
- **`Ctrl+S`**: Export the current canvas to a `canvas_export.txt` file in the project directory.
- **`Ctrl+L`**: Clear the canvas for all users.
- **`Ctrl+C`**: Exit the application.

---

## Developer Setup (Host Your Own Server)

If you want to host your own server or modify the codebase, follow these steps:

### Prerequisites
- Node.js (v16 or higher)
- npm

### Installation
```bash
git clone https://github.com/yourusername/ascii-collab.git
cd ascii-collab
npm install
```

### Running Locally
1. **Start the Server**
   ```bash
   npm start
   # or run: node server/index.js
   ```

2. **Run the Client**
   By default, the client is configured to connect to the global render server. To test locally:
   ```bash
   node client/index.js http://localhost:3000
   ```

### Building the Standalone Executable
You can build your own Windows `.exe` using `pkg`:
```bash
npx pkg . --targets node18-win-x64 --out-path ./dist
```
