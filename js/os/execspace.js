class ExecutionSpace {
    constructor() {
        this.spaces = [];
    }

    boot() {

    }
    CreateExecutionSpace() {
        let space = {
            instructions: [],
            Stack: new Stack(),
            locked: false
        };
        space.Stack.boot();
        this.spaces.push(space);
        return space;
    }
    RemoveExecutionSpace(space) {
        let index = this.spaces.indexOf(space);
        this.spaces.splice(index, 1);
    }
    GetExecutionSpace(index) {
        return this.spaces[index];
    }
    GetExecutionSpaceCount() {
        return this.spaces.length;
    }
}