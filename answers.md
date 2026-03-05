**1. Architecture & Data Flow**
I structured the app using Vanilla JS modules (`main.js`, `editor.js`) with a single HTML layout split into an Editor Pane and a Dashboard Pane. Events flow from the `<textarea>` to centralized handlers that update isolated arrays for state management and DOM lists for logging.

**2. Keyboard Event Core Logic**
I prioritized `keydown` for non-character interactions (shortcuts, tabs) to reliably intercept commands using `e.preventDefault()`. I used the `input` event specifically for tracking continuous content mutations (typing, pasting) and tied it to state saving to avoid overlapping with structural shortcut management.

**3. Performance Optimizations & Trade-Offs**
To prevent lag during rapid typing, I applied a 150ms debounce function to the mocked syntax highlight operation. This trade-off ensures expensive computations only execute after the user pauses typing, sacrificing instantaneous highlighting for zero-latency keystroke recording.

**4. State Management for Undo/Redo**
State is tracked through two independent arrays (`undoStack` and `redoStack`) that push and pop the editor's raw string content. A new interaction clears the `redoStack` to prevent conflicting timelines, simulating a classic history tree.

**5. Accessibility Considerations**
I utilized standard, semantic HTML utilizing a `<textarea>` which is inherently screen-reader friendly and focusable. Additionally, shortcuts like native `Tab` spacing intentionally maintain DOM focus bounds to keep the interface navigable without an external mouse.
