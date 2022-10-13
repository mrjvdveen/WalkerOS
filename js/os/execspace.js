class ExecutionSpace {
    constructor() {
        this.spaces = [];
    }

    boot() {

    }
    createExecutionSpace() {
        let space = {
            instructions: [],
            stack: new Stack(),
            locked: false,
            user: null
        };
        space.stack.boot();
        this.spaces.push(space);
        return space;
    }
    removeExecutionSpace(space) {
        let index = this.spaces.indexOf(space);
        this.spaces.splice(index, 1);
    }
    getExecutionSpace(index) {
        return this.spaces[index];
    }
    getExecutionSpaceCount() {
        return this.spaces.length;
    }
}