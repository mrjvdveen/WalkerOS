class Stack {
    constructor() {
        this.stackFrames = [];
        this.currentStackFrame = null;
    }

    boot() {
        this.AddStackFrame();
    }
    AddStackFrame() {
        let frame = new StackFrame();
        this.stackFrames.push(frame);
        this.currentStackFrame = frame;
    }
    RemoveStackFrame() {
        this.stackFrames.pop();
    }
    EnsureVariable(name) {
        if (this.currentStackFrame.Variables.filter(v => v.Name === name).length == 0) {
            this.currentStackFrame.Variables.push({
                Name: name,
                Value: null
            });
        }
    }
    SetVariable(name, value) {
        this.currentStackFrame.Variables.find(v => v.Name === name).Value = value;
    }
    GetVariableValue(name) {
        if (name[0] === '_')
        {
            return this.stackFrames.at(-2).Variables.find(v => v.Name === name).Value;
        }
        return this.currentStackFrame.Variables.find(v => v.Name === name).Value;
    }
}

class StackFrame {
    constructor () {
        this.Variables = [];
        this.Result = null;
    }
}