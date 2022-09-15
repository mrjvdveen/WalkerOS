const statementExpression = /(?:([^\{\}]*?)(?: ?= ?))?((.*?)(\((.*)?\)))?((?:.*?)\{.*\})?/gs;
const literalExpression = /(^'.*?'$)|(^[\d\.]*$)/g;

class Parser {
    constructor(errorHandler) {
        this.errorHandler = errorHandler;
    }
    parse(code) {
        let statements = code.split(';');
        let result = [];
        statements.forEach(element => {
            if (element.trim() !== '') {
                result.push(this.parseStatement(element.trim()));
            }
        });
        return result;
    }
    parseStatement(code) {
        let result = statementExpression.exec(code);
        if (!result) {
            this.handleSyntaxError(code);
            return;
        }
        let assignedVariable = result[1];
        let inputSymbol = result[3];
        const parameterSplitExpression = /(('.*?')|([\d\.]+)|(\w+\(.*\))),?/g;
        let parameters = null;
        if (result[5]) {
            parameters = result[5].match(parameterSplitExpression);
        }
        let functionBlock = result[6];
        let statement = { 
            isassign: assignedVariable !== null && assignedVariable !== undefined,
            outputtarget: assignedVariable,
            isdefinition: functionBlock !== null && functionBlock !== undefined,
            function: null,
            literal: null,
            variable: null,
            parameters: [],
            blockCode: functionBlock
        };
        if (parameters) {
            statement.function = inputSymbol;
            parameters.forEach(p => statement.parameters.push(this.parseParameter(p[p.length - 1] == ',' ? p.substring(0, p.length - 2) : p)));
        } else {
            if (literalExpression.test(inputSymbol)) {
                statement.literal = inputSymbol.replaceAll('\'', '');
            } else {
                statement.variable = inputSymbol;
            }
        }
        return statement;
    }
    parseParameter(parameter) {
        let statement = { 
            literal: null,
            variable: null,
        };
        if (literalExpression.test(parameter)) {
            statement.literal = parameter.replaceAll('\'', '');
        } else if (!statementExpression.test(parameter)) {
            statement.variable = parameter;
        } else {
            return this.parseStatement(parameter);
        }
        return statement;
    }
    handleSyntaxError(code) {
        this.errorHandler.error(`Syntax error in "${code}"`);
    }
}