class Scheduler {
    constructor(executionSpace) {
        this.executionSpace = executionSpace;
        this.currentExecutionSpaceIndex = 0;
    }

    boot() {
        window.setInterval(this.runInstruction.bind(this), 50);
    }
    runInstruction() {
        console.debug('Scheduler.runInstruction()');
        if (this.currentExecutionSpaceIndex >= this.executionSpace.GetExecutionSpaceCount()) {
            this.currentExecutionSpaceIndex = 0;
        }
        if (this.executionSpace.GetExecutionSpaceCount() == 0) {
            return;
        }
        let currentSpace = this.executionSpace.GetExecutionSpace(this.currentExecutionSpaceIndex);
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
    }
    destroyExecutionSpace(currentSpace) {
        this.executionSpace.RemoveExecutionSpace(currentSpace);
    }
}