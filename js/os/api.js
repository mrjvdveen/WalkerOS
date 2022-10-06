class Api {
    constructor(os) {
        this.Calls = [
            {
                name: 'write',
                parameters: [ 'text' ],
                execute: (params) => {
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