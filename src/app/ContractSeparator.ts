import {getRemodelAntlr} from '@/remodel/parser';
import 'colors';
import {RuleContractContext} from '../../antlr4/REMODELParser';
import REMODELVisitor from '../../antlr4/REMODELVisitor';
import {ParserRuleContext, Token} from 'antlr4';
function getOriginalText(ctx: ParserRuleContext): string | undefined {
  if (!ctx) {
    return;
  }
  const start: Token = ctx.start;
  const stop: Token | undefined = ctx.stop;

  if (!start || !stop) {
    return ctx.getText(); // 回退方案
  }

  const inputStream = start.getInputStream();
  if (!inputStream) {
    return ctx.getText();
  }

  // 提取从 start 到 stop 的原始文本（包括隐藏通道）
  const startIndex = start.start;
  const stopIndex = stop.stop;
  return inputStream.getText(startIndex, stopIndex);
}
export class ContractSeparator extends REMODELVisitor<{definition?: string}> {
  separate(input: string) {
    const {parser} = getRemodelAntlr(input);
    return this.visit(parser['ruleContract']());
  }
  visitRuleContract = (ctx: RuleContractContext) => {
    return {
      definition: getOriginalText(ctx.ruleDefinition())?.replace('definition:', ''),
      precondition: getOriginalText(ctx.rulePrecondition())!.replace('precondition:', ''),
      postcondition: getOriginalText(ctx.rulePostcondition())!.replace('postcondition:', ''),
    };
  };
}
