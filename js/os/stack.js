class Stack {
    constructor() {
        this.stackFrames = [];
        this.currentStackFrame = null;
    }

    boot() {
        this.addStackFrame();
    }
    addStackFrame() {
        let frame = new StackFrame();
        this.stackFrames.push(frame);
        this.currentStackFrame = frame;
    }
    removeStackFrame() {
        this.stackFrames.pop();
    }
    ensureVariable(name) {
        if (this.currentStackFrame.variables.filter(v => v.Name === name).length == 0) {
            this.currentStackFrame.variables.push({
                Name: name,
                Value: null
            });
        }
    }
    setVariable(name, value) {
        this.currentStackFrame.variables.find(v => v.Name === name).Value = value;
    }
    getVariableValue(name) {
        if (name[0] === '_')
        {
            return this.stackFrames.at(-2).variables.find(v => v.Name === name).Value;
        }
        return this.currentStackFrame.variables.find(v => v.Name === name).Value;
    }
}

class StackFrame {
    constructor () {
        this.variables = [];
        this.result = null;
    }
}