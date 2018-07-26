import * as Generator from "readium-cfi-js/src/generator";
import * as Instruction from "readium-cfi-js/src/instructions";
import  * as Interpreter from "readium-cfi-js/src/interpreter";
import * as Parser from "readium-cfi-js/src/parser";
module.exports = {
    ...Generator,
    ...Instruction,
    ...Interpreter,
    ...Parser
}