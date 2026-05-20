// Generated from ./antlr4/REMODEL.g4 by ANTLR 4.13.2

import {ParseTreeListener} from 'antlr4';

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
 * This interface defines a complete listener for a parse tree produced by
 * `REMODELParser`.
 */
export default class REMODELListener extends ParseTreeListener {
  /**
   * Enter a parse tree produced by `REMODELParser.ruleRequirementModel`.
   * @param ctx the parse tree
   */
  enterRuleRequirementModel?: (ctx: RuleRequirementModelContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleRequirementModel`.
   * @param ctx the parse tree
   */
  exitRuleRequirementModel?: (ctx: RuleRequirementModelContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.ruleInteraction`.
   * @param ctx the parse tree
   */
  enterRuleInteraction?: (ctx: RuleInteractionContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleInteraction`.
   * @param ctx the parse tree
   */
  exitRuleInteraction?: (ctx: RuleInteractionContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.ruleMessage`.
   * @param ctx the parse tree
   */
  enterRuleMessage?: (ctx: RuleMessageContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleMessage`.
   * @param ctx the parse tree
   */
  exitRuleMessage?: (ctx: RuleMessageContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.ruleCallMessage`.
   * @param ctx the parse tree
   */
  enterRuleCallMessage?: (ctx: RuleCallMessageContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleCallMessage`.
   * @param ctx the parse tree
   */
  exitRuleCallMessage?: (ctx: RuleCallMessageContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.ruleReturnMessage`.
   * @param ctx the parse tree
   */
  enterRuleReturnMessage?: (ctx: RuleReturnMessageContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleReturnMessage`.
   * @param ctx the parse tree
   */
  exitRuleReturnMessage?: (ctx: RuleReturnMessageContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.ruleExecution`.
   * @param ctx the parse tree
   */
  enterRuleExecution?: (ctx: RuleExecutionContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleExecution`.
   * @param ctx the parse tree
   */
  exitRuleExecution?: (ctx: RuleExecutionContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.ruleCombinedFragment`.
   * @param ctx the parse tree
   */
  enterRuleCombinedFragment?: (ctx: RuleCombinedFragmentContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleCombinedFragment`.
   * @param ctx the parse tree
   */
  exitRuleCombinedFragment?: (ctx: RuleCombinedFragmentContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.ruleOperator`.
   * @param ctx the parse tree
   */
  enterRuleOperator?: (ctx: RuleOperatorContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleOperator`.
   * @param ctx the parse tree
   */
  exitRuleOperator?: (ctx: RuleOperatorContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.ruleOperand`.
   * @param ctx the parse tree
   */
  enterRuleOperand?: (ctx: RuleOperandContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleOperand`.
   * @param ctx the parse tree
   */
  exitRuleOperand?: (ctx: RuleOperandContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.ruleAbstractEnd`.
   * @param ctx the parse tree
   */
  enterRuleAbstractEnd?: (ctx: RuleAbstractEndContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleAbstractEnd`.
   * @param ctx the parse tree
   */
  exitRuleAbstractEnd?: (ctx: RuleAbstractEndContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.ruleMixEnd`.
   * @param ctx the parse tree
   */
  enterRuleMixEnd?: (ctx: RuleMixEndContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleMixEnd`.
   * @param ctx the parse tree
   */
  exitRuleMixEnd?: (ctx: RuleMixEndContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.ruleMixOpAndCFEnd`.
   * @param ctx the parse tree
   */
  enterRuleMixOpAndCFEnd?: (ctx: RuleMixOpAndCFEndContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleMixOpAndCFEnd`.
   * @param ctx the parse tree
   */
  exitRuleMixOpAndCFEnd?: (ctx: RuleMixOpAndCFEndContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.ruleMessageEnd`.
   * @param ctx the parse tree
   */
  enterRuleMessageEnd?: (ctx: RuleMessageEndContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleMessageEnd`.
   * @param ctx the parse tree
   */
  exitRuleMessageEnd?: (ctx: RuleMessageEndContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.ruleExecutionEnd`.
   * @param ctx the parse tree
   */
  enterRuleExecutionEnd?: (ctx: RuleExecutionEndContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleExecutionEnd`.
   * @param ctx the parse tree
   */
  exitRuleExecutionEnd?: (ctx: RuleExecutionEndContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.ruleCombinedFragmentEnd`.
   * @param ctx the parse tree
   */
  enterRuleCombinedFragmentEnd?: (ctx: RuleCombinedFragmentEndContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleCombinedFragmentEnd`.
   * @param ctx the parse tree
   */
  exitRuleCombinedFragmentEnd?: (ctx: RuleCombinedFragmentEndContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.ruleOperandEnd`.
   * @param ctx the parse tree
   */
  enterRuleOperandEnd?: (ctx: RuleOperandEndContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleOperandEnd`.
   * @param ctx the parse tree
   */
  exitRuleOperandEnd?: (ctx: RuleOperandEndContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.ruleDomainModel`.
   * @param ctx the parse tree
   */
  enterRuleDomainModel?: (ctx: RuleDomainModelContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleDomainModel`.
   * @param ctx the parse tree
   */
  exitRuleDomainModel?: (ctx: RuleDomainModelContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.ruleUseCaseModel`.
   * @param ctx the parse tree
   */
  enterRuleUseCaseModel?: (ctx: RuleUseCaseModelContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleUseCaseModel`.
   * @param ctx the parse tree
   */
  exitRuleUseCaseModel?: (ctx: RuleUseCaseModelContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.ruleActor`.
   * @param ctx the parse tree
   */
  enterRuleActor?: (ctx: RuleActorContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleActor`.
   * @param ctx the parse tree
   */
  exitRuleActor?: (ctx: RuleActorContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.ruleUC`.
   * @param ctx the parse tree
   */
  enterRuleUC?: (ctx: RuleUCContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleUC`.
   * @param ctx the parse tree
   */
  exitRuleUC?: (ctx: RuleUCContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.ruleService`.
   * @param ctx the parse tree
   */
  enterRuleService?: (ctx: RuleServiceContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleService`.
   * @param ctx the parse tree
   */
  exitRuleService?: (ctx: RuleServiceContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.ruleParticipant`.
   * @param ctx the parse tree
   */
  enterRuleParticipant?: (ctx: RuleParticipantContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleParticipant`.
   * @param ctx the parse tree
   */
  exitRuleParticipant?: (ctx: RuleParticipantContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.rulePartition`.
   * @param ctx the parse tree
   */
  enterRulePartition?: (ctx: RulePartitionContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.rulePartition`.
   * @param ctx the parse tree
   */
  exitRulePartition?: (ctx: RulePartitionContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.ruleWorkflowExp`.
   * @param ctx the parse tree
   */
  enterRuleWorkflowExp?: (ctx: RuleWorkflowExpContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleWorkflowExp`.
   * @param ctx the parse tree
   */
  exitRuleWorkflowExp?: (ctx: RuleWorkflowExpContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.rulePartitionAction`.
   * @param ctx the parse tree
   */
  enterRulePartitionAction?: (ctx: RulePartitionActionContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.rulePartitionAction`.
   * @param ctx the parse tree
   */
  exitRulePartitionAction?: (ctx: RulePartitionActionContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.ruleActivityFinal`.
   * @param ctx the parse tree
   */
  enterRuleActivityFinal?: (ctx: RuleActivityFinalContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleActivityFinal`.
   * @param ctx the parse tree
   */
  exitRuleActivityFinal?: (ctx: RuleActivityFinalContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.ruleInitalNode`.
   * @param ctx the parse tree
   */
  enterRuleInitalNode?: (ctx: RuleInitalNodeContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleInitalNode`.
   * @param ctx the parse tree
   */
  exitRuleInitalNode?: (ctx: RuleInitalNodeContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.ruleForkNode`.
   * @param ctx the parse tree
   */
  enterRuleForkNode?: (ctx: RuleForkNodeContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleForkNode`.
   * @param ctx the parse tree
   */
  exitRuleForkNode?: (ctx: RuleForkNodeContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.ruleJoinNode`.
   * @param ctx the parse tree
   */
  enterRuleJoinNode?: (ctx: RuleJoinNodeContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleJoinNode`.
   * @param ctx the parse tree
   */
  exitRuleJoinNode?: (ctx: RuleJoinNodeContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.ruleComplexOpeartion`.
   * @param ctx the parse tree
   */
  enterRuleComplexOpeartion?: (ctx: RuleComplexOpeartionContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleComplexOpeartion`.
   * @param ctx the parse tree
   */
  exitRuleComplexOpeartion?: (ctx: RuleComplexOpeartionContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.ruleSimpleOperation`.
   * @param ctx the parse tree
   */
  enterRuleSimpleOperation?: (ctx: RuleSimpleOperationContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleSimpleOperation`.
   * @param ctx the parse tree
   */
  exitRuleSimpleOperation?: (ctx: RuleSimpleOperationContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.ruleLoopExp`.
   * @param ctx the parse tree
   */
  enterRuleLoopExp?: (ctx: RuleLoopExpContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleLoopExp`.
   * @param ctx the parse tree
   */
  exitRuleLoopExp?: (ctx: RuleLoopExpContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.ruleSwitchExp`.
   * @param ctx the parse tree
   */
  enterRuleSwitchExp?: (ctx: RuleSwitchExpContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleSwitchExp`.
   * @param ctx the parse tree
   */
  exitRuleSwitchExp?: (ctx: RuleSwitchExpContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.ruleSwitchCase`.
   * @param ctx the parse tree
   */
  enterRuleSwitchCase?: (ctx: RuleSwitchCaseContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleSwitchCase`.
   * @param ctx the parse tree
   */
  exitRuleSwitchCase?: (ctx: RuleSwitchCaseContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.ruleSwitchDefault`.
   * @param ctx the parse tree
   */
  enterRuleSwitchDefault?: (ctx: RuleSwitchDefaultContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleSwitchDefault`.
   * @param ctx the parse tree
   */
  exitRuleSwitchDefault?: (ctx: RuleSwitchDefaultContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.ruleOperation`.
   * @param ctx the parse tree
   */
  enterRuleOperation?: (ctx: RuleOperationContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleOperation`.
   * @param ctx the parse tree
   */
  exitRuleOperation?: (ctx: RuleOperationContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.ruleOperationName`.
   * @param ctx the parse tree
   */
  enterRuleOperationName?: (ctx: RuleOperationNameContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleOperationName`.
   * @param ctx the parse tree
   */
  exitRuleOperationName?: (ctx: RuleOperationNameContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.ruleParameter`.
   * @param ctx the parse tree
   */
  enterRuleParameter?: (ctx: RuleParameterContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleParameter`.
   * @param ctx the parse tree
   */
  exitRuleParameter?: (ctx: RuleParameterContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.ruleParametersName`.
   * @param ctx the parse tree
   */
  enterRuleParametersName?: (ctx: RuleParametersNameContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleParametersName`.
   * @param ctx the parse tree
   */
  exitRuleParametersName?: (ctx: RuleParametersNameContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.ruleEntity`.
   * @param ctx the parse tree
   */
  enterRuleEntity?: (ctx: RuleEntityContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleEntity`.
   * @param ctx the parse tree
   */
  exitRuleEntity?: (ctx: RuleEntityContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.ruleAttribute`.
   * @param ctx the parse tree
   */
  enterRuleAttribute?: (ctx: RuleAttributeContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleAttribute`.
   * @param ctx the parse tree
   */
  exitRuleAttribute?: (ctx: RuleAttributeContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.ruleReference`.
   * @param ctx the parse tree
   */
  enterRuleReference?: (ctx: RuleReferenceContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleReference`.
   * @param ctx the parse tree
   */
  exitRuleReference?: (ctx: RuleReferenceContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.ruleTypeCS`.
   * @param ctx the parse tree
   */
  enterRuleTypeCS?: (ctx: RuleTypeCSContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleTypeCS`.
   * @param ctx the parse tree
   */
  exitRuleTypeCS?: (ctx: RuleTypeCSContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.ruleInvariance`.
   * @param ctx the parse tree
   */
  enterRuleInvariance?: (ctx: RuleInvarianceContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleInvariance`.
   * @param ctx the parse tree
   */
  exitRuleInvariance?: (ctx: RuleInvarianceContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.ruleEntityType`.
   * @param ctx the parse tree
   */
  enterRuleEntityType?: (ctx: RuleEntityTypeContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleEntityType`.
   * @param ctx the parse tree
   */
  exitRuleEntityType?: (ctx: RuleEntityTypeContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.ruleEnumEntity`.
   * @param ctx the parse tree
   */
  enterRuleEnumEntity?: (ctx: RuleEnumEntityContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleEnumEntity`.
   * @param ctx the parse tree
   */
  exitRuleEnumEntity?: (ctx: RuleEnumEntityContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.ruleEnumItem`.
   * @param ctx the parse tree
   */
  enterRuleEnumItem?: (ctx: RuleEnumItemContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleEnumItem`.
   * @param ctx the parse tree
   */
  exitRuleEnumItem?: (ctx: RuleEnumItemContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.ruleUSECASE_RELATION`.
   * @param ctx the parse tree
   */
  enterRuleUSECASE_RELATION?: (ctx: RuleUSECASE_RELATIONContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleUSECASE_RELATION`.
   * @param ctx the parse tree
   */
  exitRuleUSECASE_RELATION?: (ctx: RuleUSECASE_RELATIONContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.ruleContract`.
   * @param ctx the parse tree
   */
  enterRuleContract?: (ctx: RuleContractContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleContract`.
   * @param ctx the parse tree
   */
  exitRuleContract?: (ctx: RuleContractContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.ruleDefinition`.
   * @param ctx the parse tree
   */
  enterRuleDefinition?: (ctx: RuleDefinitionContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleDefinition`.
   * @param ctx the parse tree
   */
  exitRuleDefinition?: (ctx: RuleDefinitionContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.rulePrecondition`.
   * @param ctx the parse tree
   */
  enterRulePrecondition?: (ctx: RulePreconditionContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.rulePrecondition`.
   * @param ctx the parse tree
   */
  exitRulePrecondition?: (ctx: RulePreconditionContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.rulePostcondition`.
   * @param ctx the parse tree
   */
  enterRulePostcondition?: (ctx: RulePostconditionContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.rulePostcondition`.
   * @param ctx the parse tree
   */
  exitRulePostcondition?: (ctx: RulePostconditionContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.ruleOCLExpressionCS`.
   * @param ctx the parse tree
   */
  enterRuleOCLExpressionCS?: (ctx: RuleOCLExpressionCSContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleOCLExpressionCS`.
   * @param ctx the parse tree
   */
  exitRuleOCLExpressionCS?: (ctx: RuleOCLExpressionCSContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.ruleNestedExpCS`.
   * @param ctx the parse tree
   */
  enterRuleNestedExpCS?: (ctx: RuleNestedExpCSContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleNestedExpCS`.
   * @param ctx the parse tree
   */
  exitRuleNestedExpCS?: (ctx: RuleNestedExpCSContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.ruleLogicFormulaExpCS`.
   * @param ctx the parse tree
   */
  enterRuleLogicFormulaExpCS?: (ctx: RuleLogicFormulaExpCSContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleLogicFormulaExpCS`.
   * @param ctx the parse tree
   */
  exitRuleLogicFormulaExpCS?: (ctx: RuleLogicFormulaExpCSContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.ruleAtomicExpression`.
   * @param ctx the parse tree
   */
  enterRuleAtomicExpression?: (ctx: RuleAtomicExpressionContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleAtomicExpression`.
   * @param ctx the parse tree
   */
  exitRuleAtomicExpression?: (ctx: RuleAtomicExpressionContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.ruleLeftSubAtomicExpression`.
   * @param ctx the parse tree
   */
  enterRuleLeftSubAtomicExpression?: (ctx: RuleLeftSubAtomicExpressionContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleLeftSubAtomicExpression`.
   * @param ctx the parse tree
   */
  exitRuleLeftSubAtomicExpression?: (ctx: RuleLeftSubAtomicExpressionContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.ruleRightSubAtomicExpression`.
   * @param ctx the parse tree
   */
  enterRuleRightSubAtomicExpression?: (ctx: RuleRightSubAtomicExpressionContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleRightSubAtomicExpression`.
   * @param ctx the parse tree
   */
  exitRuleRightSubAtomicExpression?: (ctx: RuleRightSubAtomicExpressionContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.ruleInfixCompareOperatorName`.
   * @param ctx the parse tree
   */
  enterRuleInfixCompareOperatorName?: (ctx: RuleInfixCompareOperatorNameContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleInfixCompareOperatorName`.
   * @param ctx the parse tree
   */
  exitRuleInfixCompareOperatorName?: (ctx: RuleInfixCompareOperatorNameContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.ruleInfixOperatorName`.
   * @param ctx the parse tree
   */
  enterRuleInfixOperatorName?: (ctx: RuleInfixOperatorNameContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleInfixOperatorName`.
   * @param ctx the parse tree
   */
  exitRuleInfixOperatorName?: (ctx: RuleInfixOperatorNameContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.ruleCallExpCS`.
   * @param ctx the parse tree
   */
  enterRuleCallExpCS?: (ctx: RuleCallExpCSContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleCallExpCS`.
   * @param ctx the parse tree
   */
  exitRuleCallExpCS?: (ctx: RuleCallExpCSContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.ruleLoopExpCS`.
   * @param ctx the parse tree
   */
  enterRuleLoopExpCS?: (ctx: RuleLoopExpCSContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleLoopExpCS`.
   * @param ctx the parse tree
   */
  exitRuleLoopExpCS?: (ctx: RuleLoopExpCSContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.ruleIteratorExpCS`.
   * @param ctx the parse tree
   */
  enterRuleIteratorExpCS?: (ctx: RuleIteratorExpCSContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleIteratorExpCS`.
   * @param ctx the parse tree
   */
  exitRuleIteratorExpCS?: (ctx: RuleIteratorExpCSContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.ruleIteratorIdentifier`.
   * @param ctx the parse tree
   */
  enterRuleIteratorIdentifier?: (ctx: RuleIteratorIdentifierContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleIteratorIdentifier`.
   * @param ctx the parse tree
   */
  exitRuleIteratorIdentifier?: (ctx: RuleIteratorIdentifierContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.ruleArgumentsCS`.
   * @param ctx the parse tree
   */
  enterRuleArgumentsCS?: (ctx: RuleArgumentsCSContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleArgumentsCS`.
   * @param ctx the parse tree
   */
  exitRuleArgumentsCS?: (ctx: RuleArgumentsCSContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.ruleFeatureCallExpCS`.
   * @param ctx the parse tree
   */
  enterRuleFeatureCallExpCS?: (ctx: RuleFeatureCallExpCSContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleFeatureCallExpCS`.
   * @param ctx the parse tree
   */
  exitRuleFeatureCallExpCS?: (ctx: RuleFeatureCallExpCSContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.ruleStandardNavigationCallExpCS`.
   * @param ctx the parse tree
   */
  enterRuleStandardNavigationCallExpCS?: (ctx: RuleStandardNavigationCallExpCSContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleStandardNavigationCallExpCS`.
   * @param ctx the parse tree
   */
  exitRuleStandardNavigationCallExpCS?: (ctx: RuleStandardNavigationCallExpCSContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.ruleStandardOperationExpCS`.
   * @param ctx the parse tree
   */
  enterRuleStandardOperationExpCS?: (ctx: RuleStandardOperationExpCSContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleStandardOperationExpCS`.
   * @param ctx the parse tree
   */
  exitRuleStandardOperationExpCS?: (ctx: RuleStandardOperationExpCSContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.rulePredefineOp`.
   * @param ctx the parse tree
   */
  enterRulePredefineOp?: (ctx: RulePredefineOpContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.rulePredefineOp`.
   * @param ctx the parse tree
   */
  exitRulePredefineOp?: (ctx: RulePredefineOpContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.ruleStandardNoneParameterOperation`.
   * @param ctx the parse tree
   */
  enterRuleStandardNoneParameterOperation?: (
    ctx: RuleStandardNoneParameterOperationContext
  ) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleStandardNoneParameterOperation`.
   * @param ctx the parse tree
   */
  exitRuleStandardNoneParameterOperation?: (ctx: RuleStandardNoneParameterOperationContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.ruleStandardParameterOperation`.
   * @param ctx the parse tree
   */
  enterRuleStandardParameterOperation?: (ctx: RuleStandardParameterOperationContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleStandardParameterOperation`.
   * @param ctx the parse tree
   */
  exitRuleStandardParameterOperation?: (ctx: RuleStandardParameterOperationContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.ruleStandardCollectionOperation`.
   * @param ctx the parse tree
   */
  enterRuleStandardCollectionOperation?: (ctx: RuleStandardCollectionOperationContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleStandardCollectionOperation`.
   * @param ctx the parse tree
   */
  exitRuleStandardCollectionOperation?: (ctx: RuleStandardCollectionOperationContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.ruleStandardDateOperation`.
   * @param ctx the parse tree
   */
  enterRuleStandardDateOperation?: (ctx: RuleStandardDateOperationContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleStandardDateOperation`.
   * @param ctx the parse tree
   */
  exitRuleStandardDateOperation?: (ctx: RuleStandardDateOperationContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.ruleClassiferCallExpCS`.
   * @param ctx the parse tree
   */
  enterRuleClassiferCallExpCS?: (ctx: RuleClassiferCallExpCSContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleClassiferCallExpCS`.
   * @param ctx the parse tree
   */
  exitRuleClassiferCallExpCS?: (ctx: RuleClassiferCallExpCSContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.rulePropertyCallExpCS`.
   * @param ctx the parse tree
   */
  enterRulePropertyCallExpCS?: (ctx: RulePropertyCallExpCSContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.rulePropertyCallExpCS`.
   * @param ctx the parse tree
   */
  exitRulePropertyCallExpCS?: (ctx: RulePropertyCallExpCSContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.ruleOperationCallExpCS`.
   * @param ctx the parse tree
   */
  enterRuleOperationCallExpCS?: (ctx: RuleOperationCallExpCSContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleOperationCallExpCS`.
   * @param ctx the parse tree
   */
  exitRuleOperationCallExpCS?: (ctx: RuleOperationCallExpCSContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.ruleOperationParameters`.
   * @param ctx the parse tree
   */
  enterRuleOperationParameters?: (ctx: RuleOperationParametersContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleOperationParameters`.
   * @param ctx the parse tree
   */
  exitRuleOperationParameters?: (ctx: RuleOperationParametersContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.ruleIsMarkedPreCS`.
   * @param ctx the parse tree
   */
  enterRuleIsMarkedPreCS?: (ctx: RuleIsMarkedPreCSContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleIsMarkedPreCS`.
   * @param ctx the parse tree
   */
  exitRuleIsMarkedPreCS?: (ctx: RuleIsMarkedPreCSContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.ruleVariableExpCS`.
   * @param ctx the parse tree
   */
  enterRuleVariableExpCS?: (ctx: RuleVariableExpCSContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleVariableExpCS`.
   * @param ctx the parse tree
   */
  exitRuleVariableExpCS?: (ctx: RuleVariableExpCSContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.ruleSimpleNameCS`.
   * @param ctx the parse tree
   */
  enterRuleSimpleNameCS?: (ctx: RuleSimpleNameCSContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleSimpleNameCS`.
   * @param ctx the parse tree
   */
  exitRuleSimpleNameCS?: (ctx: RuleSimpleNameCSContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.ruleIfExpCS`.
   * @param ctx the parse tree
   */
  enterRuleIfExpCS?: (ctx: RuleIfExpCSContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleIfExpCS`.
   * @param ctx the parse tree
   */
  exitRuleIfExpCS?: (ctx: RuleIfExpCSContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.ruleLetExpCS`.
   * @param ctx the parse tree
   */
  enterRuleLetExpCS?: (ctx: RuleLetExpCSContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleLetExpCS`.
   * @param ctx the parse tree
   */
  exitRuleLetExpCS?: (ctx: RuleLetExpCSContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.ruleVariableDeclarationCS`.
   * @param ctx the parse tree
   */
  enterRuleVariableDeclarationCS?: (ctx: RuleVariableDeclarationCSContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleVariableDeclarationCS`.
   * @param ctx the parse tree
   */
  exitRuleVariableDeclarationCS?: (ctx: RuleVariableDeclarationCSContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.ruleLiteralExpCS`.
   * @param ctx the parse tree
   */
  enterRuleLiteralExpCS?: (ctx: RuleLiteralExpCSContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleLiteralExpCS`.
   * @param ctx the parse tree
   */
  exitRuleLiteralExpCS?: (ctx: RuleLiteralExpCSContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.ruleEnumLiteralExpCS`.
   * @param ctx the parse tree
   */
  enterRuleEnumLiteralExpCS?: (ctx: RuleEnumLiteralExpCSContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleEnumLiteralExpCS`.
   * @param ctx the parse tree
   */
  exitRuleEnumLiteralExpCS?: (ctx: RuleEnumLiteralExpCSContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.ruleTupleLiteralExpCS`.
   * @param ctx the parse tree
   */
  enterRuleTupleLiteralExpCS?: (ctx: RuleTupleLiteralExpCSContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleTupleLiteralExpCS`.
   * @param ctx the parse tree
   */
  exitRuleTupleLiteralExpCS?: (ctx: RuleTupleLiteralExpCSContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.ruleCollectionTypeCS`.
   * @param ctx the parse tree
   */
  enterRuleCollectionTypeCS?: (ctx: RuleCollectionTypeCSContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleCollectionTypeCS`.
   * @param ctx the parse tree
   */
  exitRuleCollectionTypeCS?: (ctx: RuleCollectionTypeCSContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.ruleCollectionLiteralExpCS`.
   * @param ctx the parse tree
   */
  enterRuleCollectionLiteralExpCS?: (ctx: RuleCollectionLiteralExpCSContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleCollectionLiteralExpCS`.
   * @param ctx the parse tree
   */
  exitRuleCollectionLiteralExpCS?: (ctx: RuleCollectionLiteralExpCSContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.ruleCollectionLiteralPartCS`.
   * @param ctx the parse tree
   */
  enterRuleCollectionLiteralPartCS?: (ctx: RuleCollectionLiteralPartCSContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleCollectionLiteralPartCS`.
   * @param ctx the parse tree
   */
  exitRuleCollectionLiteralPartCS?: (ctx: RuleCollectionLiteralPartCSContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.ruleCollectionRangeCS`.
   * @param ctx the parse tree
   */
  enterRuleCollectionRangeCS?: (ctx: RuleCollectionRangeCSContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleCollectionRangeCS`.
   * @param ctx the parse tree
   */
  exitRuleCollectionRangeCS?: (ctx: RuleCollectionRangeCSContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.ruleCollectionItem`.
   * @param ctx the parse tree
   */
  enterRuleCollectionItem?: (ctx: RuleCollectionItemContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleCollectionItem`.
   * @param ctx the parse tree
   */
  exitRuleCollectionItem?: (ctx: RuleCollectionItemContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.rulePrimitiveLiteralExpCS`.
   * @param ctx the parse tree
   */
  enterRulePrimitiveLiteralExpCS?: (ctx: RulePrimitiveLiteralExpCSContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.rulePrimitiveLiteralExpCS`.
   * @param ctx the parse tree
   */
  exitRulePrimitiveLiteralExpCS?: (ctx: RulePrimitiveLiteralExpCSContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.ruleNumberLiteralExpCS`.
   * @param ctx the parse tree
   */
  enterRuleNumberLiteralExpCS?: (ctx: RuleNumberLiteralExpCSContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleNumberLiteralExpCS`.
   * @param ctx the parse tree
   */
  exitRuleNumberLiteralExpCS?: (ctx: RuleNumberLiteralExpCSContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.ruleIntegerLiteralExpCS`.
   * @param ctx the parse tree
   */
  enterRuleIntegerLiteralExpCS?: (ctx: RuleIntegerLiteralExpCSContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleIntegerLiteralExpCS`.
   * @param ctx the parse tree
   */
  exitRuleIntegerLiteralExpCS?: (ctx: RuleIntegerLiteralExpCSContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.ruleRealLiteralExpCS`.
   * @param ctx the parse tree
   */
  enterRuleRealLiteralExpCS?: (ctx: RuleRealLiteralExpCSContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleRealLiteralExpCS`.
   * @param ctx the parse tree
   */
  exitRuleRealLiteralExpCS?: (ctx: RuleRealLiteralExpCSContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.ruleUnlimitedNaturalLiteralExpCS`.
   * @param ctx the parse tree
   */
  enterRuleUnlimitedNaturalLiteralExpCS?: (ctx: RuleUnlimitedNaturalLiteralExpCSContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleUnlimitedNaturalLiteralExpCS`.
   * @param ctx the parse tree
   */
  exitRuleUnlimitedNaturalLiteralExpCS?: (ctx: RuleUnlimitedNaturalLiteralExpCSContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.ruleBooleanLiteralExpCS`.
   * @param ctx the parse tree
   */
  enterRuleBooleanLiteralExpCS?: (ctx: RuleBooleanLiteralExpCSContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleBooleanLiteralExpCS`.
   * @param ctx the parse tree
   */
  exitRuleBooleanLiteralExpCS?: (ctx: RuleBooleanLiteralExpCSContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.ruleStringLiteralExpCS`.
   * @param ctx the parse tree
   */
  enterRuleStringLiteralExpCS?: (ctx: RuleStringLiteralExpCSContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleStringLiteralExpCS`.
   * @param ctx the parse tree
   */
  exitRuleStringLiteralExpCS?: (ctx: RuleStringLiteralExpCSContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.ruleNullLiteralExpCS`.
   * @param ctx the parse tree
   */
  enterRuleNullLiteralExpCS?: (ctx: RuleNullLiteralExpCSContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleNullLiteralExpCS`.
   * @param ctx the parse tree
   */
  exitRuleNullLiteralExpCS?: (ctx: RuleNullLiteralExpCSContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.ruleInvalidLiteralExpCS`.
   * @param ctx the parse tree
   */
  enterRuleInvalidLiteralExpCS?: (ctx: RuleInvalidLiteralExpCSContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleInvalidLiteralExpCS`.
   * @param ctx the parse tree
   */
  exitRuleInvalidLiteralExpCS?: (ctx: RuleInvalidLiteralExpCSContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.ruleFloat`.
   * @param ctx the parse tree
   */
  enterRuleFloat?: (ctx: RuleFloatContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleFloat`.
   * @param ctx the parse tree
   */
  exitRuleFloat?: (ctx: RuleFloatContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.ruleCollectionTypeIdentifierCS`.
   * @param ctx the parse tree
   */
  enterRuleCollectionTypeIdentifierCS?: (ctx: RuleCollectionTypeIdentifierCSContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleCollectionTypeIdentifierCS`.
   * @param ctx the parse tree
   */
  exitRuleCollectionTypeIdentifierCS?: (ctx: RuleCollectionTypeIdentifierCSContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.rulePrimitiveTypeCS`.
   * @param ctx the parse tree
   */
  enterRulePrimitiveTypeCS?: (ctx: RulePrimitiveTypeCSContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.rulePrimitiveTypeCS`.
   * @param ctx the parse tree
   */
  exitRulePrimitiveTypeCS?: (ctx: RulePrimitiveTypeCSContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.ruleOclTypeCS`.
   * @param ctx the parse tree
   */
  enterRuleOclTypeCS?: (ctx: RuleOclTypeCSContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleOclTypeCS`.
   * @param ctx the parse tree
   */
  exitRuleOclTypeCS?: (ctx: RuleOclTypeCSContext) => void;
  /**
   * Enter a parse tree produced by `REMODELParser.ruleAssociationTypeCS`.
   * @param ctx the parse tree
   */
  enterRuleAssociationTypeCS?: (ctx: RuleAssociationTypeCSContext) => void;
  /**
   * Exit a parse tree produced by `REMODELParser.ruleAssociationTypeCS`.
   * @param ctx the parse tree
   */
  exitRuleAssociationTypeCS?: (ctx: RuleAssociationTypeCSContext) => void;
}
