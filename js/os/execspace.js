class ExecutionSpace {
    constructor() {
        this.spaces = [];
    }

    boot() {

    }
    createExecutionSpace(user, parentSpace) {
        let space = {
            instructions: [],
            stack: new Stack(),
            locked: false,
            user: user,
            parentSpace: parentSpace
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