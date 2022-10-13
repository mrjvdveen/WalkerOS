class Scheduler {
    constructor(executionSpace) {
        this.executionSpace = executionSpace;
        this.currentExecutionSpaceIndex = 0;
    }

    boot() {
        window.setTimeout(this.runInstruction.bind(this), 0);
    }
    runInstruction() {
        console.debug('Scheduler.runInstruction()');
        if (this.currentExecutionSpaceIndex >= this.executionSpace.getExecutionSpaceCount()) {
            this.currentExecutionSpaceIndex = 0;
        }
        if (this.executionSpace.getExecutionSpaceCount() == 0) {
            window.setTimeout(this.runInstruction.bind(this), 0);
            return;
        }
        let currentSpace = this.executionSpace.getExecutionSpace(this.currentExecutionSpaceIndex);
        if (!currentSpace.locked) {
            if (currentSpace.instructions.length == 0) {
                this.destroyExecutionSpace(currentSpace);
            }
            else {
                let currentInstruction = currentSpace.instructions.shift(0, 1);
                currentInstruction.execute(currentSpace);
            }
        }
        this.currentExecutionSpaceIndex++;
        window.setTimeout(this.runInstruction.bind(this), 0);
    }
    destroyExecutionSpace(currentSpace) {
        this.executionSpace.removeExecutionSpace(currentSpace);
    }
}