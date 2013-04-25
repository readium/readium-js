// Description: This file defines a grammar for the EPUB CFI specification. CFIs can be viewed as a Domain Specific Language (DSL)
//   for creating unique, recoverable and sortable indexes for EPUBs. This grammar is used with PEG.js to generate a
//   parser for CFI strings.
// Rationale: The CFI specification defines an EBNF grammar for CFIs. Given that the grammar is provided by the spec, using a 
//   parser generator as the mechanism for building and maintaining a lexer/parser seems appropriate for a number of reasons. 
//   First, using a parser-generator with a well-specified grammar ensures a more complete and bug-free lexing/parsing solution, as 
//   opposed to writing the lexer/parser by hand. Second, it will be easier to maintain a parser generator solution over time, as 
//   changes to the specs or requirements can be more easily accomodated in a more logically organized toolchain. Third, an
//   implementation of CFIs require that a CFI be lexed and parsed. This part of the problem is irreducible. As such, it makes sense to //   leverage existing tools and methodologies, rather than build a custom solution. Last but not least, I'm already familiar with 
//   parser generator tools, which lowers the fixed costs using this tool. 

// Changes from EBNF grammar in EPUB CFI specification: 
// 1) "index step" and "indirection step are differentiated" instead of having the "!" in the local_path non-terminal
// 2) "Assertion" split into id-assertion and terminating-assertion
// 3) "CSV" changed to reflect that it should probably only be TWO comma-separated values 
// 4) "CSV" changed to reflect that [,aaa] is valid; this is not allowed by the grammar, I believe
// 5) "String" removed as redundant
// 6) "Special-chars" removed as unnecessary due to PEG sequential match
// 7) "character" will not include "space" in order to facilitate the handling of spaces in assertion values
// 8) The "parameter" non-terminal uses a "valueNoSpace" instead of a "csv" on the RHS of the "=" sign; couldn't see why this was
//  supposed to be a csv? Maybe this was being used the same way as the csv for the id assertion -> commas are allowed and it was 
//  convenient as the "csv" non-terminal was already defined. 
// 9) Removed "characterEscapedSpecial" as it was no longer required (redundant).
// 10) This hasn't been removed yet, but the "text location assertion" is only valid for the character offset terminus and has been 
//  included in this grammar as such. 

fragment
  = "epubcfi(" fragmentVal:(range / path) ")" { 
        
        return { type:"CFIAST", cfiString:fragmentVal };
    }

// Note: According to the spec, you can have three terminuses in a range: In the first local path, and in both
//   branching local paths. In fact, I think this would a meaningless production.
range 
  = stepVal:indexStep localPathVal:local_path "," rangeLocalPath1Val:local_path "," rangeLocalPath2Val:local_path {

        return { type:"range", path:stepVal, localPath:localPathVal, range1:rangeLocalPath1Val, range2:rangeLocalPath2Val };
  } 

path 
  = stepVal:indexStep localPathVal:local_path { 

        return { type:"path", path:stepVal, localPath:localPathVal }; 
    }

local_path
  = localPathStepVal:(indexStep / indirectionStep)+ termStepVal:termstep? { 

        return { steps:localPathStepVal, termStep:termStepVal }; 
    }

// assertVal[1] is used because assertVal is an array of the match 0:"[" 1:idAssertion 2:"]"
indexStep
  = "/" stepLengthVal:integer assertVal:("[" idAssertion "]")? { 

        return { type:"indexStep", stepLength:stepLengthVal, idAssertion:assertVal[1] };
    }

indirectionStep
  = "!/" stepLengthVal:integer assertVal:("[" idAssertion "]")? { 

        return { type:"indirectionStep", stepLength:stepLengthVal, idAssertion:assertVal[1] };
    }

// REFACTORING CANDIDATE: The termstep non-terminal may be redundant
termstep
  = terminus

terminus
  = ":" textOffsetValue:integer textLocAssertVal:("[" textLocationAssertion "]")? { 

        return { type:"textTerminus", offsetValue:textOffsetValue, textAssertion:textLocAssertVal[1] };
    }

// Must have an assertion if you create an assertion "[]" in the cfi string
idAssertion
  = idVal:value { 

        return idVal; 
    }

// Must have an assertion if you create an assertion "[]" in the cfi string
textLocationAssertion
  = csvVal:csv? paramVal:parameter? { 

        return { type:"textLocationAssertion", csv:csvVal, parameter:paramVal }; 
    }

parameter
  = ";" paramLHSVal:valueNoSpace "=" paramRHSVal:valueNoSpace { 

        return { type:"parameter", LHSValue:paramLHSVal, RHSValue:paramRHSVal }; 
    }

csv 
  = preAssertionVal:value? "," postAssertionVal:value? { 

        return { type:"csv", preAssertion:preAssertionVal, postAssertion:postAssertionVal }; 
    }

// PEG.js does not have an "except" operator. My understanding is that "value-no-space" means "no spaces at all"
valueNoSpace
  = stringVal:(escapedSpecialChars / character)+ { 

        return stringVal.join(''); 
    }

// Removed stringEscapedSpecialChars as it was redundant (sort of). It obviously represented a "string of escaped special characters." 
//   Will have to think about whether it makes sense to replace this with value. 
value 
  = stringVal:(escapedSpecialChars / character / space)+ { 

        return stringVal.join(''); 
    }

escapedSpecialChars
  = escSpecCharVal:(
      (circumflex circumflex) 
    / (circumflex squareBracket) 
    / (circumflex parentheses) 
    / (circumflex comma) 
    / (circumflex semicolon)
    / (circumflex equal) 
    ) { 
        
        return escSpecCharVal[1]; 
    }

// Digit and digit-non-zero not included as separate terminals
number 
  = intPartVal:( [1-9][0-9]+ ) "." fracPartVal:( [0-9]* [1-9] ) { 

        return intPartVal.join('') + "." + fracPartVal.join(''); 
    }

integer
  = integerVal:("0" / [1-9][0-9]*) { 

        if (integerVal === "0") { 
          return "0";
        } 
        else { 
          return integerVal[0].concat(integerVal[1].join(''));
        }
    }

space 
  = " " { return " "; }

circumflex
  = "^" { return "^"; }

doubleQuote
  = '"' { return '"'; }

squareBracket
  = bracketVal:("[" / "]") { return bracketVal; }

parentheses
  = paraVal:( "(" / ")" ) { return paraVal; }

comma
  = "," { return ","; }

semicolon
  = ";" { return ";"; }

equal
  = "=" { return "="; }

character
  = charVal:([a-z] / [A-Z] / [0-9] / "-" / "_") { return charVal; }
