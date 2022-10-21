const faseOneStatementExpression = '(?:([^\\{\\}]*?)(?: ?= ?))?(.*)?';
const faseTwoStatementExpression = '((.*?)(\\((.*?)?\\)))((?:.*?)\\{.*\\})?';
const variableNameExpression = '^[^_]\\w+';
const statementExpression = '(?:([^\\{\\}]*?)(?: ?= ?))?((.*?)(\\((.*)?\\))?)?((?:.*?)\\{.*\\})?';
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
        let statement = { 
            isassign: false,
            outputtarget: null,
            isdefinition: false,
            function: null,
            literal: null,
            variable: null,
            parameters: [],
            blockCode: null
        };
        let faseOneStatementExpressionRegex = new RegExp(faseOneStatementExpression, 'g');
        let faseOneResult = faseOneStatementExpressionRegex.exec(code);
        if (!faseOneResult) {
            this.handleSyntaxError(code);
            return;
        }
        statement.isassign = faseOneResult[1] !== null && faseOneResult[1] !== undefined;
        if (statement.isassign) {
            statement.outputtarget = faseOneResult[1];
        }
        let rightSideCode = faseOneResult[2];
        let literalExpressionRegex = new RegExp(literalExpression);
        if (literalExpressionRegex.test(rightSideCode)) {
            statement.literal = rightSideCode.replaceAll('\'', '');
        } else {
            let faseTwoStatementExpressionRegex = new RegExp(faseTwoStatementExpression, 'g');
            let faseTwoResult = faseTwoStatementExpressionRegex.exec(rightSideCode);
            if (!faseTwoResult) {
                let variableNameExpressionRegex = new RegExp(variableNameExpression, 'g');
                if (variableNameExpressionRegex.test(rightSideCode)) {
                    statement.variable = rightSideCode;
                }
                else {
                    this.handleSyntaxError(code);
                    return;
                }
            }
            statement.function = faseTwoResult[2];
            if (faseTwoResult[4]) {
                let parameterSplitExpressionRegex = new RegExp('((\'.*?\')|(\\w+\\(.*\\))|([\\w\\.]+)),?','g');
                let parameters = Array.from(faseTwoResult[4].matchAll(parameterSplitExpressionRegex), (m) => m[0]);
                if (parameters) {
                    parameters.forEach(p => statement.parameters.push(this.parseParameter(p[p.length - 1] == ',' ? p.substring(0, p.length - 2) : p)));
                }
                statement.functionBlock = faseTwoResult[5];
            }
        }

        return statement;
    }
    parseParameter(parameter) {
        let statement = { 
            literal: null,
            variable: null,
        };
        let variableNameExpressionRegex = new RegExp(variableNameExpression, 'g');
        let literalExpressionRegex = new RegExp(literalExpression, 'g');
        if (literalExpressionRegex.test(parameter)) {
            statement.literal = parameter.replaceAll('\'', '');
        } else if (variableNameExpressionRegex.test(parameter)) {
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