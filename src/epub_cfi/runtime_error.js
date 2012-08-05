// TODO: Should probably remove the interpreterFunction parameter. Also don't really need the nodeInAST parameter; something
//   more generic will do. 

EPUBcfi.RuntimeError = function (nodeInAST, interpreterFunction, message) {

        function RuntimeError() {

            this.node = nodeInAST;
            this.interpreterFunction = interpreterFunction;
        }

        RuntimeError.prototype = new Error(message);
        RuntimeError.constructor = RuntimeError;

        return new RuntimeError();
    }