class ErrorHandler {
    constructor(os, name) {
        this.os = os;
        this.name = name;
    }
    error(message) {
        this.os.writeOutput(`${this.name} - ERROR: ${message}`);
    }
}