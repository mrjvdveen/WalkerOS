class Api {
    constructor(os) {
        this.Calls = [
            {
                name: 'write',
                parameters: [ 'text' ],
                execute: (executionSpace, params) => {
                    os.writeOutput(params[0]);
                }
            },
            {
                name: 'export',
                parameters: [],
                execute: () => {
                    os.storage.exportFiles();
                }
            },
            {
                name: 'import',
                parameters: [],
                execute: () => {
                    os.storage.importFiles();
                }
            },
            {
                name: 'getuser',
                parameters: [],
                execute: (executionSpace) => {
                    executionSpace.stack.setVariable('getuser', executionSpace.user.name);
                }
            }
        ]
    }
    getCall(name) {
        return this.Calls.find(c => c.name === name);
    }
    isApiCall(name) {
        return this.Calls.some(c => c.name === name);
    }
}