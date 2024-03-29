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
        if (statement.function && !statement.isdefinition) {
            instructions = instructions.concat(this.getExecuteFunction(executionSpace, statement.function, statement.parameters));
        }
        if (statement.function && statement.isdefinition) {
            instructions = instructions.concat(this.getFunctionDefinition(statement));
        }
        return instructions;
    }
    getFunctionDefinition(statement) {
        return {
            execute: (executionSpace) => { executionSpace.heap.addFunction(statement.function, statement.parameters, statement.blockCode) }
        };
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
                targetFunction = executionSpace.heap.getFunction(name, parameters);
                if (targetFunction) {
                    parameterFunctions = this.queueParameterFunctions(targetFunction, parameters, executionSpace);
                    targetFunction.instructions.forEach((s) => functionCalls = functionCalls.concat(this.getInstructionQueue(s, executionSpace)));
                } else {
                    // Handle error for unknown function
                    return;
                }
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
            execute: (executionSpace) => { 
                executionSpace.stack.addStackFrame();
                executionSpace.stack.ensureVariable(name);
                if (targetFunction && targetFunction.parameters) {
                    targetFunction.parameters.forEach((p, i) => { 
                        if (p.variable) {
                            executionSpace.stack.ensureVariable(p.variable);
                            executionSpace.stack.setVariable(p.variable, 
                                executionSpace.stack.getVariableValue(this.getParameterReservedVariableName(targetFunction.name, i)));
                        }
                    });
                }
            } 
        };
        let exitStack = {
            execute: (executionSpace) => {
                let returnValue = executionSpace.stack.getVariableValue(name);
                executionSpace.stack.removeStackFrame();
                executionSpace.stack.ensureVariable(this.getResultReservedVariableName(name));
                executionSpace.stack.setVariable(this.getResultReservedVariableName(name), returnValue);
            }
        };
        let instructions = parameterFunctions
            .concat([ enterStack ])
            .concat(functionCalls)
            .concat([ exitStack ]);
        return instructions;
    }
    getParameterReservedVariableName(functionName, parameterIndex) {
        return `_${functionName}_${parameterIndex}`;
    }
    getResultReservedVariableName(functionName) {
        return `_${functionName}_result`;
    }
    queueParameterFunctions(targetFunction, parameters, executionSpace) {
        let parameterFunctions = [];
        for (var index = 0; index < targetFunction.parameters.length; index++) {
            let parameter = parameters[index];
            let variableName = this.getParameterReservedVariableName(targetFunction.name ?? targetFunction.function, index);
            if (!parameter.isdefinition && parameter.function) {
                let executeFunction = this.getExecuteFunction(executionSpace, parameter.function, parameter.parameters);

                // parameter.function = null;
                parameter.parameters = null;
                parameter.variable = variableName; 

                parameterFunctions.push(this.getEnsureVariable(variableName));
                parameterFunctions = parameterFunctions.concat(executeFunction);
                parameterFunctions.push(this.getCopyVariable(this.getResultReservedVariableName(parameter.function), variableName));
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