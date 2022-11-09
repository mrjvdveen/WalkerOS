const output_available = 'output_available';

class OS {
    constructor() {
        this.outputBuffer = [];
        this.outputAvailableEvent = new EventTarget();
        this.readInputCallback = null;
        this.executionSpace = new ExecutionSpace();
        this.scheduler = new Scheduler(this.executionSpace);
        this.api = new Api(this);
        let errorHandler = new ErrorHandler(this, "Storage")
        this.storage = new Storage(errorHandler);
        this.security = new Security(this);
        this.onbooted = null;
    }

    boot() {
        this.writeOutput("Booting Walker OS 1.0\n");
        this.executionSpace.boot();
        this.scheduler.boot();
        this.storage.onbooted = () => {
            this.completeBoot();
        }
        this.storage.boot();
    }
    async completeBoot() {
        await this.security.boot();
        if (this.onbooted)  {
            this.onbooted();
        }
    }
    
    // Output functions
    writeOutput(output) {
        this.outputBuffer.push(output);
        this.outputAvailableEvent.dispatchEvent(new Event(output_available));
    }
    readOutput() {
        if (this.outputBuffer.length > 0) {
            return this.outputBuffer.pop();
        }
        return null;
    }
    async readInput(maskCharacter) {
        let input = await this.readInputCallback(maskCharacter);
        return input;
    }
    registerOutputAvailable(callback) {
        this.outputAvailableEvent.addEventListener(output_available, callback, {
            capture: true,
            once: false,
            passive: true,
        });
    }
    registerReadInput(callback) {
        this.readInputCallback = callback;
    }
    executeApiCall(executionSpace, name) {
        let apiCall = this.api.getCall(name);
        let parameters = [];
        for (var index = 0; index < apiCall.parameters.length; index++) {
            parameters.push(executionSpace.stack.getVariableValue(`_${name}_${index}`));
        }
        apiCall.execute(executionSpace, parameters);
    }
    async wait(time) {
        return new Promise((resolve) => {
            setTimeout((resolve) => {
                resolve();
            }, time);
        });
    }
}