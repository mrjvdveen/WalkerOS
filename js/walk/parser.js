const statementExpression = '(?:([^\\{\\}]*?)(?: ?= ?))?((.*?)(\\((.*)?\\)))?((?:.*?)\\{.*\\})?';
const literalExpression = '(^\'.*?\'$)|(^[\\d\\.]*$)';

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
        let statementExpressionRegex = new RegExp(statementExpression, 'g');
        let result = statementExpressionRegex.exec(code);
        if (!result) {
            this.handleSyntaxError(code);
            return;
        }
        let assignedVariable = result[1];
        let inputSymbol = result[3];
        let parameterSplitExpressionRegex = new RegExp('((\'.*?\')|([\\d\\.]+)|(\\w+\\(.*\\))),?','g');
        let parameters = null;
        if (result[5]) {
            parameters = result[5].match(parameterSplitExpressionRegex);
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
            let literalExpressionRegex = new RegExp(literalExpression, 'g');
            if (literalExpressionRegex.test(inputSymbol)) {
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
        let statementExpressionRegex = new RegExp(statementExpression, 'g');
        let literalExpressionRegex = new RegExp(literalExpression, 'g');
        if (literalExpressionRegex.test(parameter)) {
            statement.literal = parameter.replaceAll('\'', '');
        } else if (!statementExpressionRegex.test(parameter)) {
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