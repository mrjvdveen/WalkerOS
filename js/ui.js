class UI {
    constructor(consoleObject) {
        this.console = consoleObject;
        this.console.registerOutputCallback(this.outputCallback.bind(this));
        this.console.registerGetSelectionCallback(this.getSelectionCallback.bind(this));
        this.console.registerSetInhibitKeysCallback(this.setInhibitKeys.bind(this));
        this.consoleArea = null;
        this.inhibitKeys = false;
        this.inhibitBackspace = false;
    }
    boot() {
        let root = document.createElement('div');
        root.className = 'root';
        let consoleArea = document.createElement('textarea');
        consoleArea.className = 'console';
        consoleArea.spellcheck = false;
        this.consoleArea = consoleArea;
        document.body.appendChild(root);
        root.appendChild(consoleArea);
        consoleArea.addEventListener('beforeinput', this.handleInputEvent.bind(this));
    }
    outputCallback(output, position) {
        if (this.consoleArea != null) {
            this.consoleArea.value += output;
        }
        if (position) {
            console.debug(`outputCallback: output = '${output}' position = ${position}`);
            this.consoleArea.setSelectionRange(position, position + output.length, "forward");
            this.consoleArea.setRangeText(output);
        }
    }
    getSelectionCallback() {
        return {
            start: this.consoleArea.selectionStart,
            end: this.consoleArea.selectionEnd
        };
    }
    setInhibitKeys(inhibitKeys, inhibitBackspace) {
        this.inhibitKeys = inhibitKeys;
        this.inhibitBackspace = inhibitBackspace;
    }
    handleInputEvent(event) {
        console.log(event);
        // handle backspace
        if (event.inputType === 'deleteContentBackward' && !this.console.isBackspaceValid()) {
            event.cancelBubble = true;
            event.preventDefault();
        } else {
            this.console.handleKey(event);
            if ((this.inhibitKeys && event.inputType !== 'deleteContentBackward')
                || (this.inhibitBackspace && event.inputType === 'deleteContentBackward')) {
                event.cancelBubble = true;
                event.preventDefault();
            }
        }
    }
}