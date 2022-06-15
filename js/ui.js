class UI {
    constructor(consoleObject) {
        this.console = consoleObject;
        this.console.registerOutputCallback(this.outputCallback.bind(this));
        this.console.registerGetSelectionCallback(this.getSelectionCallback.bind(this));
        this.consoleArea = null;
    }
    boot() {
        let root = document.createElement('div');
        root.className = 'root';
        let consoleArea = document.createElement('textarea');
        consoleArea.className = 'console';
        this.consoleArea = consoleArea;
        document.body.appendChild(root);
        root.appendChild(consoleArea);
        consoleArea.addEventListener('beforeinput', this.handleInputEvent.bind(this));
    }
    outputCallback(output) {
        if (this.consoleArea != null) {
            this.consoleArea.value += output;
        }
    }
    getSelectionCallback() {
        return {
            start: this.consoleArea.selectionStart,
            end: this.consoleArea.selectionEnd
        };
    }
    handleInputEvent(event) {
        console.log(event);
        // handle backspace
        if (event.inputType === 'deleteContentBackward' && !this.console.isBackspaceValid()) {
            event.cancelBubble = true;
            event.preventDefault();
        } else {
            this.console.handleKey(event);
        }
    }
}