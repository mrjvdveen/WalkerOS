class Api {
    constructor(os) {
        this.Calls = [
            {
                name: 'write',
                parameters: [ 'text' ],
                execute: (params) => {
                    os.writeOutput(params[0]);
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