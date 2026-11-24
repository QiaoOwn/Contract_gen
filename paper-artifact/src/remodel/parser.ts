import REMODELLexer from '../../antlr4/REMODELLexer';
import REMODELParser from '../../antlr4/REMODELParser';
import {CharStream, CommonTokenStream} from 'antlr4';

export const getRemodelAntlr = (input: string) => {
  const chars = new CharStream(input);
  const lexer = new REMODELLexer(chars);
  const tokens = new CommonTokenStream(lexer);
  const parser = new REMODELParser(tokens);
  return {parser, chars, lexer, tokens};
};
