class Console {
    constructor(os, parser, interpreter) {
        this.os = os;
        this.os.registerOutputAvailable(this.outputAvailable.bind(this));
        this.os.registerReadInput(this.readInput.bind(this));

        this.outputCallback = null;
        this.getSelectionCallback = null;
        this.setInhibitKeysCallback = null;
        this.inputBuffer = "";

        this.parser = parser;
        this.interpreter = interpreter;
        this.currentExecSpace = null;
        this.completed = true;

        this.inputPosition = null;
        this.readingInput = false;

        this.inputMaskCharacter = null;
    }
    async boot() {
        let currentUser = null;
        do {
            currentUser = await this.os.security.login();
        } while (!currentUser);
        this.currentExecSpace = this.os.executionSpace.createExecutionSpace(currentUser);
        this.outputCursor();
    }

    // Output functions
    outputAvailable(event) {
        let output = this.os.readOutput();
        while (output != null) {
            this.output(output);
            output = this.os.readOutput();
        }
    }
    output(text, position) {
        if (this.outputCallback != null) {
            this.outputCallback(text, position);
        }
    }
    registerOutputCallback(callback) {
        this.outputCallback = callback;
    }
    outputCursor() {
        console.debug('Console.outputCursor()');
        this.output("\n>");
        this.inputPosition = this.getSelectionCallback().start;
    }
    
    // Input functions
    isBackspaceValid() {
        let currentPosition = this.getSelectionCallback().start;
        return this.inputBuffer.length > 0 && currentPosition > this.inputPosition;
    }
    handleKey(event) {
        if (!this.completed) {
            event.preventDefault();
            return;
        }
        if (event.inputType === 'insertText') {
            this.appendInputBuffer(event.data);
            if (this.readingInput) {
                if (this.inputMaskCharacter) {
                    this.output(this.inputMaskCharacter);
                } else {
                    this.output(event.data);
                }
            }
        }
        if (event.inputType === 'insertLineBreak') {
            if (this.readingInput) {
                this.readingInput = false;
            }
            else if (this.inputBuffer.endsWith(';') || this.inputBuffer.endsWith('}')) {
                let statements = this.parser.parse(this.inputBuffer);
                this.interpreter.interpret(statements, this.currentExecSpace);
                this.clearInputBuffer();
                this.waitForCompletion();
            }
        }
        if (event.inputType === 'deleteContentBackward') {
            let bufferIndex = this.getSelectionCallback().start - this.inputPosition;
            if (bufferIndex > 0) {
                this.inputBuffer = this.inputBuffer.slice(0, bufferIndex - 1)
                    .concat(this.inputBuffer.slice(bufferIndex + 1))
            }
        }
        console.debug(`handleKey() inputBuffer: ${this.inputBuffer}`)
    }
    readInput(maskCharacter) {
        console.debug(`readinput: maskCharacter = ${maskCharacter}`);
        this.inputPosition = this.getSelectionCallback().start;
        this.inputMaskCharacter = maskCharacter;
        this.setInhibitKeysCallback(true, false);
        this.readingInput = true;
        return new Promise(resolve => {
            waitForInput(this);
            function waitForInput(target) {
                if (target.readingInput) {
                    setTimeout(waitForInput, 0, target);
                }
                else {
                    let buffer = target.inputBuffer;
                    target.clearInputBuffer();
                    target.inputMaskCharacter = null;
                    target.setInhibitKeysCallback(false);
                    resolve(buffer);
                }
            }
        });
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
    registerSetInhibitKeysCallback(callback) {
        this.setInhibitKeysCallback = callback;
    }
}