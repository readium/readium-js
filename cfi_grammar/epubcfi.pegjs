// Description: This file defines a grammar for the EPUB CFI specification. CFIs can be viewed as a Domain Specific Language (DSL)
//   for creating unique, recoverable and sortable indexes for EPUBs. This grammar is used with PEG.js to generate a
//   parser for CFI strings.
// Rationale: The CFI specification defines an EBNF grammar for CFIs. Given that the grammar is provided by the spec, using a 
//   parser generator as the mechanism for building and maintaining a lexer/parser seems appropriate for a number of reasons. 
//   First, using a parser-generator with a well-specified grammar ensures a more complete and bug-free lexing/parsing solution, as 
//   opposed to writing the lexer/parser by hand. Second, it will be easier to maintain a parser generator solution over time, as 
//   changes to the specs or requirements can be more easily accomodated in a more logically organized toolchain. Third, an
//   implementation of CFIs require that a CFI be lexed and parsed. This part of the problem is irreducible. As such, it makes sense to //   leverage existing tools and methodologies, rather than build a custom solution. Last but not least, I'm already familiar with parser-//   generator tools, which lowers the fixed costs using this tool. 

fragment
  = "epubcfi(" pathVal:path ")" { return { type:"CFIAST", cfiString:pathVal }; }

path 
  = stepVal:indexStep localPathVal:local_path { return { type:"cfiString", path:stepVal, localPath:localPathVal }; }

local_path
  = localPathStepVal:(indexStep / indirectionStep)+ termStepVal:termstep? { return { steps:localPathStepVal, termStep:termStepVal }; }

indexStep
  = "/" stepLengthVal:integer { return { type:"indexStep", stepLength:stepLengthVal }; }

indirectionStep
  = "!/" stepLengthVal:integer { return { type:"indirectionStep", stepLength:stepLengthVal }; }

termstep
  = terminus

terminus
  = ":" textOffsetValue:integer { return { type:"textTerminus", offsetValue:textOffsetValue }; }

integer
  = integerVal:("0" / [1-9][0-9]*) { if (integerVal === "0") { return "0" } else { return integerVal[0].concat(integerVal[1].join('')) } }