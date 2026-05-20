// Generated from ./antlr4/REMODEL.g4 by ANTLR 4.13.2

import {ParseTreeVisitor} from 'antlr4';

import {RuleRequirementModelContext} from './REMODELParser.js';
import {RuleInteractionContext} from './REMODELParser.js';
import {RuleMessageContext} from './REMODELParser.js';
import {RuleCallMessageContext} from './REMODELParser.js';
import {RuleReturnMessageContext} from './REMODELParser.js';
import {RuleExecutionContext} from './REMODELParser.js';
import {RuleCombinedFragmentContext} from './REMODELParser.js';
import {RuleOperatorContext} from './REMODELParser.js';
import {RuleOperandContext} from './REMODELParser.js';
import {RuleAbstractEndContext} from './REMODELParser.js';
import {RuleMixEndContext} from './REMODELParser.js';
import {RuleMixOpAndCFEndContext} from './REMODELParser.js';
import {RuleMessageEndContext} from './REMODELParser.js';
import {RuleExecutionEndContext} from './REMODELParser.js';
import {RuleCombinedFragmentEndContext} from './REMODELParser.js';
import {RuleOperandEndContext} from './REMODELParser.js';
import {RuleDomainModelContext} from './REMODELParser.js';
import {RuleUseCaseModelContext} from './REMODELParser.js';
import {RuleActorContext} from './REMODELParser.js';
import {RuleUCContext} from './REMODELParser.js';
import {RuleServiceContext} from './REMODELParser.js';
import {RuleParticipantContext} from './REMODELParser.js';
import {RulePartitionContext} from './REMODELParser.js';
import {RuleWorkflowExpContext} from './REMODELParser.js';
import {RulePartitionActionContext} from './REMODELParser.js';
import {RuleActivityFinalContext} from './REMODELParser.js';
import {RuleInitalNodeContext} from './REMODELParser.js';
import {RuleForkNodeContext} from './REMODELParser.js';
import {RuleJoinNodeContext} from './REMODELParser.js';
import {RuleComplexOpeartionContext} from './REMODELParser.js';
import {RuleSimpleOperationContext} from './REMODELParser.js';
import {RuleLoopExpContext} from './REMODELParser.js';
import {RuleSwitchExpContext} from './REMODELParser.js';
import {RuleSwitchCaseContext} from './REMODELParser.js';
import {RuleSwitchDefaultContext} from './REMODELParser.js';
import {RuleOperationContext} from './REMODELParser.js';
import {RuleOperationNameContext} from './REMODELParser.js';
import {RuleParameterContext} from './REMODELParser.js';
import {RuleParametersNameContext} from './REMODELParser.js';
import {RuleEntityContext} from './REMODELParser.js';
import {RuleAttributeContext} from './REMODELParser.js';
import {RuleReferenceContext} from './REMODELParser.js';
import {RuleTypeCSContext} from './REMODELParser.js';
import {RuleInvarianceContext} from './REMODELParser.js';
import {RuleEntityTypeContext} from './REMODELParser.js';
import {RuleEnumEntityContext} from './REMODELParser.js';
import {RuleEnumItemContext} from './REMODELParser.js';
import {RuleUSECASE_RELATIONContext} from './REMODELParser.js';
import {RuleContractContext} from './REMODELParser.js';
import {RuleDefinitionContext} from './REMODELParser.js';
import {RulePreconditionContext} from './REMODELParser.js';
import {RulePostconditionContext} from './REMODELParser.js';
import {RuleOCLExpressionCSContext} from './REMODELParser.js';
import {RuleNestedExpCSContext} from './REMODELParser.js';
import {RuleLogicFormulaExpCSContext} from './REMODELParser.js';
import {RuleAtomicExpressionContext} from './REMODELParser.js';
import {RuleLeftSubAtomicExpressionContext} from './REMODELParser.js';
import {RuleRightSubAtomicExpressionContext} from './REMODELParser.js';
import {RuleInfixCompareOperatorNameContext} from './REMODELParser.js';
import {RuleInfixOperatorNameContext} from './REMODELParser.js';
import {RuleCallExpCSContext} from './REMODELParser.js';
import {RuleLoopExpCSContext} from './REMODELParser.js';
import {RuleIteratorExpCSContext} from './REMODELParser.js';
import {RuleIteratorIdentifierContext} from './REMODELParser.js';
import {RuleArgumentsCSContext} from './REMODELParser.js';
import {RuleFeatureCallExpCSContext} from './REMODELParser.js';
import {RuleStandardNavigationCallExpCSContext} from './REMODELParser.js';
import {RuleStandardOperationExpCSContext} from './REMODELParser.js';
import {RulePredefineOpContext} from './REMODELParser.js';
import {RuleStandardNoneParameterOperationContext} from './REMODELParser.js';
import {RuleStandardParameterOperationContext} from './REMODELParser.js';
import {RuleStandardCollectionOperationContext} from './REMODELParser.js';
import {RuleStandardDateOperationContext} from './REMODELParser.js';
import {RuleClassiferCallExpCSContext} from './REMODELParser.js';
import {RulePropertyCallExpCSContext} from './REMODELParser.js';
import {RuleOperationCallExpCSContext} from './REMODELParser.js';
import {RuleOperationParametersContext} from './REMODELParser.js';
import {RuleIsMarkedPreCSContext} from './REMODELParser.js';
import {RuleVariableExpCSContext} from './REMODELParser.js';
import {RuleSimpleNameCSContext} from './REMODELParser.js';
import {RuleIfExpCSContext} from './REMODELParser.js';
import {RuleLetExpCSContext} from './REMODELParser.js';
import {RuleVariableDeclarationCSContext} from './REMODELParser.js';
import {RuleLiteralExpCSContext} from './REMODELParser.js';
import {RuleEnumLiteralExpCSContext} from './REMODELParser.js';
import {RuleTupleLiteralExpCSContext} from './REMODELParser.js';
import {RuleCollectionTypeCSContext} from './REMODELParser.js';
import {RuleCollectionLiteralExpCSContext} from './REMODELParser.js';
import {RuleCollectionLiteralPartCSContext} from './REMODELParser.js';
import {RuleCollectionRangeCSContext} from './REMODELParser.js';
import {RuleCollectionItemContext} from './REMODELParser.js';
import {RulePrimitiveLiteralExpCSContext} from './REMODELParser.js';
import {RuleNumberLiteralExpCSContext} from './REMODELParser.js';
import {RuleIntegerLiteralExpCSContext} from './REMODELParser.js';
import {RuleRealLiteralExpCSContext} from './REMODELParser.js';
import {RuleUnlimitedNaturalLiteralExpCSContext} from './REMODELParser.js';
import {RuleBooleanLiteralExpCSContext} from './REMODELParser.js';
import {RuleStringLiteralExpCSContext} from './REMODELParser.js';
import {RuleNullLiteralExpCSContext} from './REMODELParser.js';
import {RuleInvalidLiteralExpCSContext} from './REMODELParser.js';
import {RuleFloatContext} from './REMODELParser.js';
import {RuleCollectionTypeIdentifierCSContext} from './REMODELParser.js';
import {RulePrimitiveTypeCSContext} from './REMODELParser.js';
import {RuleOclTypeCSContext} from './REMODELParser.js';
import {RuleAssociationTypeCSContext} from './REMODELParser.js';

/**
 * This interface defines a complete generic visitor for a parse tree produced
 * by `REMODELParser`.
 *
 * @param <Result> The return type of the visit operation. Use `void` for
 * operations with no return type.
 */
export default class REMODELVisitor<Result> extends ParseTreeVisitor<Result> {
  /**
   * Visit a parse tree produced by `REMODELParser.ruleRequirementModel`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleRequirementModel?: (ctx: RuleRequirementModelContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.ruleInteraction`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleInteraction?: (ctx: RuleInteractionContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.ruleMessage`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleMessage?: (ctx: RuleMessageContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.ruleCallMessage`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleCallMessage?: (ctx: RuleCallMessageContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.ruleReturnMessage`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleReturnMessage?: (ctx: RuleReturnMessageContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.ruleExecution`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleExecution?: (ctx: RuleExecutionContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.ruleCombinedFragment`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleCombinedFragment?: (ctx: RuleCombinedFragmentContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.ruleOperator`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleOperator?: (ctx: RuleOperatorContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.ruleOperand`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleOperand?: (ctx: RuleOperandContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.ruleAbstractEnd`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleAbstractEnd?: (ctx: RuleAbstractEndContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.ruleMixEnd`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleMixEnd?: (ctx: RuleMixEndContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.ruleMixOpAndCFEnd`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleMixOpAndCFEnd?: (ctx: RuleMixOpAndCFEndContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.ruleMessageEnd`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleMessageEnd?: (ctx: RuleMessageEndContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.ruleExecutionEnd`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleExecutionEnd?: (ctx: RuleExecutionEndContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.ruleCombinedFragmentEnd`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleCombinedFragmentEnd?: (ctx: RuleCombinedFragmentEndContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.ruleOperandEnd`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleOperandEnd?: (ctx: RuleOperandEndContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.ruleDomainModel`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleDomainModel?: (ctx: RuleDomainModelContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.ruleUseCaseModel`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleUseCaseModel?: (ctx: RuleUseCaseModelContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.ruleActor`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleActor?: (ctx: RuleActorContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.ruleUC`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleUC?: (ctx: RuleUCContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.ruleService`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleService?: (ctx: RuleServiceContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.ruleParticipant`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleParticipant?: (ctx: RuleParticipantContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.rulePartition`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRulePartition?: (ctx: RulePartitionContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.ruleWorkflowExp`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleWorkflowExp?: (ctx: RuleWorkflowExpContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.rulePartitionAction`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRulePartitionAction?: (ctx: RulePartitionActionContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.ruleActivityFinal`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleActivityFinal?: (ctx: RuleActivityFinalContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.ruleInitalNode`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleInitalNode?: (ctx: RuleInitalNodeContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.ruleForkNode`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleForkNode?: (ctx: RuleForkNodeContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.ruleJoinNode`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleJoinNode?: (ctx: RuleJoinNodeContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.ruleComplexOpeartion`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleComplexOpeartion?: (ctx: RuleComplexOpeartionContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.ruleSimpleOperation`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleSimpleOperation?: (ctx: RuleSimpleOperationContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.ruleLoopExp`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleLoopExp?: (ctx: RuleLoopExpContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.ruleSwitchExp`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleSwitchExp?: (ctx: RuleSwitchExpContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.ruleSwitchCase`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleSwitchCase?: (ctx: RuleSwitchCaseContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.ruleSwitchDefault`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleSwitchDefault?: (ctx: RuleSwitchDefaultContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.ruleOperation`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleOperation?: (ctx: RuleOperationContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.ruleOperationName`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleOperationName?: (ctx: RuleOperationNameContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.ruleParameter`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleParameter?: (ctx: RuleParameterContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.ruleParametersName`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleParametersName?: (ctx: RuleParametersNameContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.ruleEntity`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleEntity?: (ctx: RuleEntityContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.ruleAttribute`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleAttribute?: (ctx: RuleAttributeContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.ruleReference`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleReference?: (ctx: RuleReferenceContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.ruleTypeCS`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleTypeCS?: (ctx: RuleTypeCSContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.ruleInvariance`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleInvariance?: (ctx: RuleInvarianceContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.ruleEntityType`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleEntityType?: (ctx: RuleEntityTypeContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.ruleEnumEntity`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleEnumEntity?: (ctx: RuleEnumEntityContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.ruleEnumItem`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleEnumItem?: (ctx: RuleEnumItemContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.ruleUSECASE_RELATION`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleUSECASE_RELATION?: (ctx: RuleUSECASE_RELATIONContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.ruleContract`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleContract?: (ctx: RuleContractContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.ruleDefinition`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleDefinition?: (ctx: RuleDefinitionContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.rulePrecondition`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRulePrecondition?: (ctx: RulePreconditionContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.rulePostcondition`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRulePostcondition?: (ctx: RulePostconditionContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.ruleOCLExpressionCS`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleOCLExpressionCS?: (ctx: RuleOCLExpressionCSContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.ruleNestedExpCS`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleNestedExpCS?: (ctx: RuleNestedExpCSContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.ruleLogicFormulaExpCS`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleLogicFormulaExpCS?: (ctx: RuleLogicFormulaExpCSContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.ruleAtomicExpression`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleAtomicExpression?: (ctx: RuleAtomicExpressionContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.ruleLeftSubAtomicExpression`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleLeftSubAtomicExpression?: (ctx: RuleLeftSubAtomicExpressionContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.ruleRightSubAtomicExpression`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleRightSubAtomicExpression?: (ctx: RuleRightSubAtomicExpressionContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.ruleInfixCompareOperatorName`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleInfixCompareOperatorName?: (ctx: RuleInfixCompareOperatorNameContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.ruleInfixOperatorName`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleInfixOperatorName?: (ctx: RuleInfixOperatorNameContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.ruleCallExpCS`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleCallExpCS?: (ctx: RuleCallExpCSContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.ruleLoopExpCS`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleLoopExpCS?: (ctx: RuleLoopExpCSContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.ruleIteratorExpCS`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleIteratorExpCS?: (ctx: RuleIteratorExpCSContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.ruleIteratorIdentifier`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleIteratorIdentifier?: (ctx: RuleIteratorIdentifierContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.ruleArgumentsCS`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleArgumentsCS?: (ctx: RuleArgumentsCSContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.ruleFeatureCallExpCS`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleFeatureCallExpCS?: (ctx: RuleFeatureCallExpCSContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.ruleStandardNavigationCallExpCS`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleStandardNavigationCallExpCS?: (ctx: RuleStandardNavigationCallExpCSContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.ruleStandardOperationExpCS`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleStandardOperationExpCS?: (ctx: RuleStandardOperationExpCSContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.rulePredefineOp`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRulePredefineOp?: (ctx: RulePredefineOpContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.ruleStandardNoneParameterOperation`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleStandardNoneParameterOperation?: (
    ctx: RuleStandardNoneParameterOperationContext
  ) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.ruleStandardParameterOperation`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleStandardParameterOperation?: (ctx: RuleStandardParameterOperationContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.ruleStandardCollectionOperation`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleStandardCollectionOperation?: (ctx: RuleStandardCollectionOperationContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.ruleStandardDateOperation`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleStandardDateOperation?: (ctx: RuleStandardDateOperationContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.ruleClassiferCallExpCS`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleClassiferCallExpCS?: (ctx: RuleClassiferCallExpCSContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.rulePropertyCallExpCS`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRulePropertyCallExpCS?: (ctx: RulePropertyCallExpCSContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.ruleOperationCallExpCS`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleOperationCallExpCS?: (ctx: RuleOperationCallExpCSContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.ruleOperationParameters`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleOperationParameters?: (ctx: RuleOperationParametersContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.ruleIsMarkedPreCS`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleIsMarkedPreCS?: (ctx: RuleIsMarkedPreCSContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.ruleVariableExpCS`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleVariableExpCS?: (ctx: RuleVariableExpCSContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.ruleSimpleNameCS`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleSimpleNameCS?: (ctx: RuleSimpleNameCSContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.ruleIfExpCS`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleIfExpCS?: (ctx: RuleIfExpCSContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.ruleLetExpCS`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleLetExpCS?: (ctx: RuleLetExpCSContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.ruleVariableDeclarationCS`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleVariableDeclarationCS?: (ctx: RuleVariableDeclarationCSContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.ruleLiteralExpCS`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleLiteralExpCS?: (ctx: RuleLiteralExpCSContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.ruleEnumLiteralExpCS`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleEnumLiteralExpCS?: (ctx: RuleEnumLiteralExpCSContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.ruleTupleLiteralExpCS`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleTupleLiteralExpCS?: (ctx: RuleTupleLiteralExpCSContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.ruleCollectionTypeCS`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleCollectionTypeCS?: (ctx: RuleCollectionTypeCSContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.ruleCollectionLiteralExpCS`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleCollectionLiteralExpCS?: (ctx: RuleCollectionLiteralExpCSContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.ruleCollectionLiteralPartCS`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleCollectionLiteralPartCS?: (ctx: RuleCollectionLiteralPartCSContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.ruleCollectionRangeCS`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleCollectionRangeCS?: (ctx: RuleCollectionRangeCSContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.ruleCollectionItem`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleCollectionItem?: (ctx: RuleCollectionItemContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.rulePrimitiveLiteralExpCS`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRulePrimitiveLiteralExpCS?: (ctx: RulePrimitiveLiteralExpCSContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.ruleNumberLiteralExpCS`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleNumberLiteralExpCS?: (ctx: RuleNumberLiteralExpCSContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.ruleIntegerLiteralExpCS`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleIntegerLiteralExpCS?: (ctx: RuleIntegerLiteralExpCSContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.ruleRealLiteralExpCS`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleRealLiteralExpCS?: (ctx: RuleRealLiteralExpCSContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.ruleUnlimitedNaturalLiteralExpCS`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleUnlimitedNaturalLiteralExpCS?: (ctx: RuleUnlimitedNaturalLiteralExpCSContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.ruleBooleanLiteralExpCS`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleBooleanLiteralExpCS?: (ctx: RuleBooleanLiteralExpCSContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.ruleStringLiteralExpCS`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleStringLiteralExpCS?: (ctx: RuleStringLiteralExpCSContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.ruleNullLiteralExpCS`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleNullLiteralExpCS?: (ctx: RuleNullLiteralExpCSContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.ruleInvalidLiteralExpCS`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleInvalidLiteralExpCS?: (ctx: RuleInvalidLiteralExpCSContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.ruleFloat`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleFloat?: (ctx: RuleFloatContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.ruleCollectionTypeIdentifierCS`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleCollectionTypeIdentifierCS?: (ctx: RuleCollectionTypeIdentifierCSContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.rulePrimitiveTypeCS`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRulePrimitiveTypeCS?: (ctx: RulePrimitiveTypeCSContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.ruleOclTypeCS`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleOclTypeCS?: (ctx: RuleOclTypeCSContext) => Result;
  /**
   * Visit a parse tree produced by `REMODELParser.ruleAssociationTypeCS`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRuleAssociationTypeCS?: (ctx: RuleAssociationTypeCSContext) => Result;
}
