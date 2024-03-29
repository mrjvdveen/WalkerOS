let osObject = new OS();
let parser = new Parser(new ErrorHandler(osObject, "Parser"));
let interpreter = new Interpreter(osObject, parser);
let consoleObject = new Console(osObject, parser, interpreter);
let ui = new UI(consoleObject);

document.addEventListener('DOMContentLoaded', (event) => {
    ui.boot();
    osObject.onbooted = () => {
        consoleObject.boot();
    };
    osObject.boot();
});