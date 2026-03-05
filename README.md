# High-Performance Code Editor

A browser-based code editor built with Vanilla JavaScript and Vite, focusing on complex keyboard event handling, state management, and performance.

## Setup Instructions

### Prerequisites
- Docker
- Docker Compose

### Running the Application

1. Make sure `.env` is created (you can use `.env.example` as a template).
2. Run the following command to start the application:
   ```bash
   docker-compose up --build -d
   ```
3. Open your browser and navigate to `http://localhost:3000`.

### Stopping the Application
```bash
docker-compose down
```

## Features Implemented
- **Custom Event Dashboard**: Real-time logging of keyboard and composition events.
- **Save Shortcut (Ctrl/Cmd + S)**: Prevents default browser save action.
- **Undo/Redo (Ctrl/Cmd + Z, Ctrl/Cmd + Shift + Z)**: Custom state history stack tracking edits.
- **Indent/Outdent (Tab, Shift + Tab)**: In-editor tab control with text selection adjustment.
- **Smart Enter**: Preserves current line's indentation level on new line.
- **Comment Toggle (Ctrl/Cmd + /)**: Toggles `// ` comments on current or selected lines.
- **Chord Shortcut (Ctrl/Cmd + K -> Ctrl/Cmd + C)**: Two-step keyed combination trigger.
- **Performance Optimized**: Debounced mock syntax-highlighting function.
- **Cross-Platform**: Handles `Cmd` for MacOS and `Ctrl` for Windows/Linux smoothly.
