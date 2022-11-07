class Heap {
    constructor() {
        this.functions = [];
    }

    addFunction(name, parameters, instructions) {
        let functionObject = {
            name: name,
            parameters, parameters,
            instructions: instructions
        }
        let currentFunction = this.functions.findIndex(f => f.name === name && f.parameters.length == parameters.length);
        if (currentFunction >= 0) {
            this.functions.splice(currentFunction, 1);
        }
        this.functions.push(functionObject);
    }
    getFunction(name, parameters) {
        let currentFunction = this.functions.findIndex(f => f.name === name && f.parameters.length == parameters.length);
        return this.functions[currentFunction];
    }
}