class Interpreter {
    constructor(os, parser) {
        this.os = os;
        this.parser = parser;
        this.api = new Api(os);
    }

    interpret(statements, executionSpace) {
        let result = [];
        let space = executionSpace;
        space.locked = true;
        statements.forEach((s) => result = result.concat(this.getInstructionQueue(s, space)));
        space.instructions = result;
        space.locked = false;
    }
    getInstructionQueue(statement, executionSpace) {
        let instructions = [];
        if (statement.isassign) {
            instructions.push(this.getEnsureVariable(statement.outputtarget));
            if (statement.literal) {
                instructions.push(this.getAssignVariable(statement.outputtarget, statement.literal));
            }
        }
        if (statement.function) {
            instructions = instructions.concat(this.getExecuteFunction(executionSpace, statement.function, statement.parameters));
        }
        return instructions;
    }
    getEnsureVariable(name) {
        return {
            execute: (executionSpace) => { executionSpace.stack.ensureVariable(name) }
        };
    }
    getAssignVariable(name, value) {
        return {
            execute: (executionSpace) => { executionSpace.stack.setVariable(name, value) }
        };
    }
    getCopyVariable(sourcename, targetname) {
        return {
            execute: (executionSpace) => { executionSpace.stack.setVariable(targetname, executionSpace.stack.getVariableValue(sourcename)) }
        }
    }
    getExecuteFunction(executionSpace, name, parameters) {
        let functionCalls = [];
        let targetFunction = null;
        let functionInstructions = executionSpace.instructions.filter(i => i.isdefinition && i.function === name);
        let parameterFunctions = [];
        if (functionInstructions.length == 0) {
            if (this.api.isApiCall(name)) {
                functionCalls.push({ execute: () => {
                    this.os.executeApiCall(executionSpace, name);
                }});
                targetFunction = this.api.getCall(name);
                parameterFunctions = this.queueParameterFunctions(targetFunction, parameters, executionSpace);
            } else {
                return;
            }
        }
        if (functionInstructions.length > 1) {
            let preferredFunctions = functionInstructions
                .filter(i => i.parameters.length >= parameters.length)
                .sort(a, b => a.parameters.length - b.parameters.length);
            if (preferredFunctions.length == 0) {
                preferredFunctions = functionInstructions
                    .sort((a, b) => b.parameters.length - a.parameters.length);
            }
            targetFunction = preferredFunctions[0];
            parameterFunctions = this.queueParameterFunctions(targetFunction, parameters, executionSpace);
            functionCalls.push(this.parser.parse(targetFunction.codeBlock));
        }
        let enterStack = { 
            execute: () => { 
                executionSpace.stack.addStackFrame();
            } 
        };
        let exitStack = {
            execute: () => {
                executionSpace.stack.removeStackFrame();
            }
        };
        let instructions = parameterFunctions
            .concat([ enterStack ])
            .concat(functionCalls)
            .concat([ exitStack ]);
        return instructions;
    }
    queueParameterFunctions(targetFunction, parameters, executionSpace) {
        let parameterFunctions = [];
        for (var index = 0; index < targetFunction.parameters.length; index++) {
            let parameter = parameters[index];
            let variableName = `_${targetFunction.name ?? targetFunction.function}_${index}`;
            if (!parameter.isdefinition && parameter.function) {
                let executeFunction = this.getExecuteFunction(executionSpace, parameter.function, parameter.parameters);

                parameter.function = null;
                parameter.parameters = null;
                parameter.variable = variableName; 

                parameterFunctions.push(this.getEnsureVariable(variableName));
                parameterFunctions.push(executeFunction);
                // This is incorrect! Should be the result from the stack
                parameterFunctions.push(this.getAssignVariable(variableName, targetFunction !== null ?? targetFunction.Result));
            }
            if (parameter.literal) {
                parameterFunctions.push(this.getEnsureVariable(variableName));
                parameterFunctions.push(this.getAssignVariable(variableName, parameter.literal));
            }
            if (parameter.variable) {
                parameterFunctions.push(this.getEnsureVariable(variableName));
                parameterFunctions.push(this.getCopyVariable(parameter.variable, variableName));
            }
        }
        return parameterFunctions;
    }
}