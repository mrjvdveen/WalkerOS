class Console {
    constructor(os, parser, interpreter) {
        this.OS = os;
        this.OS.registerOutputAvailable(this.outputAvailable.bind(this));

        this.outputCallback = null;
        this.getSelectionCallback = null;
        this.inputBuffer = "";

        this.Parser = parser;
        this.Interpreter = interpreter;
        this.currentExecSpace = null;
        this.completed = true;

        this.cursorPosition = null;
    }
    boot() {
        this.outputCursor();
    }

    // Output functions
    outputAvailable(event) {
        let output = this.OS.readOutput();
        while (output != null) {
            this.output(output);
            output = this.OS.readOutput();
        }
    }
    output(text) {
        if (this.outputCallback != null) {
            this.outputCallback(text);
        }
    }
    registerOutputCallback(callback) {
        this.outputCallback = callback;
    }
    outputCursor() {
        console.debug('Console.outputCursor()');
        this.output("\n>");
        this.cursorPosition = this.getSelectionCallback().start;
    }
    
    // Input functions
    isBackspaceValid() {
        let currentPosition = this.getSelectionCallback().start;
        return this.inputBuffer.length > 0 && currentPosition > this.cursorPosition;
    }
    handleKey(event, selection) {
        if (!this.completed) {
            event.preventDefault();
            return;
        }
        if (event.inputType === 'insertText') {
            this.appendInputBuffer(event.data);
        }
        if (event.inputType === 'insertLineBreak') {
            if (this.inputBuffer.endsWith(';')) {
                let statements = this.Parser.Parse(this.inputBuffer);
                this.currentExecSpace = this.Interpreter.Interpret(statements);
                this.clearInputBuffer();
                this.waitForCompletion();
            }
        }
        if (event.inputType === 'deleteContentBackward') {
            let bufferIndex = this.getSelectionCallback().start - this.cursorPosition;
            if (bufferIndex > 0) {
                this.inputBuffer = this.inputBuffer.slice(0, bufferIndex - 1)
                    .concat(this.inputBuffer.slice(bufferIndex + 1))
            }
        }
        console.debug(`handleKey() inputBuffer: ${this.inputBuffer}`)
    }
    appendInputBuffer(data) {
        this.inputBuffer = this.inputBuffer.concat(data);
    }
    clearInputBuffer() {
        this.inputBuffer = "";
    }
    waitForCompletion() {
        this.completed = this.currentExecSpace.instructions.length == 0;
        if (!this.completed) {
            window.setTimeout(this.waitForCompletion.bind(this), 50);
            return;
        }
        this.outputCursor();
    }

    registerGetSelectionCallback(callback) {
        this.getSelectionCallback = callback;
    }
}