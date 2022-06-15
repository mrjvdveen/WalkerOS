const output_available = 'output_available';

class OS {
    constructor() {
        this.OutputBuffer = [];
        this.OutputAvailableEvent = new EventTarget();
        this.ExecutionSpace = new ExecutionSpace();
        this.scheduler = new Scheduler(this.ExecutionSpace);
        this.api = new Api(this);
    }

    boot() {
        this.writeOutput("Booting Walker OS 1.0\n");
        this.ExecutionSpace.boot();
        this.scheduler.boot();
    }
    
    // Output functions
    writeOutput(output) {
        this.OutputBuffer.push(output);
        this.OutputAvailableEvent.dispatchEvent(new Event(output_available));
    }
    readOutput() {
        if (this.OutputBuffer.length > 0) {
            return this.OutputBuffer.pop();
        }
        return null;
    }
    registerOutputAvailable(callback) {
        this.OutputAvailableEvent.addEventListener(output_available, callback, {
            capture: true,
            once: false,
            passive: true,
        });
    }
    executeApiCall(executionSpace, name) {
        let apiCall = this.api.GetCall(name);
        let parameters = [];
        for (var index = 0; index < apiCall.parameters.length; index++) {
            parameters.push(executionSpace.Stack.GetVariableValue(`_${name}_${index}`));
        }
        apiCall.execute(parameters);
    }
}