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
    GetCall(name) {
        return this.Calls.find(c => c.name === name);
    }
    IsApiCall(name) {
        return this.Calls.some(c => c.name === name);
    }
}