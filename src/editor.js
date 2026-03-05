export function setupEditor() {
    const editor = document.getElementById('editor');
    const logContainer = document.getElementById('event-log-container');

    let undoStack = [];
    let redoStack = [];
    let isComposing = false;
    let chordPending = false;
    let chordTimeout = null;

    // Mock heavy function for debouncing
    window.highlightCallCount = 0; // Expose directly on window for test overriding fallback
    window.getHighlightCallCount = () => window.highlightCallCount;

    const mockHighlight = debounce(() => {
        window.highlightCallCount++;
        // In a real editor, this is where syntax highlighting would happen
    }, 150);

    // Initialize state
    const saveState = (content) => {
        if (undoStack.length === 0 || undoStack[undoStack.length - 1] !== content) {
            undoStack.push(content);
            redoStack = []; // Clear redo stack on new action
        }
    };

    saveState(editor.value); // Initial state

    // Required exposed API
    window.getEditorState = () => ({
        content: editor.value,
        historySize: undoStack.length
    });

    const updateEditor = (content) => {
        editor.value = content;
        saveState(content);
        mockHighlight();
    };

    const logEvent = (type, key, code, modifierStatus = '') => {
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        entry.setAttribute('data-test-id', 'event-log-entry');
        entry.textContent = `Event: ${type} | Key: ${key} | Code: ${code} ${modifierStatus}`;
        logContainer.appendChild(entry);
        logContainer.scrollTop = logContainer.scrollHeight;
    };

    const getModifiers = (e) => {
        const mods = [];
        if (e.ctrlKey) mods.push('Ctrl');
        if (e.metaKey) mods.push('Cmd');
        if (e.shiftKey) mods.push('Shift');
        if (e.altKey) mods.push('Alt');
        return mods.length ? `[${mods.join('+')}]` : '';
    };

    // --- External Input Handling ---

    editor.addEventListener('input', (e) => {
        if (!isComposing) {
            saveState(editor.value);
            mockHighlight();
        }
        logEvent('input', e.data || 'N/A', 'N/A');
    });

    editor.addEventListener('compositionstart', (e) => {
        isComposing = true;
        logEvent('compositionstart', e.data || 'N/A', 'N/A');
    });

    editor.addEventListener('compositionupdate', (e) => {
        logEvent('compositionupdate', e.data || 'N/A', 'N/A');
    });

    editor.addEventListener('compositionend', (e) => {
        isComposing = false;
        saveState(editor.value);
        mockHighlight();
        logEvent('compositionend', e.data || 'N/A', 'N/A');
    });

    editor.addEventListener('keyup', (e) => {
        logEvent('keyup', e.key, e.code, getModifiers(e));
    });

    // --- Shortcut & Core Key Handling ---

    editor.addEventListener('keydown', (e) => {
        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        const isModifier = isMac ? e.metaKey : e.ctrlKey;
        const isShift = e.shiftKey;

        logEvent('keydown', e.key, e.code, getModifiers(e));

        // Chord tracking (Ctrl+K -> Ctrl+C)
        // console.log("KEYDOWN:", e.key, "PENDING:", chordPending); // For native test debugging if needed
        if (chordPending) {
            if (isModifier && e.key.toLowerCase() === 'c') {
                e.preventDefault();
                logEvent('Action', 'Chord Success', 'N/A');
                clearTimeout(chordTimeout);
                chordPending = false;
                return;
            } else if (!['Control', 'Meta', 'Shift', 'Alt', 'k'].includes(e.key)) {
                // Cancel chord if any other NON-MODIFIER key is pressed
                clearTimeout(chordTimeout);
                chordPending = false;
            }
        }

        if (isModifier && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            chordPending = true;
            chordTimeout = setTimeout(() => {
                chordPending = false;
            }, 2000);
            return;
        }

        // Save (Ctrl+S / Cmd+S)
        if (isModifier && e.key.toLowerCase() === 's') {
            e.preventDefault();
            logEvent('Action', 'Save', 'N/A');
            return;
        }

        // Undo (Ctrl+Z / Cmd+Z)
        if (isModifier && !isShift && e.key.toLowerCase() === 'z') {
            e.preventDefault();
            if (undoStack.length > 1) { // Leave the very first empty state
                redoStack.push(undoStack.pop());
                editor.value = undoStack[undoStack.length - 1];
                mockHighlight();
            }
            return;
        }

        // Redo (Ctrl+Shift+Z / Cmd+Shift+Z)
        if (isModifier && isShift && e.key.toLowerCase() === 'z') {
            e.preventDefault();
            if (redoStack.length > 0) {
                const state = redoStack.pop();
                undoStack.push(state);
                editor.value = state;
                mockHighlight();
            }
            return;
        }

        // Comment Toggle (Ctrl+/ / Cmd+/)
        if (isModifier && e.key === '/') {
            e.preventDefault();
            const start = editor.selectionStart;
            const end = editor.selectionEnd;
            const value = editor.value;

            // Find the start and end of the lines containing the selection
            const lineStart = value.lastIndexOf('\n', start - 1) + 1;
            let lineEnd = value.indexOf('\n', end);
            if (lineEnd === -1) lineEnd = value.length;

            const linesStr = value.substring(lineStart, lineEnd);
            const lines = linesStr.split('\n');

            // Determine if we should comment or uncomment
            // If all selected lines are commented, we uncomment. Else we comment.
            const allCommented = lines.every(line => line.trim() === '' || line.startsWith('// '));

            let newContent = '';
            if (allCommented) {
                newContent = lines.map(line => line.startsWith('// ') ? line.substring(3) : line).join('\n');
            } else {
                newContent = lines.map(line => `// ${line}`).join('\n');
            }

            const newValue = value.substring(0, lineStart) + newContent + value.substring(lineEnd);
            updateEditor(newValue);

            // Restore selection roughly
            editor.selectionStart = lineStart;
            editor.selectionEnd = lineStart + newContent.length;

            return;
        }

        // Tab / Shift+Tab (Indent / Outdent)
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = editor.selectionStart;
            const end = editor.selectionEnd;
            const value = editor.value;

            // For simple single line/cursor tab (as per basic requirement)
            const lineStart = value.lastIndexOf('\n', start - 1) + 1;
            let lineEnd = value.indexOf('\n', end);
            if (lineEnd === -1) lineEnd = value.length;

            const linesStr = value.substring(lineStart, lineEnd);
            const lines = linesStr.split('\n');

            if (!isShift) {
                // Indent
                const newContent = lines.map(line => `  ${line}`).join('\n');
                updateEditor(value.substring(0, lineStart) + newContent + value.substring(lineEnd));
                editor.selectionStart = start + 2;
                editor.selectionEnd = end + (newContent.length - linesStr.length);
            } else {
                // Outdent
                const newContent = lines.map(line => line.startsWith('  ') ? line.substring(2) : line.startsWith(' ') ? line.substring(1) : line).join('\n');
                updateEditor(value.substring(0, lineStart) + newContent + value.substring(lineEnd));
                // Adjust cursor position
                const diff = linesStr.length - newContent.length;
                editor.selectionStart = Math.max(lineStart, start - diff);
                editor.selectionEnd = Math.max(lineStart, end - diff);
            }
            return;
        }

        // Enter (Preserve Indentation)
        if (e.key === 'Enter') {
            e.preventDefault();
            const start = editor.selectionStart;
            const value = editor.value;
            const lineStart = value.lastIndexOf('\n', start - 1) + 1;
            const currentLine = value.substring(lineStart, start);

            const match = currentLine.match(/^(\s+)/);
            const indentation = match ? match[1] : '';

            const newText = '\n' + indentation;
            updateEditor(value.substring(0, start) + newText + value.substring(editor.selectionEnd));

            editor.selectionStart = editor.selectionEnd = start + newText.length;
            return;
        }

    });
}

// Utility: Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
