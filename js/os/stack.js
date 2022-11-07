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
        this.currentStackFrame = this.stackFrames[this.stackFrames.length - 1];
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
        let variable = null;
        if (name[0] === '_' && this.stackFrames.length > 1)
        {
            variable = this.stackFrames.at(-2).variables.find(v => v.Name === name);
        }
        if (name[0] !== '_' || variable === null) {
            variable = this.currentStackFrame.variables.find(v => v.Name === name);
        }
        return variable.Value;
    }
}

class StackFrame {
    constructor () {
        this.variables = [];
        this.result = null;
    }
}