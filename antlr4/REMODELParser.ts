// Generated from REMODEL.g4 by ANTLR 4.13.2
// noinspection ES6UnusedImports,JSUnusedGlobalSymbols,JSUnusedLocalSymbols

import {
  ATN,
  ATNDeserializer,
  DecisionState,
  DFA,
  FailedPredicateException,
  RecognitionException,
  NoViableAltException,
  BailErrorStrategy,
  Parser,
  ParserATNSimulator,
  RuleContext,
  ParserRuleContext,
  PredictionMode,
  PredictionContextCache,
  TerminalNode,
  RuleNode,
  Token,
  TokenStream,
  Interval,
  IntervalSet,
} from 'antlr4';
import REMODELListener from './REMODELListener.js';
import REMODELVisitor from './REMODELVisitor.js';

// for running tests with parameters, TODO: discuss strategy for typed parameters in CI
// eslint-disable-next-line no-unused-vars
type int = number;

export default class REMODELParser extends Parser {
  public static readonly T__0 = 1;
  public static readonly T__1 = 2;
  public static readonly T__2 = 3;
  public static readonly T__3 = 4;
  public static readonly T__4 = 5;
  public static readonly T__5 = 6;
  public static readonly T__6 = 7;
  public static readonly T__7 = 8;
  public static readonly T__8 = 9;
  public static readonly T__9 = 10;
  public static readonly T__10 = 11;
  public static readonly T__11 = 12;
  public static readonly T__12 = 13;
  public static readonly T__13 = 14;
  public static readonly T__14 = 15;
  public static readonly T__15 = 16;
  public static readonly T__16 = 17;
  public static readonly T__17 = 18;
  public static readonly T__18 = 19;
  public static readonly T__19 = 20;
  public static readonly T__20 = 21;
  public static readonly T__21 = 22;
  public static readonly T__22 = 23;
  public static readonly T__23 = 24;
  public static readonly T__24 = 25;
  public static readonly T__25 = 26;
  public static readonly T__26 = 27;
  public static readonly T__27 = 28;
  public static readonly T__28 = 29;
  public static readonly T__29 = 30;
  public static readonly T__30 = 31;
  public static readonly T__31 = 32;
  public static readonly T__32 = 33;
  public static readonly T__33 = 34;
  public static readonly T__34 = 35;
  public static readonly T__35 = 36;
  public static readonly T__36 = 37;
  public static readonly T__37 = 38;
  public static readonly T__38 = 39;
  public static readonly T__39 = 40;
  public static readonly T__40 = 41;
  public static readonly T__41 = 42;
  public static readonly T__42 = 43;
  public static readonly T__43 = 44;
  public static readonly T__44 = 45;
  public static readonly T__45 = 46;
  public static readonly T__46 = 47;
  public static readonly T__47 = 48;
  public static readonly T__48 = 49;
  public static readonly T__49 = 50;
  public static readonly T__50 = 51;
  public static readonly T__51 = 52;
  public static readonly T__52 = 53;
  public static readonly T__53 = 54;
  public static readonly T__54 = 55;
  public static readonly T__55 = 56;
  public static readonly T__56 = 57;
  public static readonly T__57 = 58;
  public static readonly T__58 = 59;
  public static readonly T__59 = 60;
  public static readonly T__60 = 61;
  public static readonly T__61 = 62;
  public static readonly T__62 = 63;
  public static readonly T__63 = 64;
  public static readonly T__64 = 65;
  public static readonly T__65 = 66;
  public static readonly T__66 = 67;
  public static readonly T__67 = 68;
  public static readonly T__68 = 69;
  public static readonly T__69 = 70;
  public static readonly T__70 = 71;
  public static readonly T__71 = 72;
  public static readonly T__72 = 73;
  public static readonly T__73 = 74;
  public static readonly T__74 = 75;
  public static readonly T__75 = 76;
  public static readonly T__76 = 77;
  public static readonly T__77 = 78;
  public static readonly T__78 = 79;
  public static readonly T__79 = 80;
  public static readonly T__80 = 81;
  public static readonly T__81 = 82;
  public static readonly T__82 = 83;
  public static readonly T__83 = 84;
  public static readonly T__84 = 85;
  public static readonly T__85 = 86;
  public static readonly T__86 = 87;
  public static readonly T__87 = 88;
  public static readonly T__88 = 89;
  public static readonly T__89 = 90;
  public static readonly T__90 = 91;
  public static readonly T__91 = 92;
  public static readonly T__92 = 93;
  public static readonly T__93 = 94;
  public static readonly T__94 = 95;
  public static readonly T__95 = 96;
  public static readonly T__96 = 97;
  public static readonly T__97 = 98;
  public static readonly T__98 = 99;
  public static readonly T__99 = 100;
  public static readonly T__100 = 101;
  public static readonly T__101 = 102;
  public static readonly T__102 = 103;
  public static readonly T__103 = 104;
  public static readonly T__104 = 105;
  public static readonly T__105 = 106;
  public static readonly T__106 = 107;
  public static readonly T__107 = 108;
  public static readonly T__108 = 109;
  public static readonly T__109 = 110;
  public static readonly T__110 = 111;
  public static readonly T__111 = 112;
  public static readonly T__112 = 113;
  public static readonly T__113 = 114;
  public static readonly T__114 = 115;
  public static readonly T__115 = 116;
  public static readonly T__116 = 117;
  public static readonly T__117 = 118;
  public static readonly T__118 = 119;
  public static readonly T__119 = 120;
  public static readonly T__120 = 121;
  public static readonly T__121 = 122;
  public static readonly RULE_DOUBLE_QUOTED_STRING = 123;
  public static readonly RULE_SINGLE_QUOTED_STRING = 124;
  public static readonly UNSUPPORTED_OCL_KEYWORD = 125;
  public static readonly RULE_ID = 126;
  public static readonly RULE_INT = 127;
  public static readonly WS = 128;
  public static readonly LINE_COMMENT = 129;
  public static readonly BLOCK_COMMENT = 130;
  public static override readonly EOF = Token.EOF;
  public static readonly RULE_ruleRequirementModel = 0;
  public static readonly RULE_ruleInteraction = 1;
  public static readonly RULE_ruleMessage = 2;
  public static readonly RULE_ruleCallMessage = 3;
  public static readonly RULE_ruleReturnMessage = 4;
  public static readonly RULE_ruleExecution = 5;
  public static readonly RULE_ruleCombinedFragment = 6;
  public static readonly RULE_ruleOperator = 7;
  public static readonly RULE_ruleOperand = 8;
  public static readonly RULE_ruleAbstractEnd = 9;
  public static readonly RULE_ruleMixEnd = 10;
  public static readonly RULE_ruleMixOpAndCFEnd = 11;
  public static readonly RULE_ruleMessageEnd = 12;
  public static readonly RULE_ruleExecutionEnd = 13;
  public static readonly RULE_ruleCombinedFragmentEnd = 14;
  public static readonly RULE_ruleOperandEnd = 15;
  public static readonly RULE_ruleDomainModel = 16;
  public static readonly RULE_ruleUseCaseModel = 17;
  public static readonly RULE_ruleActor = 18;
  public static readonly RULE_ruleUC = 19;
  public static readonly RULE_ruleService = 20;
  public static readonly RULE_ruleParticipant = 21;
  public static readonly RULE_rulePartition = 22;
  public static readonly RULE_ruleWorkflowExp = 23;
  public static readonly RULE_rulePartitionAction = 24;
  public static readonly RULE_ruleActivityFinal = 25;
  public static readonly RULE_ruleInitalNode = 26;
  public static readonly RULE_ruleForkNode = 27;
  public static readonly RULE_ruleJoinNode = 28;
  public static readonly RULE_ruleComplexOpeartion = 29;
  public static readonly RULE_ruleSimpleOperation = 30;
  public static readonly RULE_ruleLoopExp = 31;
  public static readonly RULE_ruleSwitchExp = 32;
  public static readonly RULE_ruleSwitchCase = 33;
  public static readonly RULE_ruleSwitchDefault = 34;
  public static readonly RULE_ruleOperation = 35;
  public static readonly RULE_ruleOperationName = 36;
  public static readonly RULE_ruleParameter = 37;
  public static readonly RULE_ruleParametersName = 38;
  public static readonly RULE_ruleEntity = 39;
  public static readonly RULE_ruleAttribute = 40;
  public static readonly RULE_ruleReference = 41;
  public static readonly RULE_ruleTypeCS = 42;
  public static readonly RULE_ruleInvariance = 43;
  public static readonly RULE_ruleEntityType = 44;
  public static readonly RULE_ruleEnumEntity = 45;
  public static readonly RULE_ruleEnumItem = 46;
  public static readonly RULE_ruleUSECASE_RELATION = 47;
  public static readonly RULE_ruleContract = 48;
  public static readonly RULE_ruleStandaloneContract = 49;
  public static readonly RULE_ruleStandaloneDefinition = 50;
  public static readonly RULE_ruleStandalonePrecondition = 51;
  public static readonly RULE_ruleStandalonePostcondition = 52;
  public static readonly RULE_ruleDefinition = 53;
  public static readonly RULE_rulePrecondition = 54;
  public static readonly RULE_rulePostcondition = 55;
  public static readonly RULE_ruleOCLExpressionCS = 56;
  public static readonly RULE_ruleNestedExpCS = 57;
  public static readonly RULE_ruleLogicFormulaExpCS = 58;
  public static readonly RULE_ruleAtomicExpression = 59;
  public static readonly RULE_ruleLeftSubAtomicExpression = 60;
  public static readonly RULE_ruleRightSubAtomicExpression = 61;
  public static readonly RULE_ruleInfixCompareOperatorName = 62;
  public static readonly RULE_ruleInfixOperatorName = 63;
  public static readonly RULE_ruleCallExpCS = 64;
  public static readonly RULE_ruleLoopExpCS = 65;
  public static readonly RULE_ruleIteratorExpCS = 66;
  public static readonly RULE_ruleIteratorIdentifier = 67;
  public static readonly RULE_ruleArgumentsCS = 68;
  public static readonly RULE_ruleFeatureCallExpCS = 69;
  public static readonly RULE_ruleStandardNavigationCallExpCS = 70;
  public static readonly RULE_ruleStandardOperationExpCS = 71;
  public static readonly RULE_rulePredefineOp = 72;
  public static readonly RULE_ruleStandardNoneParameterOperation = 73;
  public static readonly RULE_ruleStandardParameterOperation = 74;
  public static readonly RULE_ruleStandardCollectionOperation = 75;
  public static readonly RULE_ruleStandardDateOperation = 76;
  public static readonly RULE_ruleClassiferCallExpCS = 77;
  public static readonly RULE_rulePropertyCallExpCS = 78;
  public static readonly RULE_ruleOperationCallExpCS = 79;
  public static readonly RULE_ruleOperationParameters = 80;
  public static readonly RULE_ruleIsMarkedPreCS = 81;
  public static readonly RULE_ruleVariableExpCS = 82;
  public static readonly RULE_ruleSimpleNameCS = 83;
  public static readonly RULE_ruleIfExpCS = 84;
  public static readonly RULE_ruleLetExpCS = 85;
  public static readonly RULE_ruleVariableDeclarationCS = 86;
  public static readonly RULE_ruleLiteralExpCS = 87;
  public static readonly RULE_ruleEnumLiteralExpCS = 88;
  public static readonly RULE_ruleCollectionTypeCS = 89;
  public static readonly RULE_ruleCollectionLiteralExpCS = 90;
  public static readonly RULE_ruleCollectionLiteralPartCS = 91;
  public static readonly RULE_ruleCollectionRangeCS = 92;
  public static readonly RULE_ruleCollectionItem = 93;
  public static readonly RULE_rulePrimitiveLiteralExpCS = 94;
  public static readonly RULE_ruleNumberLiteralExpCS = 95;
  public static readonly RULE_ruleIntegerLiteralExpCS = 96;
  public static readonly RULE_ruleRealLiteralExpCS = 97;
  public static readonly RULE_ruleBooleanLiteralExpCS = 98;
  public static readonly RULE_ruleStringLiteralExpCS = 99;
  public static readonly RULE_ruleNullLiteralExpCS = 100;
  public static readonly RULE_ruleFloat = 101;
  public static readonly RULE_ruleCollectionTypeIdentifierCS = 102;
  public static readonly RULE_rulePrimitiveTypeCS = 103;
  public static readonly RULE_ruleAssociationTypeCS = 104;
  public static readonly literalNames: (string | null)[] = [
    null,
    "'RequirementsModel::'",
    "'@Description('",
    "')'",
    "'Interaction'",
    "'{'",
    "'[Participants:'",
    "']'",
    "'}'",
    "'CallMessage::'",
    "'('",
    "'->'",
    "'ReturnMessage::'",
    "'Execution::'",
    "'CombinedFragment::'",
    "'loop'",
    "'alt'",
    "'option'",
    "'Operand::'",
    "'MessageEnd::'",
    "'ExecutionEnd::'",
    "'CombinedFragmentEnd::'",
    "'OperandEnd::'",
    "'DomainModel'",
    "'UseCaseModel'",
    "'Actor'",
    "'extends'",
    "'UC'",
    "'::'",
    "','",
    "'definedBySSD'",
    "'relatedService'",
    "'Service'",
    "'[Operation]'",
    "'[TempProperty]'",
    "'[WorkFlow]'",
    "'[INV]'",
    "':'",
    "'ActivityFinal'",
    "'ActivityStart'",
    "'ForkNode'",
    "'JoinNode'",
    "'Loop'",
    "'Switch'",
    "'case:'",
    "'default:'",
    "'@AutoCRUD'",
    "'Entity'",
    "'[Refer]'",
    "'*'",
    "'!'",
    "'@-'",
    "'*-'",
    "'inv'",
    "'ASSOCINV'",
    "'['",
    "'|'",
    "'include'",
    "'extend'",
    "'Contract'",
    "'definition'",
    "'precondition'",
    "'postcondition'",
    "'and'",
    "'or'",
    "'>'",
    "'<'",
    "'>='",
    "'<='",
    "'='",
    "'<>'",
    "'/'",
    "'+'",
    "'-'",
    "'one'",
    "'exists'",
    "'select'",
    "'any'",
    "'forAll'",
    "'collect'",
    "'isUnique'",
    "'.'",
    "'oclIsNew()'",
    "'oclIsUndefined()'",
    "'isEmpty()'",
    "'notEmpty()'",
    "'size()'",
    "'sum()'",
    "'oclIsTypeOf'",
    "'includes'",
    "'excludes'",
    "'includesAll'",
    "'excludesAll'",
    "'After'",
    "'Before'",
    "'isAfter'",
    "'isBefore'",
    "'isEqual'",
    "'allInstances()'",
    "'allInstance()'",
    "'@'",
    "'pre'",
    "'self'",
    "'result'",
    "'if'",
    "'then'",
    "'else'",
    "'endif'",
    "'let'",
    "'in'",
    "'..'",
    "'true'",
    "'false'",
    "'null'",
    "'Set'",
    "'Boolean'",
    "'Integer'",
    "'Real'",
    "'String'",
    "'Date'",
    "'Association'",
    "'Aggregation'",
    "'Composition'",
  ];
  public static readonly symbolicNames: (string | null)[] = [
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    'RULE_DOUBLE_QUOTED_STRING',
    'RULE_SINGLE_QUOTED_STRING',
    'UNSUPPORTED_OCL_KEYWORD',
    'RULE_ID',
    'RULE_INT',
    'WS',
    'LINE_COMMENT',
    'BLOCK_COMMENT',
  ];
  // tslint:disable:no-trailing-whitespace
  public static readonly ruleNames: string[] = [
    'ruleRequirementModel',
    'ruleInteraction',
    'ruleMessage',
    'ruleCallMessage',
    'ruleReturnMessage',
    'ruleExecution',
    'ruleCombinedFragment',
    'ruleOperator',
    'ruleOperand',
    'ruleAbstractEnd',
    'ruleMixEnd',
    'ruleMixOpAndCFEnd',
    'ruleMessageEnd',
    'ruleExecutionEnd',
    'ruleCombinedFragmentEnd',
    'ruleOperandEnd',
    'ruleDomainModel',
    'ruleUseCaseModel',
    'ruleActor',
    'ruleUC',
    'ruleService',
    'ruleParticipant',
    'rulePartition',
    'ruleWorkflowExp',
    'rulePartitionAction',
    'ruleActivityFinal',
    'ruleInitalNode',
    'ruleForkNode',
    'ruleJoinNode',
    'ruleComplexOpeartion',
    'ruleSimpleOperation',
    'ruleLoopExp',
    'ruleSwitchExp',
    'ruleSwitchCase',
    'ruleSwitchDefault',
    'ruleOperation',
    'ruleOperationName',
    'ruleParameter',
    'ruleParametersName',
    'ruleEntity',
    'ruleAttribute',
    'ruleReference',
    'ruleTypeCS',
    'ruleInvariance',
    'ruleEntityType',
    'ruleEnumEntity',
    'ruleEnumItem',
    'ruleUSECASE_RELATION',
    'ruleContract',
    'ruleStandaloneContract',
    'ruleStandaloneDefinition',
    'ruleStandalonePrecondition',
    'ruleStandalonePostcondition',
    'ruleDefinition',
    'rulePrecondition',
    'rulePostcondition',
    'ruleOCLExpressionCS',
    'ruleNestedExpCS',
    'ruleLogicFormulaExpCS',
    'ruleAtomicExpression',
    'ruleLeftSubAtomicExpression',
    'ruleRightSubAtomicExpression',
    'ruleInfixCompareOperatorName',
    'ruleInfixOperatorName',
    'ruleCallExpCS',
    'ruleLoopExpCS',
    'ruleIteratorExpCS',
    'ruleIteratorIdentifier',
    'ruleArgumentsCS',
    'ruleFeatureCallExpCS',
    'ruleStandardNavigationCallExpCS',
    'ruleStandardOperationExpCS',
    'rulePredefineOp',
    'ruleStandardNoneParameterOperation',
    'ruleStandardParameterOperation',
    'ruleStandardCollectionOperation',
    'ruleStandardDateOperation',
    'ruleClassiferCallExpCS',
    'rulePropertyCallExpCS',
    'ruleOperationCallExpCS',
    'ruleOperationParameters',
    'ruleIsMarkedPreCS',
    'ruleVariableExpCS',
    'ruleSimpleNameCS',
    'ruleIfExpCS',
    'ruleLetExpCS',
    'ruleVariableDeclarationCS',
    'ruleLiteralExpCS',
    'ruleEnumLiteralExpCS',
    'ruleCollectionTypeCS',
    'ruleCollectionLiteralExpCS',
    'ruleCollectionLiteralPartCS',
    'ruleCollectionRangeCS',
    'ruleCollectionItem',
    'rulePrimitiveLiteralExpCS',
    'ruleNumberLiteralExpCS',
    'ruleIntegerLiteralExpCS',
    'ruleRealLiteralExpCS',
    'ruleBooleanLiteralExpCS',
    'ruleStringLiteralExpCS',
    'ruleNullLiteralExpCS',
    'ruleFloat',
    'ruleCollectionTypeIdentifierCS',
    'rulePrimitiveTypeCS',
    'ruleAssociationTypeCS',
  ];
  public get grammarFileName(): string {
    return 'REMODEL.g4';
  }
  public get literalNames(): (string | null)[] {
    return REMODELParser.literalNames;
  }
  public get symbolicNames(): (string | null)[] {
    return REMODELParser.symbolicNames;
  }
  public get ruleNames(): string[] {
    return REMODELParser.ruleNames;
  }
  public get serializedATN(): number[] {
    return REMODELParser._serializedATN;
  }

  protected createFailedPredicateException(
    predicate?: string,
    message?: string
  ): FailedPredicateException {
    return new FailedPredicateException(this, predicate, message);
  }

  constructor(input: TokenStream) {
    super(input);
    this._interp = new ParserATNSimulator(
      this,
      REMODELParser._ATN,
      REMODELParser.DecisionsToDFA,
      new PredictionContextCache()
    );
  }
  // @RuleVersion(0)
  public ruleRequirementModel(): RuleRequirementModelContext {
    let localctx: RuleRequirementModelContext = new RuleRequirementModelContext(
      this,
      this._ctx,
      this.state
    );
    this.enterRule(localctx, 0, REMODELParser.RULE_ruleRequirementModel);
    let _la: number;
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 212;
        this._errHandler.sync(this);
        _la = this._input.LA(1);
        if (_la === 1) {
          {
            this.state = 210;
            this.match(REMODELParser.T__0);
            this.state = 211;
            this.ruleSimpleNameCS();
          }
        }

        this.state = 217;
        this._errHandler.sync(this);
        _la = this._input.LA(1);
        if (_la === 2) {
          {
            this.state = 214;
            this.match(REMODELParser.T__1);
            this.state = 215;
            this.match(REMODELParser.RULE_DOUBLE_QUOTED_STRING);
            this.state = 216;
            this.match(REMODELParser.T__2);
          }
        }

        this.state = 219;
        this.ruleUseCaseModel();
        this.state = 220;
        this.ruleDomainModel();
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public ruleInteraction(): RuleInteractionContext {
    let localctx: RuleInteractionContext = new RuleInteractionContext(this, this._ctx, this.state);
    this.enterRule(localctx, 2, REMODELParser.RULE_ruleInteraction);
    let _la: number;
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 222;
        this.match(REMODELParser.T__3);
        this.state = 223;
        this.ruleSimpleNameCS();
        this.state = 224;
        this.match(REMODELParser.T__4);
        this.state = 225;
        this.match(REMODELParser.T__5);
        this.state = 229;
        this._errHandler.sync(this);
        _la = this._input.LA(1);
        while (_la === 126) {
          {
            {
              this.state = 226;
              this.match(REMODELParser.RULE_ID);
            }
          }
          this.state = 231;
          this._errHandler.sync(this);
          _la = this._input.LA(1);
        }
        this.state = 232;
        this.match(REMODELParser.T__6);
        this.state = 236;
        this._errHandler.sync(this);
        _la = this._input.LA(1);
        while (_la === 9 || _la === 12) {
          {
            {
              this.state = 233;
              this.ruleMessage();
            }
          }
          this.state = 238;
          this._errHandler.sync(this);
          _la = this._input.LA(1);
        }
        this.state = 242;
        this._errHandler.sync(this);
        _la = this._input.LA(1);
        while (_la === 13) {
          {
            {
              this.state = 239;
              this.ruleExecution();
            }
          }
          this.state = 244;
          this._errHandler.sync(this);
          _la = this._input.LA(1);
        }
        this.state = 248;
        this._errHandler.sync(this);
        _la = this._input.LA(1);
        while (_la === 14) {
          {
            {
              this.state = 245;
              this.ruleCombinedFragment();
            }
          }
          this.state = 250;
          this._errHandler.sync(this);
          _la = this._input.LA(1);
        }
        this.state = 254;
        this._errHandler.sync(this);
        _la = this._input.LA(1);
        while ((_la & ~0x1f) === 0 && ((1 << _la) & 7864320) !== 0) {
          {
            {
              this.state = 251;
              this.ruleAbstractEnd();
            }
          }
          this.state = 256;
          this._errHandler.sync(this);
          _la = this._input.LA(1);
        }
        this.state = 257;
        this.match(REMODELParser.T__7);
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public ruleMessage(): RuleMessageContext {
    let localctx: RuleMessageContext = new RuleMessageContext(this, this._ctx, this.state);
    this.enterRule(localctx, 4, REMODELParser.RULE_ruleMessage);
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 261;
        this._errHandler.sync(this);
        switch (this._input.LA(1)) {
          case 9:
            {
              this.state = 259;
              this.ruleCallMessage();
            }
            break;
          case 12:
            {
              this.state = 260;
              this.ruleReturnMessage();
            }
            break;
          default:
            throw new NoViableAltException(this);
        }
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public ruleCallMessage(): RuleCallMessageContext {
    let localctx: RuleCallMessageContext = new RuleCallMessageContext(this, this._ctx, this.state);
    this.enterRule(localctx, 6, REMODELParser.RULE_ruleCallMessage);
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 263;
        this.match(REMODELParser.T__8);
        this.state = 264;
        this.ruleSimpleNameCS();
        this.state = 265;
        this.match(REMODELParser.T__9);
        this.state = 266;
        this.match(REMODELParser.RULE_ID);
        this.state = 267;
        this.match(REMODELParser.RULE_ID);
        this.state = 268;
        this.match(REMODELParser.T__10);
        this.state = 269;
        this.match(REMODELParser.RULE_ID);
        this.state = 270;
        this.match(REMODELParser.T__2);
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public ruleReturnMessage(): RuleReturnMessageContext {
    let localctx: RuleReturnMessageContext = new RuleReturnMessageContext(
      this,
      this._ctx,
      this.state
    );
    this.enterRule(localctx, 8, REMODELParser.RULE_ruleReturnMessage);
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 272;
        this.match(REMODELParser.T__11);
        this.state = 273;
        this.ruleSimpleNameCS();
        this.state = 274;
        this.match(REMODELParser.T__9);
        this.state = 275;
        this.match(REMODELParser.RULE_ID);
        this.state = 276;
        this.match(REMODELParser.T__10);
        this.state = 277;
        this.match(REMODELParser.RULE_ID);
        this.state = 278;
        this.match(REMODELParser.RULE_ID);
        this.state = 279;
        this.match(REMODELParser.T__2);
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public ruleExecution(): RuleExecutionContext {
    let localctx: RuleExecutionContext = new RuleExecutionContext(this, this._ctx, this.state);
    this.enterRule(localctx, 10, REMODELParser.RULE_ruleExecution);
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 281;
        this.match(REMODELParser.T__12);
        this.state = 282;
        this.ruleSimpleNameCS();
        this.state = 283;
        this.match(REMODELParser.T__9);
        this.state = 284;
        this.match(REMODELParser.RULE_ID);
        this.state = 285;
        this.match(REMODELParser.RULE_ID);
        this.state = 286;
        this.match(REMODELParser.RULE_ID);
        this.state = 287;
        this.match(REMODELParser.T__2);
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public ruleCombinedFragment(): RuleCombinedFragmentContext {
    let localctx: RuleCombinedFragmentContext = new RuleCombinedFragmentContext(
      this,
      this._ctx,
      this.state
    );
    this.enterRule(localctx, 12, REMODELParser.RULE_ruleCombinedFragment);
    let _la: number;
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 289;
        this.match(REMODELParser.T__13);
        this.state = 290;
        this.ruleSimpleNameCS();
        this.state = 291;
        this.match(REMODELParser.T__10);
        this.state = 292;
        this.ruleOperator();
        this.state = 293;
        this.match(REMODELParser.T__4);
        this.state = 294;
        this.match(REMODELParser.T__5);
        this.state = 298;
        this._errHandler.sync(this);
        _la = this._input.LA(1);
        while (_la === 126) {
          {
            {
              this.state = 295;
              this.match(REMODELParser.RULE_ID);
            }
          }
          this.state = 300;
          this._errHandler.sync(this);
          _la = this._input.LA(1);
        }
        this.state = 301;
        this.match(REMODELParser.T__6);
        this.state = 302;
        this.match(REMODELParser.RULE_ID);
        this.state = 303;
        this.match(REMODELParser.T__10);
        this.state = 304;
        this.match(REMODELParser.RULE_ID);
        this.state = 308;
        this._errHandler.sync(this);
        _la = this._input.LA(1);
        while (_la === 18) {
          {
            {
              this.state = 305;
              this.ruleOperand();
            }
          }
          this.state = 310;
          this._errHandler.sync(this);
          _la = this._input.LA(1);
        }
        this.state = 311;
        this.match(REMODELParser.T__7);
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public ruleOperator(): RuleOperatorContext {
    let localctx: RuleOperatorContext = new RuleOperatorContext(this, this._ctx, this.state);
    this.enterRule(localctx, 14, REMODELParser.RULE_ruleOperator);
    let _la: number;
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 313;
        _la = this._input.LA(1);
        if (!((_la & ~0x1f) === 0 && ((1 << _la) & 229376) !== 0)) {
          this._errHandler.recoverInline(this);
        } else {
          this._errHandler.reportMatch(this);
          this.consume();
        }
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public ruleOperand(): RuleOperandContext {
    let localctx: RuleOperandContext = new RuleOperandContext(this, this._ctx, this.state);
    this.enterRule(localctx, 16, REMODELParser.RULE_ruleOperand);
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 315;
        this.match(REMODELParser.T__17);
        this.state = 316;
        this.ruleSimpleNameCS();
        this.state = 317;
        this.match(REMODELParser.T__9);
        this.state = 318;
        this.match(REMODELParser.RULE_ID);
        this.state = 319;
        this.match(REMODELParser.RULE_ID);
        this.state = 320;
        this.match(REMODELParser.T__2);
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public ruleAbstractEnd(): RuleAbstractEndContext {
    let localctx: RuleAbstractEndContext = new RuleAbstractEndContext(this, this._ctx, this.state);
    this.enterRule(localctx, 18, REMODELParser.RULE_ruleAbstractEnd);
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 324;
        this._errHandler.sync(this);
        switch (this._input.LA(1)) {
          case 19:
          case 20:
            {
              this.state = 322;
              this.ruleMixEnd();
            }
            break;
          case 21:
          case 22:
            {
              this.state = 323;
              this.ruleMixOpAndCFEnd();
            }
            break;
          default:
            throw new NoViableAltException(this);
        }
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public ruleMixEnd(): RuleMixEndContext {
    let localctx: RuleMixEndContext = new RuleMixEndContext(this, this._ctx, this.state);
    this.enterRule(localctx, 20, REMODELParser.RULE_ruleMixEnd);
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 328;
        this._errHandler.sync(this);
        switch (this._input.LA(1)) {
          case 20:
            {
              this.state = 326;
              this.ruleExecutionEnd();
            }
            break;
          case 19:
            {
              this.state = 327;
              this.ruleMessageEnd();
            }
            break;
          default:
            throw new NoViableAltException(this);
        }
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public ruleMixOpAndCFEnd(): RuleMixOpAndCFEndContext {
    let localctx: RuleMixOpAndCFEndContext = new RuleMixOpAndCFEndContext(
      this,
      this._ctx,
      this.state
    );
    this.enterRule(localctx, 22, REMODELParser.RULE_ruleMixOpAndCFEnd);
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 332;
        this._errHandler.sync(this);
        switch (this._input.LA(1)) {
          case 21:
            {
              this.state = 330;
              this.ruleCombinedFragmentEnd();
            }
            break;
          case 22:
            {
              this.state = 331;
              this.ruleOperandEnd();
            }
            break;
          default:
            throw new NoViableAltException(this);
        }
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public ruleMessageEnd(): RuleMessageEndContext {
    let localctx: RuleMessageEndContext = new RuleMessageEndContext(this, this._ctx, this.state);
    this.enterRule(localctx, 24, REMODELParser.RULE_ruleMessageEnd);
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 334;
        this.match(REMODELParser.T__18);
        this.state = 335;
        this.ruleSimpleNameCS();
        this.state = 336;
        this.match(REMODELParser.T__9);
        this.state = 337;
        this.match(REMODELParser.RULE_ID);
        this.state = 338;
        this.match(REMODELParser.RULE_ID);
        this.state = 339;
        this.match(REMODELParser.T__2);
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public ruleExecutionEnd(): RuleExecutionEndContext {
    let localctx: RuleExecutionEndContext = new RuleExecutionEndContext(
      this,
      this._ctx,
      this.state
    );
    this.enterRule(localctx, 26, REMODELParser.RULE_ruleExecutionEnd);
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 341;
        this.match(REMODELParser.T__19);
        this.state = 342;
        this.ruleSimpleNameCS();
        this.state = 343;
        this.match(REMODELParser.T__9);
        this.state = 344;
        this.match(REMODELParser.RULE_ID);
        this.state = 345;
        this.match(REMODELParser.RULE_ID);
        this.state = 346;
        this.match(REMODELParser.T__2);
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public ruleCombinedFragmentEnd(): RuleCombinedFragmentEndContext {
    let localctx: RuleCombinedFragmentEndContext = new RuleCombinedFragmentEndContext(
      this,
      this._ctx,
      this.state
    );
    this.enterRule(localctx, 28, REMODELParser.RULE_ruleCombinedFragmentEnd);
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 348;
        this.match(REMODELParser.T__20);
        this.state = 349;
        this.ruleSimpleNameCS();
        this.state = 350;
        this.match(REMODELParser.T__9);
        this.state = 351;
        this.match(REMODELParser.RULE_ID);
        this.state = 352;
        this.match(REMODELParser.T__2);
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public ruleOperandEnd(): RuleOperandEndContext {
    let localctx: RuleOperandEndContext = new RuleOperandEndContext(this, this._ctx, this.state);
    this.enterRule(localctx, 30, REMODELParser.RULE_ruleOperandEnd);
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 354;
        this.match(REMODELParser.T__21);
        this.state = 355;
        this.ruleSimpleNameCS();
        this.state = 356;
        this.match(REMODELParser.T__9);
        this.state = 357;
        this.match(REMODELParser.RULE_ID);
        this.state = 358;
        this.match(REMODELParser.T__2);
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public ruleDomainModel(): RuleDomainModelContext {
    let localctx: RuleDomainModelContext = new RuleDomainModelContext(this, this._ctx, this.state);
    this.enterRule(localctx, 32, REMODELParser.RULE_ruleDomainModel);
    let _la: number;
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 360;
        this.match(REMODELParser.T__22);
        this.state = 361;
        this.ruleSimpleNameCS();
        this.state = 365;
        this._errHandler.sync(this);
        _la = this._input.LA(1);
        if (_la === 10) {
          {
            this.state = 362;
            this.match(REMODELParser.T__9);
            this.state = 363;
            this.match(REMODELParser.RULE_DOUBLE_QUOTED_STRING);
            this.state = 364;
            this.match(REMODELParser.T__2);
          }
        }

        this.state = 367;
        this.match(REMODELParser.T__4);
        this.state = 371;
        this._errHandler.sync(this);
        _la = this._input.LA(1);
        while (_la === 46 || _la === 47) {
          {
            {
              this.state = 368;
              this.ruleEntity();
            }
          }
          this.state = 373;
          this._errHandler.sync(this);
          _la = this._input.LA(1);
        }
        this.state = 374;
        this.match(REMODELParser.T__7);
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public ruleUseCaseModel(): RuleUseCaseModelContext {
    let localctx: RuleUseCaseModelContext = new RuleUseCaseModelContext(
      this,
      this._ctx,
      this.state
    );
    this.enterRule(localctx, 34, REMODELParser.RULE_ruleUseCaseModel);
    let _la: number;
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 376;
        this.match(REMODELParser.T__23);
        this.state = 377;
        this.ruleSimpleNameCS();
        this.state = 381;
        this._errHandler.sync(this);
        _la = this._input.LA(1);
        if (_la === 10) {
          {
            this.state = 378;
            this.match(REMODELParser.T__9);
            this.state = 379;
            this.match(REMODELParser.RULE_DOUBLE_QUOTED_STRING);
            this.state = 380;
            this.match(REMODELParser.T__2);
          }
        }

        this.state = 383;
        this.match(REMODELParser.T__4);
        this.state = 387;
        this._errHandler.sync(this);
        _la = this._input.LA(1);
        while (_la === 27) {
          {
            {
              this.state = 384;
              this.ruleUC();
            }
          }
          this.state = 389;
          this._errHandler.sync(this);
          _la = this._input.LA(1);
        }
        this.state = 393;
        this._errHandler.sync(this);
        _la = this._input.LA(1);
        while (_la === 25) {
          {
            {
              this.state = 390;
              this.ruleActor();
            }
          }
          this.state = 395;
          this._errHandler.sync(this);
          _la = this._input.LA(1);
        }
        this.state = 399;
        this._errHandler.sync(this);
        _la = this._input.LA(1);
        while (_la === 4) {
          {
            {
              this.state = 396;
              this.ruleInteraction();
            }
          }
          this.state = 401;
          this._errHandler.sync(this);
          _la = this._input.LA(1);
        }
        this.state = 405;
        this._errHandler.sync(this);
        _la = this._input.LA(1);
        while (_la === 32) {
          {
            {
              this.state = 402;
              this.ruleService();
            }
          }
          this.state = 407;
          this._errHandler.sync(this);
          _la = this._input.LA(1);
        }
        this.state = 411;
        this._errHandler.sync(this);
        _la = this._input.LA(1);
        while (_la === 59) {
          {
            {
              this.state = 408;
              this.ruleContract();
            }
          }
          this.state = 413;
          this._errHandler.sync(this);
          _la = this._input.LA(1);
        }
        this.state = 414;
        this.match(REMODELParser.T__7);
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public ruleActor(): RuleActorContext {
    let localctx: RuleActorContext = new RuleActorContext(this, this._ctx, this.state);
    this.enterRule(localctx, 36, REMODELParser.RULE_ruleActor);
    let _la: number;
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 416;
        this.match(REMODELParser.T__24);
        this.state = 417;
        this.ruleSimpleNameCS();
        this.state = 421;
        this._errHandler.sync(this);
        _la = this._input.LA(1);
        if (_la === 10) {
          {
            this.state = 418;
            this.match(REMODELParser.T__9);
            this.state = 419;
            this.match(REMODELParser.RULE_DOUBLE_QUOTED_STRING);
            this.state = 420;
            this.match(REMODELParser.T__2);
          }
        }

        this.state = 425;
        this._errHandler.sync(this);
        _la = this._input.LA(1);
        if (_la === 26) {
          {
            this.state = 423;
            this.match(REMODELParser.T__25);
            this.state = 424;
            this.match(REMODELParser.RULE_ID);
          }
        }

        this.state = 427;
        this.match(REMODELParser.T__4);
        this.state = 431;
        this._errHandler.sync(this);
        _la = this._input.LA(1);
        if (_la === 2) {
          {
            this.state = 428;
            this.match(REMODELParser.T__1);
            this.state = 429;
            this.match(REMODELParser.RULE_DOUBLE_QUOTED_STRING);
            this.state = 430;
            this.match(REMODELParser.T__2);
          }
        }

        this.state = 436;
        this._errHandler.sync(this);
        _la = this._input.LA(1);
        while (_la === 126) {
          {
            {
              this.state = 433;
              this.match(REMODELParser.RULE_ID);
            }
          }
          this.state = 438;
          this._errHandler.sync(this);
          _la = this._input.LA(1);
        }
        this.state = 439;
        this.match(REMODELParser.T__7);
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public ruleUC(): RuleUCContext {
    let localctx: RuleUCContext = new RuleUCContext(this, this._ctx, this.state);
    this.enterRule(localctx, 38, REMODELParser.RULE_ruleUC);
    let _la: number;
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 441;
        this.match(REMODELParser.T__26);
        this.state = 442;
        this.match(REMODELParser.T__27);
        this.state = 443;
        this.ruleSimpleNameCS();
        this.state = 445;
        this._errHandler.sync(this);
        _la = this._input.LA(1);
        if (_la === 10) {
          {
            this.state = 444;
            this.match(REMODELParser.T__9);
          }
        }

        this.state = 448;
        this._errHandler.sync(this);
        _la = this._input.LA(1);
        if (_la === 123) {
          {
            this.state = 447;
            this.match(REMODELParser.RULE_DOUBLE_QUOTED_STRING);
          }
        }

        this.state = 451;
        this._errHandler.sync(this);
        _la = this._input.LA(1);
        if (_la === 3) {
          {
            this.state = 450;
            this.match(REMODELParser.T__2);
          }
        }

        this.state = 462;
        this._errHandler.sync(this);
        _la = this._input.LA(1);
        if (_la === 57 || _la === 58) {
          {
            this.state = 453;
            this.ruleUSECASE_RELATION();
            this.state = 454;
            this.match(REMODELParser.RULE_ID);
            this.state = 459;
            this._errHandler.sync(this);
            _la = this._input.LA(1);
            while (_la === 29) {
              {
                {
                  this.state = 455;
                  this.match(REMODELParser.T__28);
                  this.state = 456;
                  this.match(REMODELParser.RULE_ID);
                }
              }
              this.state = 461;
              this._errHandler.sync(this);
              _la = this._input.LA(1);
            }
          }
        }

        this.state = 475;
        this._errHandler.sync(this);
        _la = this._input.LA(1);
        if (_la === 30) {
          {
            this.state = 464;
            this.match(REMODELParser.T__29);
            this.state = 465;
            this.match(REMODELParser.T__9);
            this.state = 466;
            this.match(REMODELParser.RULE_ID);
            this.state = 471;
            this._errHandler.sync(this);
            _la = this._input.LA(1);
            while (_la === 29) {
              {
                {
                  this.state = 467;
                  this.match(REMODELParser.T__28);
                  this.state = 468;
                  this.match(REMODELParser.RULE_ID);
                }
              }
              this.state = 473;
              this._errHandler.sync(this);
              _la = this._input.LA(1);
            }
            this.state = 474;
            this.match(REMODELParser.T__2);
          }
        }

        this.state = 488;
        this._errHandler.sync(this);
        _la = this._input.LA(1);
        if (_la === 31) {
          {
            this.state = 477;
            this.match(REMODELParser.T__30);
            this.state = 478;
            this.match(REMODELParser.T__9);
            this.state = 479;
            this.match(REMODELParser.RULE_ID);
            this.state = 484;
            this._errHandler.sync(this);
            _la = this._input.LA(1);
            while (_la === 29) {
              {
                {
                  this.state = 480;
                  this.match(REMODELParser.T__28);
                  this.state = 481;
                  this.match(REMODELParser.RULE_ID);
                }
              }
              this.state = 486;
              this._errHandler.sync(this);
              _la = this._input.LA(1);
            }
            this.state = 487;
            this.match(REMODELParser.T__2);
          }
        }

        this.state = 493;
        this._errHandler.sync(this);
        _la = this._input.LA(1);
        if (_la === 2) {
          {
            this.state = 490;
            this.match(REMODELParser.T__1);
            this.state = 491;
            this.match(REMODELParser.RULE_DOUBLE_QUOTED_STRING);
            this.state = 492;
            this.match(REMODELParser.T__2);
          }
        }
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public ruleService(): RuleServiceContext {
    let localctx: RuleServiceContext = new RuleServiceContext(this, this._ctx, this.state);
    this.enterRule(localctx, 40, REMODELParser.RULE_ruleService);
    let _la: number;
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 495;
        this.match(REMODELParser.T__31);
        this.state = 496;
        this.ruleSimpleNameCS();
        this.state = 497;
        this.match(REMODELParser.T__4);
        this.state = 501;
        this._errHandler.sync(this);
        _la = this._input.LA(1);
        if (_la === 2) {
          {
            this.state = 498;
            this.match(REMODELParser.T__1);
            this.state = 499;
            this.match(REMODELParser.RULE_DOUBLE_QUOTED_STRING);
            this.state = 500;
            this.match(REMODELParser.T__2);
          }
        }

        this.state = 510;
        this._errHandler.sync(this);
        _la = this._input.LA(1);
        if (_la === 33) {
          {
            this.state = 503;
            this.match(REMODELParser.T__32);
            this.state = 507;
            this._errHandler.sync(this);
            _la = this._input.LA(1);
            while (_la === 126) {
              {
                {
                  this.state = 504;
                  this.ruleOperation();
                }
              }
              this.state = 509;
              this._errHandler.sync(this);
              _la = this._input.LA(1);
            }
          }
        }

        this.state = 519;
        this._errHandler.sync(this);
        _la = this._input.LA(1);
        if (_la === 34) {
          {
            this.state = 512;
            this.match(REMODELParser.T__33);
            this.state = 516;
            this._errHandler.sync(this);
            _la = this._input.LA(1);
            while (_la === 126) {
              {
                {
                  this.state = 513;
                  this.ruleAttribute();
                }
              }
              this.state = 518;
              this._errHandler.sync(this);
              _la = this._input.LA(1);
            }
          }
        }

        this.state = 528;
        this._errHandler.sync(this);
        _la = this._input.LA(1);
        if (_la === 35) {
          {
            this.state = 521;
            this.match(REMODELParser.T__34);
            this.state = 525;
            this._errHandler.sync(this);
            _la = this._input.LA(1);
            while (_la === 126) {
              {
                {
                  this.state = 522;
                  this.match(REMODELParser.RULE_ID);
                }
              }
              this.state = 527;
              this._errHandler.sync(this);
              _la = this._input.LA(1);
            }
          }
        }

        this.state = 537;
        this._errHandler.sync(this);
        _la = this._input.LA(1);
        if (_la === 36) {
          {
            this.state = 530;
            this.match(REMODELParser.T__35);
            this.state = 534;
            this._errHandler.sync(this);
            _la = this._input.LA(1);
            while (_la === 53) {
              {
                {
                  this.state = 531;
                  this.ruleInvariance();
                }
              }
              this.state = 536;
              this._errHandler.sync(this);
              _la = this._input.LA(1);
            }
          }
        }

        this.state = 539;
        this.match(REMODELParser.T__7);
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public ruleParticipant(): RuleParticipantContext {
    let localctx: RuleParticipantContext = new RuleParticipantContext(this, this._ctx, this.state);
    this.enterRule(localctx, 42, REMODELParser.RULE_ruleParticipant);
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 543;
        this._errHandler.sync(this);
        switch (this._input.LA(1)) {
          case 25:
            {
              this.state = 541;
              this.ruleActor();
            }
            break;
          case 32:
            {
              this.state = 542;
              this.ruleService();
            }
            break;
          default:
            throw new NoViableAltException(this);
        }
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public rulePartition(): RulePartitionContext {
    let localctx: RulePartitionContext = new RulePartitionContext(this, this._ctx, this.state);
    this.enterRule(localctx, 44, REMODELParser.RULE_rulePartition);
    let _la: number;
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 545;
        this.match(REMODELParser.RULE_ID);
        this.state = 546;
        this.match(REMODELParser.T__4);
        this.state = 550;
        this._errHandler.sync(this);
        _la = this._input.LA(1);
        while (
          _la === 10 ||
          _la === 11 ||
          (((_la - 38) & ~0x1f) === 0 && ((1 << (_la - 38)) & 55) !== 0) ||
          _la === 126
        ) {
          {
            {
              this.state = 547;
              this.ruleWorkflowExp();
            }
          }
          this.state = 552;
          this._errHandler.sync(this);
          _la = this._input.LA(1);
        }
        this.state = 553;
        this.match(REMODELParser.T__7);
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public ruleWorkflowExp(): RuleWorkflowExpContext {
    let localctx: RuleWorkflowExpContext = new RuleWorkflowExpContext(this, this._ctx, this.state);
    this.enterRule(localctx, 46, REMODELParser.RULE_ruleWorkflowExp);
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 562;
        this._errHandler.sync(this);
        switch (this._input.LA(1)) {
          case 126:
            {
              this.state = 555;
              this.ruleSimpleOperation();
            }
            break;
          case 42:
          case 43:
            {
              this.state = 556;
              this.ruleComplexOpeartion();
            }
            break;
          case 39:
            {
              this.state = 557;
              this.ruleInitalNode();
            }
            break;
          case 38:
            {
              this.state = 558;
              this.ruleActivityFinal();
            }
            break;
          case 40:
            {
              this.state = 559;
              this.ruleForkNode();
            }
            break;
          case 10:
            {
              this.state = 560;
              this.ruleJoinNode();
            }
            break;
          case 11:
            {
              this.state = 561;
              this.rulePartitionAction();
            }
            break;
          default:
            throw new NoViableAltException(this);
        }
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public rulePartitionAction(): RulePartitionActionContext {
    let localctx: RulePartitionActionContext = new RulePartitionActionContext(
      this,
      this._ctx,
      this.state
    );
    this.enterRule(localctx, 48, REMODELParser.RULE_rulePartitionAction);
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 564;
        this.match(REMODELParser.T__10);
        this.state = 565;
        this.match(REMODELParser.RULE_ID);
        this.state = 566;
        this.match(REMODELParser.T__36);
        this.state = 567;
        this.match(REMODELParser.RULE_ID);
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public ruleActivityFinal(): RuleActivityFinalContext {
    let localctx: RuleActivityFinalContext = new RuleActivityFinalContext(
      this,
      this._ctx,
      this.state
    );
    this.enterRule(localctx, 50, REMODELParser.RULE_ruleActivityFinal);
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 569;
        this.match(REMODELParser.T__37);
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public ruleInitalNode(): RuleInitalNodeContext {
    let localctx: RuleInitalNodeContext = new RuleInitalNodeContext(this, this._ctx, this.state);
    this.enterRule(localctx, 52, REMODELParser.RULE_ruleInitalNode);
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 571;
        this.match(REMODELParser.T__38);
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public ruleForkNode(): RuleForkNodeContext {
    let localctx: RuleForkNodeContext = new RuleForkNodeContext(this, this._ctx, this.state);
    this.enterRule(localctx, 54, REMODELParser.RULE_ruleForkNode);
    let _la: number;
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 573;
        this.match(REMODELParser.T__39);
        this.state = 574;
        this.match(REMODELParser.T__10);
        this.state = 575;
        this.match(REMODELParser.T__9);
        this.state = 577;
        this._errHandler.sync(this);
        _la = this._input.LA(1);
        do {
          {
            {
              this.state = 576;
              this.match(REMODELParser.RULE_ID);
            }
          }
          this.state = 579;
          this._errHandler.sync(this);
          _la = this._input.LA(1);
        } while (_la === 126);
        this.state = 581;
        this.match(REMODELParser.T__2);
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public ruleJoinNode(): RuleJoinNodeContext {
    let localctx: RuleJoinNodeContext = new RuleJoinNodeContext(this, this._ctx, this.state);
    this.enterRule(localctx, 56, REMODELParser.RULE_ruleJoinNode);
    let _la: number;
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 583;
        this.match(REMODELParser.T__9);
        this.state = 585;
        this._errHandler.sync(this);
        _la = this._input.LA(1);
        do {
          {
            {
              this.state = 584;
              this.match(REMODELParser.RULE_ID);
            }
          }
          this.state = 587;
          this._errHandler.sync(this);
          _la = this._input.LA(1);
        } while (_la === 126);
        this.state = 589;
        this.match(REMODELParser.T__2);
        this.state = 590;
        this.match(REMODELParser.T__10);
        this.state = 591;
        this.match(REMODELParser.T__40);
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public ruleComplexOpeartion(): RuleComplexOpeartionContext {
    let localctx: RuleComplexOpeartionContext = new RuleComplexOpeartionContext(
      this,
      this._ctx,
      this.state
    );
    this.enterRule(localctx, 58, REMODELParser.RULE_ruleComplexOpeartion);
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 595;
        this._errHandler.sync(this);
        switch (this._input.LA(1)) {
          case 42:
            {
              this.state = 593;
              this.ruleLoopExp();
            }
            break;
          case 43:
            {
              this.state = 594;
              this.ruleSwitchExp();
            }
            break;
          default:
            throw new NoViableAltException(this);
        }
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public ruleSimpleOperation(): RuleSimpleOperationContext {
    let localctx: RuleSimpleOperationContext = new RuleSimpleOperationContext(
      this,
      this._ctx,
      this.state
    );
    this.enterRule(localctx, 60, REMODELParser.RULE_ruleSimpleOperation);
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 597;
        this.match(REMODELParser.RULE_ID);
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public ruleLoopExp(): RuleLoopExpContext {
    let localctx: RuleLoopExpContext = new RuleLoopExpContext(this, this._ctx, this.state);
    this.enterRule(localctx, 62, REMODELParser.RULE_ruleLoopExp);
    let _la: number;
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 599;
        this.match(REMODELParser.T__41);
        this.state = 600;
        this.match(REMODELParser.T__10);
        this.state = 601;
        this.ruleSimpleNameCS();
        this.state = 602;
        this.match(REMODELParser.T__4);
        this.state = 606;
        this._errHandler.sync(this);
        _la = this._input.LA(1);
        while (
          _la === 10 ||
          _la === 11 ||
          (((_la - 38) & ~0x1f) === 0 && ((1 << (_la - 38)) & 55) !== 0) ||
          _la === 126
        ) {
          {
            {
              this.state = 603;
              this.ruleWorkflowExp();
            }
          }
          this.state = 608;
          this._errHandler.sync(this);
          _la = this._input.LA(1);
        }
        this.state = 609;
        this.match(REMODELParser.T__7);
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public ruleSwitchExp(): RuleSwitchExpContext {
    let localctx: RuleSwitchExpContext = new RuleSwitchExpContext(this, this._ctx, this.state);
    this.enterRule(localctx, 64, REMODELParser.RULE_ruleSwitchExp);
    let _la: number;
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 611;
        this.match(REMODELParser.T__42);
        this.state = 612;
        this.match(REMODELParser.T__10);
        this.state = 613;
        this.ruleSimpleNameCS();
        this.state = 614;
        this.match(REMODELParser.T__4);
        this.state = 618;
        this._errHandler.sync(this);
        _la = this._input.LA(1);
        while (_la === 44) {
          {
            {
              this.state = 615;
              this.ruleSwitchCase();
            }
          }
          this.state = 620;
          this._errHandler.sync(this);
          _la = this._input.LA(1);
        }
        this.state = 622;
        this._errHandler.sync(this);
        _la = this._input.LA(1);
        if (_la === 45) {
          {
            this.state = 621;
            this.ruleSwitchDefault();
          }
        }

        this.state = 624;
        this.match(REMODELParser.T__7);
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public ruleSwitchCase(): RuleSwitchCaseContext {
    let localctx: RuleSwitchCaseContext = new RuleSwitchCaseContext(this, this._ctx, this.state);
    this.enterRule(localctx, 66, REMODELParser.RULE_ruleSwitchCase);
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 626;
        this.match(REMODELParser.T__43);
        this.state = 627;
        this.ruleSimpleNameCS();
        this.state = 628;
        this.match(REMODELParser.T__10);
        this.state = 629;
        this.ruleSimpleOperation();
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public ruleSwitchDefault(): RuleSwitchDefaultContext {
    let localctx: RuleSwitchDefaultContext = new RuleSwitchDefaultContext(
      this,
      this._ctx,
      this.state
    );
    this.enterRule(localctx, 68, REMODELParser.RULE_ruleSwitchDefault);
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 631;
        this.match(REMODELParser.T__44);
        this.state = 632;
        this.ruleSimpleOperation();
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public ruleOperation(): RuleOperationContext {
    let localctx: RuleOperationContext = new RuleOperationContext(this, this._ctx, this.state);
    this.enterRule(localctx, 70, REMODELParser.RULE_ruleOperation);
    let _la: number;
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 634;
        this.ruleOperationName();
        this.state = 635;
        this.match(REMODELParser.T__9);
        this.state = 637;
        this._errHandler.sync(this);
        _la = this._input.LA(1);
        if (_la === 126) {
          {
            this.state = 636;
            this.ruleParameter();
          }
        }

        this.state = 643;
        this._errHandler.sync(this);
        _la = this._input.LA(1);
        while (_la === 29) {
          {
            {
              this.state = 639;
              this.match(REMODELParser.T__28);
              this.state = 640;
              this.ruleParameter();
            }
          }
          this.state = 645;
          this._errHandler.sync(this);
          _la = this._input.LA(1);
        }
        this.state = 646;
        this.match(REMODELParser.T__2);
        this.state = 649;
        this._errHandler.sync(this);
        _la = this._input.LA(1);
        if (_la === 37) {
          {
            this.state = 647;
            this.match(REMODELParser.T__36);
            this.state = 648;
            this.ruleTypeCS();
          }
        }
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public ruleOperationName(): RuleOperationNameContext {
    let localctx: RuleOperationNameContext = new RuleOperationNameContext(
      this,
      this._ctx,
      this.state
    );
    this.enterRule(localctx, 72, REMODELParser.RULE_ruleOperationName);
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 651;
        this.ruleSimpleNameCS();
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public ruleParameter(): RuleParameterContext {
    let localctx: RuleParameterContext = new RuleParameterContext(this, this._ctx, this.state);
    this.enterRule(localctx, 74, REMODELParser.RULE_ruleParameter);
    let _la: number;
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 653;
        this.ruleParametersName();
        this.state = 656;
        this._errHandler.sync(this);
        _la = this._input.LA(1);
        if (_la === 37) {
          {
            this.state = 654;
            this.match(REMODELParser.T__36);
            this.state = 655;
            this.ruleTypeCS();
          }
        }
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public ruleParametersName(): RuleParametersNameContext {
    let localctx: RuleParametersNameContext = new RuleParametersNameContext(
      this,
      this._ctx,
      this.state
    );
    this.enterRule(localctx, 76, REMODELParser.RULE_ruleParametersName);
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 658;
        this.ruleSimpleNameCS();
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public ruleEntity(): RuleEntityContext {
    let localctx: RuleEntityContext = new RuleEntityContext(this, this._ctx, this.state);
    this.enterRule(localctx, 78, REMODELParser.RULE_ruleEntity);
    let _la: number;
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 661;
        this._errHandler.sync(this);
        _la = this._input.LA(1);
        if (_la === 46) {
          {
            this.state = 660;
            this.match(REMODELParser.T__45);
          }
        }

        this.state = 663;
        this.match(REMODELParser.T__46);
        this.state = 664;
        this.ruleSimpleNameCS();
        this.state = 667;
        this._errHandler.sync(this);
        _la = this._input.LA(1);
        if (_la === 26) {
          {
            this.state = 665;
            this.match(REMODELParser.T__25);
            this.state = 666;
            this.match(REMODELParser.RULE_ID);
          }
        }

        this.state = 669;
        this.match(REMODELParser.T__4);
        this.state = 673;
        this._errHandler.sync(this);
        _la = this._input.LA(1);
        if (_la === 2) {
          {
            this.state = 670;
            this.match(REMODELParser.T__1);
            this.state = 671;
            this.match(REMODELParser.RULE_DOUBLE_QUOTED_STRING);
            this.state = 672;
            this.match(REMODELParser.T__2);
          }
        }

        this.state = 678;
        this._errHandler.sync(this);
        _la = this._input.LA(1);
        while (_la === 126) {
          {
            {
              this.state = 675;
              this.ruleAttribute();
            }
          }
          this.state = 680;
          this._errHandler.sync(this);
          _la = this._input.LA(1);
        }
        this.state = 688;
        this._errHandler.sync(this);
        _la = this._input.LA(1);
        if (_la === 48) {
          {
            this.state = 681;
            this.match(REMODELParser.T__47);
            this.state = 685;
            this._errHandler.sync(this);
            _la = this._input.LA(1);
            while (_la === 126) {
              {
                {
                  this.state = 682;
                  this.ruleReference();
                }
              }
              this.state = 687;
              this._errHandler.sync(this);
              _la = this._input.LA(1);
            }
          }
        }

        this.state = 697;
        this._errHandler.sync(this);
        _la = this._input.LA(1);
        if (_la === 36) {
          {
            this.state = 690;
            this.match(REMODELParser.T__35);
            this.state = 694;
            this._errHandler.sync(this);
            _la = this._input.LA(1);
            while (_la === 53) {
              {
                {
                  this.state = 691;
                  this.ruleInvariance();
                }
              }
              this.state = 696;
              this._errHandler.sync(this);
              _la = this._input.LA(1);
            }
          }
        }

        this.state = 699;
        this.match(REMODELParser.T__7);
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public ruleAttribute(): RuleAttributeContext {
    let localctx: RuleAttributeContext = new RuleAttributeContext(this, this._ctx, this.state);
    this.enterRule(localctx, 80, REMODELParser.RULE_ruleAttribute);
    let _la: number;
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 701;
        this.ruleSimpleNameCS();
        this.state = 702;
        this.match(REMODELParser.T__36);
        this.state = 703;
        this.ruleTypeCS();
        this.state = 705;
        this._errHandler.sync(this);
        _la = this._input.LA(1);
        if (_la === 49) {
          {
            this.state = 704;
            this.match(REMODELParser.T__48);
          }
        }
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public ruleReference(): RuleReferenceContext {
    let localctx: RuleReferenceContext = new RuleReferenceContext(this, this._ctx, this.state);
    this.enterRule(localctx, 82, REMODELParser.RULE_ruleReference);
    let _la: number;
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 707;
        this.ruleSimpleNameCS();
        this.state = 708;
        this.match(REMODELParser.T__36);
        this.state = 709;
        this.match(REMODELParser.RULE_ID);
        this.state = 711;
        this._errHandler.sync(this);
        _la = this._input.LA(1);
        if (_la === 49) {
          {
            this.state = 710;
            this.match(REMODELParser.T__48);
          }
        }

        this.state = 714;
        this._errHandler.sync(this);
        _la = this._input.LA(1);
        if (_la === 50) {
          {
            this.state = 713;
            this.match(REMODELParser.T__49);
          }
        }

        this.state = 717;
        this._errHandler.sync(this);
        _la = this._input.LA(1);
        if (_la === 51) {
          {
            this.state = 716;
            this.match(REMODELParser.T__50);
          }
        }

        this.state = 720;
        this._errHandler.sync(this);
        _la = this._input.LA(1);
        if (_la === 52) {
          {
            this.state = 719;
            this.match(REMODELParser.T__51);
          }
        }

        this.state = 722;
        this.ruleAssociationTypeCS();
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public ruleTypeCS(): RuleTypeCSContext {
    let localctx: RuleTypeCSContext = new RuleTypeCSContext(this, this._ctx, this.state);
    this.enterRule(localctx, 84, REMODELParser.RULE_ruleTypeCS);
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 728;
        this._errHandler.sync(this);
        switch (this._interp.adaptivePredict(this._input, 70, this._ctx)) {
          case 1:
            {
              this.state = 724;
              this.ruleEntityType();
            }
            break;
          case 2:
            {
              this.state = 725;
              this.rulePrimitiveTypeCS();
            }
            break;
          case 3:
            {
              this.state = 726;
              this.ruleEnumEntity();
            }
            break;
          case 4:
            {
              this.state = 727;
              this.ruleCollectionTypeCS();
            }
            break;
        }
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public ruleInvariance(): RuleInvarianceContext {
    let localctx: RuleInvarianceContext = new RuleInvarianceContext(this, this._ctx, this.state);
    this.enterRule(localctx, 86, REMODELParser.RULE_ruleInvariance);
    let _la: number;
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 730;
        this.match(REMODELParser.T__52);
        this.state = 731;
        this.ruleSimpleNameCS();
        this.state = 732;
        this.match(REMODELParser.T__36);
        this.state = 738;
        this._errHandler.sync(this);
        switch (this._input.LA(1)) {
          case 5:
            {
              this.state = 733;
              this.match(REMODELParser.T__4);
              this.state = 734;
              this.ruleOCLExpressionCS();
              this.state = 735;
              this.match(REMODELParser.T__7);
            }
            break;
          case 10:
          case 102:
          case 103:
          case 104:
          case 108:
          case 111:
          case 112:
          case 113:
          case 114:
          case 123:
          case 124:
          case 126:
          case 127:
            {
              this.state = 737;
              this.ruleOCLExpressionCS();
            }
            break;
          default:
            throw new NoViableAltException(this);
        }
        this.state = 741;
        this._errHandler.sync(this);
        _la = this._input.LA(1);
        if (_la === 54) {
          {
            this.state = 740;
            this.match(REMODELParser.T__53);
          }
        }
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public ruleEntityType(): RuleEntityTypeContext {
    let localctx: RuleEntityTypeContext = new RuleEntityTypeContext(this, this._ctx, this.state);
    this.enterRule(localctx, 88, REMODELParser.RULE_ruleEntityType);
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 743;
        this.match(REMODELParser.RULE_ID);
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public ruleEnumEntity(): RuleEnumEntityContext {
    let localctx: RuleEnumEntityContext = new RuleEnumEntityContext(this, this._ctx, this.state);
    this.enterRule(localctx, 90, REMODELParser.RULE_ruleEnumEntity);
    let _la: number;
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 745;
        this.ruleSimpleNameCS();
        this.state = 746;
        this.match(REMODELParser.T__54);
        this.state = 747;
        this.ruleEnumItem();
        this.state = 752;
        this._errHandler.sync(this);
        _la = this._input.LA(1);
        while (_la === 56) {
          {
            {
              this.state = 748;
              this.match(REMODELParser.T__55);
              this.state = 749;
              this.ruleEnumItem();
            }
          }
          this.state = 754;
          this._errHandler.sync(this);
          _la = this._input.LA(1);
        }
        this.state = 755;
        this.match(REMODELParser.T__6);
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public ruleEnumItem(): RuleEnumItemContext {
    let localctx: RuleEnumItemContext = new RuleEnumItemContext(this, this._ctx, this.state);
    this.enterRule(localctx, 92, REMODELParser.RULE_ruleEnumItem);
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 757;
        this.match(REMODELParser.RULE_ID);
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public ruleUSECASE_RELATION(): RuleUSECASE_RELATIONContext {
    let localctx: RuleUSECASE_RELATIONContext = new RuleUSECASE_RELATIONContext(
      this,
      this._ctx,
      this.state
    );
    this.enterRule(localctx, 94, REMODELParser.RULE_ruleUSECASE_RELATION);
    let _la: number;
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 759;
        _la = this._input.LA(1);
        if (!(_la === 57 || _la === 58)) {
          this._errHandler.recoverInline(this);
        } else {
          this._errHandler.reportMatch(this);
          this.consume();
        }
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public ruleContract(): RuleContractContext {
    let localctx: RuleContractContext = new RuleContractContext(this, this._ctx, this.state);
    this.enterRule(localctx, 96, REMODELParser.RULE_ruleContract);
    let _la: number;
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 761;
        this.match(REMODELParser.T__58);
        this.state = 762;
        this.match(REMODELParser.RULE_ID);
        this.state = 763;
        this.match(REMODELParser.T__27);
        this.state = 764;
        this.ruleOperation();
        this.state = 765;
        this.match(REMODELParser.T__4);
        this.state = 767;
        this._errHandler.sync(this);
        _la = this._input.LA(1);
        if (_la === 60) {
          {
            this.state = 766;
            this.ruleDefinition();
          }
        }

        this.state = 769;
        this.rulePrecondition();
        this.state = 770;
        this.rulePostcondition();
        this.state = 771;
        this.match(REMODELParser.T__7);
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public ruleStandaloneContract(): RuleStandaloneContractContext {
    let localctx: RuleStandaloneContractContext = new RuleStandaloneContractContext(
      this,
      this._ctx,
      this.state
    );
    this.enterRule(localctx, 98, REMODELParser.RULE_ruleStandaloneContract);
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 773;
        this.ruleContract();
        this.state = 774;
        this.match(REMODELParser.EOF);
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public ruleStandaloneDefinition(): RuleStandaloneDefinitionContext {
    let localctx: RuleStandaloneDefinitionContext = new RuleStandaloneDefinitionContext(
      this,
      this._ctx,
      this.state
    );
    this.enterRule(localctx, 100, REMODELParser.RULE_ruleStandaloneDefinition);
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 776;
        this.ruleDefinition();
        this.state = 777;
        this.match(REMODELParser.EOF);
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public ruleStandalonePrecondition(): RuleStandalonePreconditionContext {
    let localctx: RuleStandalonePreconditionContext = new RuleStandalonePreconditionContext(
      this,
      this._ctx,
      this.state
    );
    this.enterRule(localctx, 102, REMODELParser.RULE_ruleStandalonePrecondition);
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 779;
        this.rulePrecondition();
        this.state = 780;
        this.match(REMODELParser.EOF);
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public ruleStandalonePostcondition(): RuleStandalonePostconditionContext {
    let localctx: RuleStandalonePostconditionContext = new RuleStandalonePostconditionContext(
      this,
      this._ctx,
      this.state
    );
    this.enterRule(localctx, 104, REMODELParser.RULE_ruleStandalonePostcondition);
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 782;
        this.rulePostcondition();
        this.state = 783;
        this.match(REMODELParser.EOF);
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public ruleDefinition(): RuleDefinitionContext {
    let localctx: RuleDefinitionContext = new RuleDefinitionContext(this, this._ctx, this.state);
    this.enterRule(localctx, 106, REMODELParser.RULE_ruleDefinition);
    let _la: number;
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 785;
        this.match(REMODELParser.T__59);
        this.state = 786;
        this.match(REMODELParser.T__36);
        this.state = 787;
        this.ruleVariableDeclarationCS();
        this.state = 792;
        this._errHandler.sync(this);
        _la = this._input.LA(1);
        while (_la === 29) {
          {
            {
              this.state = 788;
              this.match(REMODELParser.T__28);
              this.state = 789;
              this.ruleVariableDeclarationCS();
            }
          }
          this.state = 794;
          this._errHandler.sync(this);
          _la = this._input.LA(1);
        }
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public rulePrecondition(): RulePreconditionContext {
    let localctx: RulePreconditionContext = new RulePreconditionContext(
      this,
      this._ctx,
      this.state
    );
    this.enterRule(localctx, 108, REMODELParser.RULE_rulePrecondition);
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 795;
        this.match(REMODELParser.T__60);
        this.state = 796;
        this.match(REMODELParser.T__36);
        this.state = 802;
        this._errHandler.sync(this);
        switch (this._input.LA(1)) {
          case 10:
          case 102:
          case 103:
          case 104:
          case 108:
          case 111:
          case 112:
          case 113:
          case 114:
          case 123:
          case 124:
          case 126:
          case 127:
            {
              this.state = 797;
              this.ruleOCLExpressionCS();
            }
            break;
          case 5:
            {
              this.state = 798;
              this.match(REMODELParser.T__4);
              this.state = 799;
              this.ruleOCLExpressionCS();
              this.state = 800;
              this.match(REMODELParser.T__7);
            }
            break;
          default:
            throw new NoViableAltException(this);
        }
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public rulePostcondition(): RulePostconditionContext {
    let localctx: RulePostconditionContext = new RulePostconditionContext(
      this,
      this._ctx,
      this.state
    );
    this.enterRule(localctx, 110, REMODELParser.RULE_rulePostcondition);
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 804;
        this.match(REMODELParser.T__61);
        this.state = 805;
        this.match(REMODELParser.T__36);
        this.state = 811;
        this._errHandler.sync(this);
        switch (this._input.LA(1)) {
          case 10:
          case 102:
          case 103:
          case 104:
          case 108:
          case 111:
          case 112:
          case 113:
          case 114:
          case 123:
          case 124:
          case 126:
          case 127:
            {
              this.state = 806;
              this.ruleOCLExpressionCS();
            }
            break;
          case 5:
            {
              this.state = 807;
              this.match(REMODELParser.T__4);
              this.state = 808;
              this.ruleOCLExpressionCS();
              this.state = 809;
              this.match(REMODELParser.T__7);
            }
            break;
          default:
            throw new NoViableAltException(this);
        }
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public ruleOCLExpressionCS(): RuleOCLExpressionCSContext {
    let localctx: RuleOCLExpressionCSContext = new RuleOCLExpressionCSContext(
      this,
      this._ctx,
      this.state
    );
    this.enterRule(localctx, 112, REMODELParser.RULE_ruleOCLExpressionCS);
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 818;
        this._errHandler.sync(this);
        switch (this._interp.adaptivePredict(this._input, 78, this._ctx)) {
          case 1:
            {
              this.state = 813;
              this.ruleLiteralExpCS();
            }
            break;
          case 2:
            {
              this.state = 814;
              this.ruleLetExpCS();
            }
            break;
          case 3:
            {
              this.state = 815;
              this.ruleIfExpCS();
            }
            break;
          case 4:
            {
              this.state = 816;
              this.ruleLogicFormulaExpCS();
            }
            break;
          case 5:
            {
              this.state = 817;
              this.ruleNestedExpCS();
            }
            break;
        }
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public ruleNestedExpCS(): RuleNestedExpCSContext {
    let localctx: RuleNestedExpCSContext = new RuleNestedExpCSContext(this, this._ctx, this.state);
    this.enterRule(localctx, 114, REMODELParser.RULE_ruleNestedExpCS);
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 820;
        this.match(REMODELParser.T__9);
        this.state = 821;
        this.ruleOCLExpressionCS();
        this.state = 822;
        this.match(REMODELParser.T__2);
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public ruleLogicFormulaExpCS(): RuleLogicFormulaExpCSContext {
    let localctx: RuleLogicFormulaExpCSContext = new RuleLogicFormulaExpCSContext(
      this,
      this._ctx,
      this.state
    );
    this.enterRule(localctx, 116, REMODELParser.RULE_ruleLogicFormulaExpCS);
    let _la: number;
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 824;
        this.ruleAtomicExpression();
        this.state = 845;
        this._errHandler.sync(this);
        switch (this._input.LA(1)) {
          case 63:
            {
              this.state = 831;
              this._errHandler.sync(this);
              _la = this._input.LA(1);
              do {
                {
                  {
                    this.state = 825;
                    this.match(REMODELParser.T__62);
                    this.state = 829;
                    this._errHandler.sync(this);
                    switch (this._input.LA(1)) {
                      case 102:
                      case 103:
                      case 126:
                        {
                          this.state = 826;
                          this.ruleAtomicExpression();
                        }
                        break;
                      case 104:
                        {
                          this.state = 827;
                          this.ruleIfExpCS();
                        }
                        break;
                      case 10:
                        {
                          this.state = 828;
                          this.ruleNestedExpCS();
                        }
                        break;
                      default:
                        throw new NoViableAltException(this);
                    }
                  }
                }
                this.state = 833;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
              } while (_la === 63);
            }
            break;
          case 64:
            {
              this.state = 841;
              this._errHandler.sync(this);
              _la = this._input.LA(1);
              do {
                {
                  {
                    this.state = 835;
                    this.match(REMODELParser.T__63);
                    this.state = 839;
                    this._errHandler.sync(this);
                    switch (this._input.LA(1)) {
                      case 102:
                      case 103:
                      case 126:
                        {
                          this.state = 836;
                          this.ruleAtomicExpression();
                        }
                        break;
                      case 104:
                        {
                          this.state = 837;
                          this.ruleIfExpCS();
                        }
                        break;
                      case 10:
                        {
                          this.state = 838;
                          this.ruleNestedExpCS();
                        }
                        break;
                      default:
                        throw new NoViableAltException(this);
                    }
                  }
                }
                this.state = 843;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
              } while (_la === 64);
            }
            break;
          case -1:
          case 3:
          case 8:
          case 29:
          case 53:
          case 54:
          case 56:
          case 61:
          case 62:
          case 105:
          case 106:
          case 107:
          case 109:
          case 110:
            break;
          default:
            break;
        }
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public ruleAtomicExpression(): RuleAtomicExpressionContext {
    let localctx: RuleAtomicExpressionContext = new RuleAtomicExpressionContext(
      this,
      this._ctx,
      this.state
    );
    this.enterRule(localctx, 118, REMODELParser.RULE_ruleAtomicExpression);
    let _la: number;
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 847;
        this.ruleLeftSubAtomicExpression();
        this.state = 857;
        this._errHandler.sync(this);
        _la = this._input.LA(1);
        if (((_la - 65) & ~0x1f) === 0 && ((1 << (_la - 65)) & 63) !== 0) {
          {
            this.state = 848;
            this.ruleInfixCompareOperatorName();
            this.state = 849;
            this.ruleRightSubAtomicExpression();
            this.state = 855;
            this._errHandler.sync(this);
            _la = this._input.LA(1);
            if (((_la - 49) & ~0x1f) === 0 && ((1 << (_la - 49)) & 29360129) !== 0) {
              {
                this.state = 850;
                this.ruleInfixOperatorName();
                this.state = 853;
                this._errHandler.sync(this);
                switch (this._input.LA(1)) {
                  case 111:
                  case 112:
                  case 113:
                  case 123:
                  case 124:
                  case 127:
                    {
                      this.state = 851;
                      this.rulePrimitiveLiteralExpCS();
                    }
                    break;
                  case 102:
                  case 103:
                  case 126:
                    {
                      this.state = 852;
                      this.ruleAtomicExpression();
                    }
                    break;
                  default:
                    throw new NoViableAltException(this);
                }
              }
            }
          }
        }
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public ruleLeftSubAtomicExpression(): RuleLeftSubAtomicExpressionContext {
    let localctx: RuleLeftSubAtomicExpressionContext = new RuleLeftSubAtomicExpressionContext(
      this,
      this._ctx,
      this.state
    );
    this.enterRule(localctx, 120, REMODELParser.RULE_ruleLeftSubAtomicExpression);
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 861;
        this._errHandler.sync(this);
        switch (this._interp.adaptivePredict(this._input, 87, this._ctx)) {
          case 1:
            {
              this.state = 859;
              this.ruleVariableExpCS();
            }
            break;
          case 2:
            {
              this.state = 860;
              this.ruleCallExpCS();
            }
            break;
        }
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public ruleRightSubAtomicExpression(): RuleRightSubAtomicExpressionContext {
    let localctx: RuleRightSubAtomicExpressionContext = new RuleRightSubAtomicExpressionContext(
      this,
      this._ctx,
      this.state
    );
    this.enterRule(localctx, 122, REMODELParser.RULE_ruleRightSubAtomicExpression);
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 866;
        this._errHandler.sync(this);
        switch (this._interp.adaptivePredict(this._input, 88, this._ctx)) {
          case 1:
            {
              this.state = 863;
              this.ruleLiteralExpCS();
            }
            break;
          case 2:
            {
              this.state = 864;
              this.ruleVariableExpCS();
            }
            break;
          case 3:
            {
              this.state = 865;
              this.ruleCallExpCS();
            }
            break;
        }
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public ruleInfixCompareOperatorName(): RuleInfixCompareOperatorNameContext {
    let localctx: RuleInfixCompareOperatorNameContext = new RuleInfixCompareOperatorNameContext(
      this,
      this._ctx,
      this.state
    );
    this.enterRule(localctx, 124, REMODELParser.RULE_ruleInfixCompareOperatorName);
    let _la: number;
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 868;
        _la = this._input.LA(1);
        if (!(((_la - 65) & ~0x1f) === 0 && ((1 << (_la - 65)) & 63) !== 0)) {
          this._errHandler.recoverInline(this);
        } else {
          this._errHandler.reportMatch(this);
          this.consume();
        }
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public ruleInfixOperatorName(): RuleInfixOperatorNameContext {
    let localctx: RuleInfixOperatorNameContext = new RuleInfixOperatorNameContext(
      this,
      this._ctx,
      this.state
    );
    this.enterRule(localctx, 126, REMODELParser.RULE_ruleInfixOperatorName);
    let _la: number;
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 870;
        _la = this._input.LA(1);
        if (!(((_la - 49) & ~0x1f) === 0 && ((1 << (_la - 49)) & 29360129) !== 0)) {
          this._errHandler.recoverInline(this);
        } else {
          this._errHandler.reportMatch(this);
          this.consume();
        }
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public ruleCallExpCS(): RuleCallExpCSContext {
    let localctx: RuleCallExpCSContext = new RuleCallExpCSContext(this, this._ctx, this.state);
    this.enterRule(localctx, 128, REMODELParser.RULE_ruleCallExpCS);
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 874;
        this._errHandler.sync(this);
        switch (this._interp.adaptivePredict(this._input, 89, this._ctx)) {
          case 1:
            {
              this.state = 872;
              this.ruleFeatureCallExpCS();
            }
            break;
          case 2:
            {
              this.state = 873;
              this.ruleLoopExpCS();
            }
            break;
        }
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public ruleLoopExpCS(): RuleLoopExpCSContext {
    let localctx: RuleLoopExpCSContext = new RuleLoopExpCSContext(this, this._ctx, this.state);
    this.enterRule(localctx, 130, REMODELParser.RULE_ruleLoopExpCS);
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 876;
        this.ruleIteratorExpCS();
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public ruleIteratorExpCS(): RuleIteratorExpCSContext {
    let localctx: RuleIteratorExpCSContext = new RuleIteratorExpCSContext(
      this,
      this._ctx,
      this.state
    );
    this.enterRule(localctx, 132, REMODELParser.RULE_ruleIteratorExpCS);
    let _la: number;
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 883;
        this._errHandler.sync(this);
        switch (this._interp.adaptivePredict(this._input, 91, this._ctx)) {
          case 1:
            {
              this.state = 880;
              this._errHandler.sync(this);
              switch (this._interp.adaptivePredict(this._input, 90, this._ctx)) {
                case 1:
                  {
                    this.state = 878;
                    this.ruleClassiferCallExpCS();
                  }
                  break;
                case 2:
                  {
                    this.state = 879;
                    this.rulePropertyCallExpCS();
                  }
                  break;
              }
            }
            break;
          case 2:
            {
              this.state = 882;
              this.ruleSimpleNameCS();
            }
            break;
        }
        this.state = 885;
        this.match(REMODELParser.T__10);
        this.state = 886;
        this.ruleIteratorIdentifier();
        this.state = 887;
        this.match(REMODELParser.T__9);
        this.state = 898;
        this._errHandler.sync(this);
        switch (this._interp.adaptivePredict(this._input, 93, this._ctx)) {
          case 1:
            {
              this.state = 888;
              this.ruleVariableDeclarationCS();
              this.state = 893;
              this._errHandler.sync(this);
              _la = this._input.LA(1);
              while (_la === 29) {
                {
                  {
                    this.state = 889;
                    this.match(REMODELParser.T__28);
                    this.state = 890;
                    this.ruleVariableDeclarationCS();
                  }
                }
                this.state = 895;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
              }
              this.state = 896;
              this.match(REMODELParser.T__55);
            }
            break;
        }
        this.state = 902;
        this._errHandler.sync(this);
        switch (this._input.LA(1)) {
          case 102:
          case 103:
          case 126:
            {
              this.state = 900;
              this.ruleLogicFormulaExpCS();
            }
            break;
          case 104:
            {
              this.state = 901;
              this.ruleIfExpCS();
            }
            break;
          default:
            throw new NoViableAltException(this);
        }
        this.state = 904;
        this.match(REMODELParser.T__2);
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public ruleIteratorIdentifier(): RuleIteratorIdentifierContext {
    let localctx: RuleIteratorIdentifierContext = new RuleIteratorIdentifierContext(
      this,
      this._ctx,
      this.state
    );
    this.enterRule(localctx, 134, REMODELParser.RULE_ruleIteratorIdentifier);
    let _la: number;
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 906;
        _la = this._input.LA(1);
        if (!(((_la - 74) & ~0x1f) === 0 && ((1 << (_la - 74)) & 127) !== 0)) {
          this._errHandler.recoverInline(this);
        } else {
          this._errHandler.reportMatch(this);
          this.consume();
        }
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public ruleArgumentsCS(): RuleArgumentsCSContext {
    let localctx: RuleArgumentsCSContext = new RuleArgumentsCSContext(this, this._ctx, this.state);
    this.enterRule(localctx, 136, REMODELParser.RULE_ruleArgumentsCS);
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 908;
        this.ruleOCLExpressionCS();
        this.state = 911;
        this._errHandler.sync(this);
        switch (this._interp.adaptivePredict(this._input, 95, this._ctx)) {
          case 1:
            {
              this.state = 909;
              this.match(REMODELParser.T__28);
              this.state = 910;
              this.ruleArgumentsCS();
            }
            break;
        }
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public ruleFeatureCallExpCS(): RuleFeatureCallExpCSContext {
    let localctx: RuleFeatureCallExpCSContext = new RuleFeatureCallExpCSContext(
      this,
      this._ctx,
      this.state
    );
    this.enterRule(localctx, 138, REMODELParser.RULE_ruleFeatureCallExpCS);
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 918;
        this._errHandler.sync(this);
        switch (this._interp.adaptivePredict(this._input, 96, this._ctx)) {
          case 1:
            {
              this.state = 913;
              this.rulePropertyCallExpCS();
            }
            break;
          case 2:
            {
              this.state = 914;
              this.ruleClassiferCallExpCS();
            }
            break;
          case 3:
            {
              this.state = 915;
              this.ruleStandardOperationExpCS();
            }
            break;
          case 4:
            {
              this.state = 916;
              this.ruleStandardNavigationCallExpCS();
            }
            break;
          case 5:
            {
              this.state = 917;
              this.ruleOperationCallExpCS();
            }
            break;
        }
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public ruleStandardNavigationCallExpCS(): RuleStandardNavigationCallExpCSContext {
    let localctx: RuleStandardNavigationCallExpCSContext =
      new RuleStandardNavigationCallExpCSContext(this, this._ctx, this.state);
    this.enterRule(localctx, 140, REMODELParser.RULE_ruleStandardNavigationCallExpCS);
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 923;
        this._errHandler.sync(this);
        switch (this._interp.adaptivePredict(this._input, 97, this._ctx)) {
          case 1:
            {
              this.state = 920;
              this.ruleClassiferCallExpCS();
            }
            break;
          case 2:
            {
              this.state = 921;
              this.rulePropertyCallExpCS();
            }
            break;
          case 3:
            {
              this.state = 922;
              this.ruleSimpleNameCS();
            }
            break;
        }
        this.state = 925;
        this.match(REMODELParser.T__10);
        this.state = 926;
        this.ruleStandardCollectionOperation();
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public ruleStandardOperationExpCS(): RuleStandardOperationExpCSContext {
    let localctx: RuleStandardOperationExpCSContext = new RuleStandardOperationExpCSContext(
      this,
      this._ctx,
      this.state
    );
    this.enterRule(localctx, 142, REMODELParser.RULE_ruleStandardOperationExpCS);
    let _la: number;
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 928;
        this.ruleVariableExpCS();
        this.state = 939;
        this._errHandler.sync(this);
        switch (this._interp.adaptivePredict(this._input, 99, this._ctx)) {
          case 1:
            {
              this.state = 929;
              _la = this._input.LA(1);
              if (!(_la === 11 || _la === 81)) {
                this._errHandler.recoverInline(this);
              } else {
                this._errHandler.reportMatch(this);
                this.consume();
              }
              this.state = 930;
              this.rulePredefineOp();
            }
            break;
          case 2:
            {
              this.state = 931;
              this.match(REMODELParser.T__80);
              this.state = 932;
              this.ruleVariableExpCS();
              this.state = 934;
              this._errHandler.sync(this);
              _la = this._input.LA(1);
              if (_la === 100) {
                {
                  this.state = 933;
                  this.ruleIsMarkedPreCS();
                }
              }

              this.state = 936;
              _la = this._input.LA(1);
              if (!(_la === 11 || _la === 81)) {
                this._errHandler.recoverInline(this);
              } else {
                this._errHandler.reportMatch(this);
                this.consume();
              }
              this.state = 937;
              this.rulePredefineOp();
            }
            break;
        }
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public rulePredefineOp(): RulePredefineOpContext {
    let localctx: RulePredefineOpContext = new RulePredefineOpContext(this, this._ctx, this.state);
    this.enterRule(localctx, 144, REMODELParser.RULE_rulePredefineOp);
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 944;
        this._errHandler.sync(this);
        switch (this._input.LA(1)) {
          case 82:
          case 83:
          case 84:
          case 85:
          case 86:
          case 87:
            {
              this.state = 941;
              this.ruleStandardNoneParameterOperation();
            }
            break;
          case 88:
            {
              this.state = 942;
              this.ruleStandardParameterOperation();
            }
            break;
          case 93:
          case 94:
          case 95:
          case 96:
          case 97:
            {
              this.state = 943;
              this.ruleStandardDateOperation();
            }
            break;
          default:
            throw new NoViableAltException(this);
        }
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public ruleStandardNoneParameterOperation(): RuleStandardNoneParameterOperationContext {
    let localctx: RuleStandardNoneParameterOperationContext =
      new RuleStandardNoneParameterOperationContext(this, this._ctx, this.state);
    this.enterRule(localctx, 146, REMODELParser.RULE_ruleStandardNoneParameterOperation);
    let _la: number;
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 946;
        _la = this._input.LA(1);
        if (!(((_la - 82) & ~0x1f) === 0 && ((1 << (_la - 82)) & 63) !== 0)) {
          this._errHandler.recoverInline(this);
        } else {
          this._errHandler.reportMatch(this);
          this.consume();
        }
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public ruleStandardParameterOperation(): RuleStandardParameterOperationContext {
    let localctx: RuleStandardParameterOperationContext = new RuleStandardParameterOperationContext(
      this,
      this._ctx,
      this.state
    );
    this.enterRule(localctx, 148, REMODELParser.RULE_ruleStandardParameterOperation);
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 948;
        this.match(REMODELParser.T__87);
        this.state = 949;
        this.match(REMODELParser.T__9);
        this.state = 952;
        this._errHandler.sync(this);
        switch (this._input.LA(1)) {
          case 115:
          case 116:
          case 117:
          case 118:
          case 119:
            {
              this.state = 950;
              this.rulePrimitiveTypeCS();
            }
            break;
          case 126:
            {
              this.state = 951;
              this.ruleEntityType();
            }
            break;
          default:
            throw new NoViableAltException(this);
        }
        this.state = 954;
        this.match(REMODELParser.T__2);
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public ruleStandardCollectionOperation(): RuleStandardCollectionOperationContext {
    let localctx: RuleStandardCollectionOperationContext =
      new RuleStandardCollectionOperationContext(this, this._ctx, this.state);
    this.enterRule(localctx, 150, REMODELParser.RULE_ruleStandardCollectionOperation);
    let _la: number;
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 956;
        _la = this._input.LA(1);
        if (!(((_la - 89) & ~0x1f) === 0 && ((1 << (_la - 89)) & 15) !== 0)) {
          this._errHandler.recoverInline(this);
        } else {
          this._errHandler.reportMatch(this);
          this.consume();
        }
        this.state = 957;
        this.match(REMODELParser.T__9);
        this.state = 958;
        this.ruleSimpleNameCS();
        this.state = 959;
        this.match(REMODELParser.T__2);
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public ruleStandardDateOperation(): RuleStandardDateOperationContext {
    let localctx: RuleStandardDateOperationContext = new RuleStandardDateOperationContext(
      this,
      this._ctx,
      this.state
    );
    this.enterRule(localctx, 152, REMODELParser.RULE_ruleStandardDateOperation);
    let _la: number;
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 961;
        _la = this._input.LA(1);
        if (!(((_la - 93) & ~0x1f) === 0 && ((1 << (_la - 93)) & 31) !== 0)) {
          this._errHandler.recoverInline(this);
        } else {
          this._errHandler.reportMatch(this);
          this.consume();
        }
        this.state = 962;
        this.match(REMODELParser.T__9);
        this.state = 966;
        this._errHandler.sync(this);
        switch (this._interp.adaptivePredict(this._input, 102, this._ctx)) {
          case 1:
            {
              this.state = 963;
              this.ruleSimpleNameCS();
            }
            break;
          case 2:
            {
              this.state = 964;
              this.ruleNumberLiteralExpCS();
            }
            break;
          case 3:
            {
              this.state = 965;
              this.rulePropertyCallExpCS();
            }
            break;
        }
        this.state = 968;
        this.match(REMODELParser.T__2);
        this.state = 971;
        this._errHandler.sync(this);
        _la = this._input.LA(1);
        if (_la === 81) {
          {
            this.state = 969;
            this.match(REMODELParser.T__80);
            this.state = 970;
            this.ruleStandardDateOperation();
          }
        }
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public ruleClassiferCallExpCS(): RuleClassiferCallExpCSContext {
    let localctx: RuleClassiferCallExpCSContext = new RuleClassiferCallExpCSContext(
      this,
      this._ctx,
      this.state
    );
    this.enterRule(localctx, 154, REMODELParser.RULE_ruleClassiferCallExpCS);
    let _la: number;
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 973;
        this.ruleSimpleNameCS();
        this.state = 974;
        this.match(REMODELParser.T__80);
        this.state = 975;
        _la = this._input.LA(1);
        if (!(_la === 98 || _la === 99)) {
          this._errHandler.recoverInline(this);
        } else {
          this._errHandler.reportMatch(this);
          this.consume();
        }
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public rulePropertyCallExpCS(): RulePropertyCallExpCSContext {
    let localctx: RulePropertyCallExpCSContext = new RulePropertyCallExpCSContext(
      this,
      this._ctx,
      this.state
    );
    this.enterRule(localctx, 156, REMODELParser.RULE_rulePropertyCallExpCS);
    let _la: number;
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 977;
        this.ruleVariableExpCS();
        this.state = 978;
        this.match(REMODELParser.T__80);
        this.state = 982;
        this._errHandler.sync(this);
        switch (this._interp.adaptivePredict(this._input, 104, this._ctx)) {
          case 1:
            {
              this.state = 979;
              this.ruleVariableExpCS();
              this.state = 980;
              this.match(REMODELParser.T__80);
            }
            break;
        }
        this.state = 984;
        this.ruleSimpleNameCS();
        this.state = 986;
        this._errHandler.sync(this);
        _la = this._input.LA(1);
        if (_la === 100) {
          {
            this.state = 985;
            this.ruleIsMarkedPreCS();
          }
        }
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public ruleOperationCallExpCS(): RuleOperationCallExpCSContext {
    let localctx: RuleOperationCallExpCSContext = new RuleOperationCallExpCSContext(
      this,
      this._ctx,
      this.state
    );
    this.enterRule(localctx, 158, REMODELParser.RULE_ruleOperationCallExpCS);
    let _la: number;
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 988;
        this.ruleSimpleNameCS();
        this.state = 989;
        this.match(REMODELParser.T__9);
        this.state = 991;
        this._errHandler.sync(this);
        _la = this._input.LA(1);
        if (((_la - 102) & ~0x1f) === 0 && ((1 << (_la - 102)) & 23068675) !== 0) {
          {
            this.state = 990;
            this.ruleOperationParameters();
          }
        }

        this.state = 997;
        this._errHandler.sync(this);
        _la = this._input.LA(1);
        while (_la === 29) {
          {
            {
              this.state = 993;
              this.match(REMODELParser.T__28);
              this.state = 994;
              this.ruleOperationParameters();
            }
          }
          this.state = 999;
          this._errHandler.sync(this);
          _la = this._input.LA(1);
        }
        this.state = 1000;
        this.match(REMODELParser.T__2);
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public ruleOperationParameters(): RuleOperationParametersContext {
    let localctx: RuleOperationParametersContext = new RuleOperationParametersContext(
      this,
      this._ctx,
      this.state
    );
    this.enterRule(localctx, 160, REMODELParser.RULE_ruleOperationParameters);
    let _la: number;
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 1005;
        this._errHandler.sync(this);
        switch (this._interp.adaptivePredict(this._input, 108, this._ctx)) {
          case 1:
            {
              this.state = 1002;
              this.ruleSimpleNameCS();
            }
            break;
          case 2:
            {
              this.state = 1003;
              this.rulePropertyCallExpCS();
            }
            break;
          case 3:
            {
              this.state = 1004;
              _la = this._input.LA(1);
              if (!(_la === 123 || _la === 124)) {
                this._errHandler.recoverInline(this);
              } else {
                this._errHandler.reportMatch(this);
                this.consume();
              }
            }
            break;
        }
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public ruleIsMarkedPreCS(): RuleIsMarkedPreCSContext {
    let localctx: RuleIsMarkedPreCSContext = new RuleIsMarkedPreCSContext(
      this,
      this._ctx,
      this.state
    );
    this.enterRule(localctx, 162, REMODELParser.RULE_ruleIsMarkedPreCS);
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 1007;
        this.match(REMODELParser.T__99);
        this.state = 1008;
        this.match(REMODELParser.T__100);
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public ruleVariableExpCS(): RuleVariableExpCSContext {
    let localctx: RuleVariableExpCSContext = new RuleVariableExpCSContext(
      this,
      this._ctx,
      this.state
    );
    this.enterRule(localctx, 164, REMODELParser.RULE_ruleVariableExpCS);
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 1013;
        this._errHandler.sync(this);
        switch (this._input.LA(1)) {
          case 102:
            {
              this.state = 1010;
              this.match(REMODELParser.T__101);
            }
            break;
          case 103:
            {
              this.state = 1011;
              this.match(REMODELParser.T__102);
            }
            break;
          case 126:
            {
              this.state = 1012;
              this.ruleSimpleNameCS();
            }
            break;
          default:
            throw new NoViableAltException(this);
        }
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public ruleSimpleNameCS(): RuleSimpleNameCSContext {
    let localctx: RuleSimpleNameCSContext = new RuleSimpleNameCSContext(
      this,
      this._ctx,
      this.state
    );
    this.enterRule(localctx, 166, REMODELParser.RULE_ruleSimpleNameCS);
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 1015;
        this.match(REMODELParser.RULE_ID);
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public ruleIfExpCS(): RuleIfExpCSContext {
    let localctx: RuleIfExpCSContext = new RuleIfExpCSContext(this, this._ctx, this.state);
    this.enterRule(localctx, 168, REMODELParser.RULE_ruleIfExpCS);
    let _la: number;
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 1017;
        this.match(REMODELParser.T__103);
        this.state = 1018;
        this.ruleOCLExpressionCS();
        this.state = 1019;
        this.match(REMODELParser.T__104);
        this.state = 1020;
        this.ruleOCLExpressionCS();
        this.state = 1023;
        this._errHandler.sync(this);
        _la = this._input.LA(1);
        if (_la === 106) {
          {
            this.state = 1021;
            this.match(REMODELParser.T__105);
            this.state = 1022;
            this.ruleOCLExpressionCS();
          }
        }

        this.state = 1025;
        this.match(REMODELParser.T__106);
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public ruleLetExpCS(): RuleLetExpCSContext {
    let localctx: RuleLetExpCSContext = new RuleLetExpCSContext(this, this._ctx, this.state);
    this.enterRule(localctx, 170, REMODELParser.RULE_ruleLetExpCS);
    let _la: number;
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 1027;
        this.match(REMODELParser.T__107);
        this.state = 1028;
        this.ruleVariableDeclarationCS();
        this.state = 1033;
        this._errHandler.sync(this);
        _la = this._input.LA(1);
        while (_la === 29) {
          {
            {
              this.state = 1029;
              this.match(REMODELParser.T__28);
              this.state = 1030;
              this.ruleVariableDeclarationCS();
            }
          }
          this.state = 1035;
          this._errHandler.sync(this);
          _la = this._input.LA(1);
        }
        this.state = 1036;
        this.match(REMODELParser.T__108);
        this.state = 1037;
        this.ruleOCLExpressionCS();
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public ruleVariableDeclarationCS(): RuleVariableDeclarationCSContext {
    let localctx: RuleVariableDeclarationCSContext = new RuleVariableDeclarationCSContext(
      this,
      this._ctx,
      this.state
    );
    this.enterRule(localctx, 172, REMODELParser.RULE_ruleVariableDeclarationCS);
    let _la: number;
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 1039;
        this.ruleSimpleNameCS();
        this.state = 1042;
        this._errHandler.sync(this);
        _la = this._input.LA(1);
        if (_la === 37) {
          {
            this.state = 1040;
            this.match(REMODELParser.T__36);
            this.state = 1041;
            this.ruleTypeCS();
          }
        }

        this.state = 1046;
        this._errHandler.sync(this);
        _la = this._input.LA(1);
        if (_la === 69) {
          {
            this.state = 1044;
            this.match(REMODELParser.T__68);
            this.state = 1045;
            this.ruleOCLExpressionCS();
          }
        }
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public ruleLiteralExpCS(): RuleLiteralExpCSContext {
    let localctx: RuleLiteralExpCSContext = new RuleLiteralExpCSContext(
      this,
      this._ctx,
      this.state
    );
    this.enterRule(localctx, 174, REMODELParser.RULE_ruleLiteralExpCS);
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 1051;
        this._errHandler.sync(this);
        switch (this._input.LA(1)) {
          case 114:
            {
              this.state = 1048;
              this.ruleCollectionLiteralExpCS();
            }
            break;
          case 111:
          case 112:
          case 113:
          case 123:
          case 124:
          case 127:
            {
              this.state = 1049;
              this.rulePrimitiveLiteralExpCS();
            }
            break;
          case 126:
            {
              this.state = 1050;
              this.ruleEnumLiteralExpCS();
            }
            break;
          default:
            throw new NoViableAltException(this);
        }
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public ruleEnumLiteralExpCS(): RuleEnumLiteralExpCSContext {
    let localctx: RuleEnumLiteralExpCSContext = new RuleEnumLiteralExpCSContext(
      this,
      this._ctx,
      this.state
    );
    this.enterRule(localctx, 176, REMODELParser.RULE_ruleEnumLiteralExpCS);
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 1053;
        this.ruleSimpleNameCS();
        this.state = 1054;
        this.match(REMODELParser.T__27);
        this.state = 1055;
        this.match(REMODELParser.RULE_ID);
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public ruleCollectionTypeCS(): RuleCollectionTypeCSContext {
    let localctx: RuleCollectionTypeCSContext = new RuleCollectionTypeCSContext(
      this,
      this._ctx,
      this.state
    );
    this.enterRule(localctx, 178, REMODELParser.RULE_ruleCollectionTypeCS);
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 1057;
        this.ruleCollectionTypeIdentifierCS();
        this.state = 1058;
        this.match(REMODELParser.T__9);
        this.state = 1059;
        this.ruleTypeCS();
        this.state = 1060;
        this.match(REMODELParser.T__2);
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public ruleCollectionLiteralExpCS(): RuleCollectionLiteralExpCSContext {
    let localctx: RuleCollectionLiteralExpCSContext = new RuleCollectionLiteralExpCSContext(
      this,
      this._ctx,
      this.state
    );
    this.enterRule(localctx, 180, REMODELParser.RULE_ruleCollectionLiteralExpCS);
    let _la: number;
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 1062;
        this.ruleCollectionTypeIdentifierCS();
        this.state = 1063;
        this.match(REMODELParser.T__4);
        this.state = 1065;
        this._errHandler.sync(this);
        _la = this._input.LA(1);
        if (_la === 10 || (((_la - 102) & ~0x1f) === 0 && ((1 << (_la - 102)) & 56630855) !== 0)) {
          {
            this.state = 1064;
            this.ruleCollectionLiteralPartCS();
          }
        }

        this.state = 1071;
        this._errHandler.sync(this);
        _la = this._input.LA(1);
        while (_la === 29) {
          {
            {
              {
                this.state = 1067;
                this.match(REMODELParser.T__28);
              }
              this.state = 1068;
              this.ruleCollectionLiteralPartCS();
            }
          }
          this.state = 1073;
          this._errHandler.sync(this);
          _la = this._input.LA(1);
        }
        this.state = 1074;
        this.match(REMODELParser.T__7);
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public ruleCollectionLiteralPartCS(): RuleCollectionLiteralPartCSContext {
    let localctx: RuleCollectionLiteralPartCSContext = new RuleCollectionLiteralPartCSContext(
      this,
      this._ctx,
      this.state
    );
    this.enterRule(localctx, 182, REMODELParser.RULE_ruleCollectionLiteralPartCS);
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 1078;
        this._errHandler.sync(this);
        switch (this._interp.adaptivePredict(this._input, 117, this._ctx)) {
          case 1:
            {
              this.state = 1076;
              this.ruleCollectionRangeCS();
            }
            break;
          case 2:
            {
              {
                this.state = 1077;
                this.ruleCollectionItem();
              }
            }
            break;
        }
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public ruleCollectionRangeCS(): RuleCollectionRangeCSContext {
    let localctx: RuleCollectionRangeCSContext = new RuleCollectionRangeCSContext(
      this,
      this._ctx,
      this.state
    );
    this.enterRule(localctx, 184, REMODELParser.RULE_ruleCollectionRangeCS);
    try {
      this.enterOuterAlt(localctx, 1);
      {
        {
          this.state = 1080;
          this.ruleOCLExpressionCS();
        }
        this.state = 1081;
        this.match(REMODELParser.T__109);
        this.state = 1082;
        this.ruleOCLExpressionCS();
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public ruleCollectionItem(): RuleCollectionItemContext {
    let localctx: RuleCollectionItemContext = new RuleCollectionItemContext(
      this,
      this._ctx,
      this.state
    );
    this.enterRule(localctx, 186, REMODELParser.RULE_ruleCollectionItem);
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 1084;
        this.ruleOCLExpressionCS();
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public rulePrimitiveLiteralExpCS(): RulePrimitiveLiteralExpCSContext {
    let localctx: RulePrimitiveLiteralExpCSContext = new RulePrimitiveLiteralExpCSContext(
      this,
      this._ctx,
      this.state
    );
    this.enterRule(localctx, 188, REMODELParser.RULE_rulePrimitiveLiteralExpCS);
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 1090;
        this._errHandler.sync(this);
        switch (this._input.LA(1)) {
          case 127:
            {
              this.state = 1086;
              this.ruleNumberLiteralExpCS();
            }
            break;
          case 123:
          case 124:
            {
              this.state = 1087;
              this.ruleStringLiteralExpCS();
            }
            break;
          case 111:
          case 112:
            {
              this.state = 1088;
              this.ruleBooleanLiteralExpCS();
            }
            break;
          case 113:
            {
              this.state = 1089;
              this.ruleNullLiteralExpCS();
            }
            break;
          default:
            throw new NoViableAltException(this);
        }
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public ruleNumberLiteralExpCS(): RuleNumberLiteralExpCSContext {
    let localctx: RuleNumberLiteralExpCSContext = new RuleNumberLiteralExpCSContext(
      this,
      this._ctx,
      this.state
    );
    this.enterRule(localctx, 190, REMODELParser.RULE_ruleNumberLiteralExpCS);
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 1094;
        this._errHandler.sync(this);
        switch (this._interp.adaptivePredict(this._input, 119, this._ctx)) {
          case 1:
            {
              this.state = 1092;
              this.ruleIntegerLiteralExpCS();
            }
            break;
          case 2:
            {
              this.state = 1093;
              this.ruleRealLiteralExpCS();
            }
            break;
        }
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public ruleIntegerLiteralExpCS(): RuleIntegerLiteralExpCSContext {
    let localctx: RuleIntegerLiteralExpCSContext = new RuleIntegerLiteralExpCSContext(
      this,
      this._ctx,
      this.state
    );
    this.enterRule(localctx, 192, REMODELParser.RULE_ruleIntegerLiteralExpCS);
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 1096;
        this.match(REMODELParser.RULE_INT);
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public ruleRealLiteralExpCS(): RuleRealLiteralExpCSContext {
    let localctx: RuleRealLiteralExpCSContext = new RuleRealLiteralExpCSContext(
      this,
      this._ctx,
      this.state
    );
    this.enterRule(localctx, 194, REMODELParser.RULE_ruleRealLiteralExpCS);
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 1098;
        this.ruleFloat();
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public ruleBooleanLiteralExpCS(): RuleBooleanLiteralExpCSContext {
    let localctx: RuleBooleanLiteralExpCSContext = new RuleBooleanLiteralExpCSContext(
      this,
      this._ctx,
      this.state
    );
    this.enterRule(localctx, 196, REMODELParser.RULE_ruleBooleanLiteralExpCS);
    let _la: number;
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 1100;
        _la = this._input.LA(1);
        if (!(_la === 111 || _la === 112)) {
          this._errHandler.recoverInline(this);
        } else {
          this._errHandler.reportMatch(this);
          this.consume();
        }
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public ruleStringLiteralExpCS(): RuleStringLiteralExpCSContext {
    let localctx: RuleStringLiteralExpCSContext = new RuleStringLiteralExpCSContext(
      this,
      this._ctx,
      this.state
    );
    this.enterRule(localctx, 198, REMODELParser.RULE_ruleStringLiteralExpCS);
    let _la: number;
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 1102;
        _la = this._input.LA(1);
        if (!(_la === 123 || _la === 124)) {
          this._errHandler.recoverInline(this);
        } else {
          this._errHandler.reportMatch(this);
          this.consume();
        }
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public ruleNullLiteralExpCS(): RuleNullLiteralExpCSContext {
    let localctx: RuleNullLiteralExpCSContext = new RuleNullLiteralExpCSContext(
      this,
      this._ctx,
      this.state
    );
    this.enterRule(localctx, 200, REMODELParser.RULE_ruleNullLiteralExpCS);
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 1104;
        this.match(REMODELParser.T__112);
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public ruleFloat(): RuleFloatContext {
    let localctx: RuleFloatContext = new RuleFloatContext(this, this._ctx, this.state);
    this.enterRule(localctx, 202, REMODELParser.RULE_ruleFloat);
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 1106;
        this.match(REMODELParser.RULE_INT);
        this.state = 1107;
        this.match(REMODELParser.T__80);
        this.state = 1108;
        this.match(REMODELParser.RULE_INT);
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public ruleCollectionTypeIdentifierCS(): RuleCollectionTypeIdentifierCSContext {
    let localctx: RuleCollectionTypeIdentifierCSContext = new RuleCollectionTypeIdentifierCSContext(
      this,
      this._ctx,
      this.state
    );
    this.enterRule(localctx, 204, REMODELParser.RULE_ruleCollectionTypeIdentifierCS);
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 1110;
        this.match(REMODELParser.T__113);
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public rulePrimitiveTypeCS(): RulePrimitiveTypeCSContext {
    let localctx: RulePrimitiveTypeCSContext = new RulePrimitiveTypeCSContext(
      this,
      this._ctx,
      this.state
    );
    this.enterRule(localctx, 206, REMODELParser.RULE_rulePrimitiveTypeCS);
    let _la: number;
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 1112;
        _la = this._input.LA(1);
        if (!(((_la - 115) & ~0x1f) === 0 && ((1 << (_la - 115)) & 31) !== 0)) {
          this._errHandler.recoverInline(this);
        } else {
          this._errHandler.reportMatch(this);
          this.consume();
        }
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public ruleAssociationTypeCS(): RuleAssociationTypeCSContext {
    let localctx: RuleAssociationTypeCSContext = new RuleAssociationTypeCSContext(
      this,
      this._ctx,
      this.state
    );
    this.enterRule(localctx, 208, REMODELParser.RULE_ruleAssociationTypeCS);
    let _la: number;
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 1114;
        _la = this._input.LA(1);
        if (!(((_la - 120) & ~0x1f) === 0 && ((1 << (_la - 120)) & 7) !== 0)) {
          this._errHandler.recoverInline(this);
        } else {
          this._errHandler.reportMatch(this);
          this.consume();
        }
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }

  public static readonly _serializedATN: number[] = [
    4, 1, 130, 1117, 2, 0, 7, 0, 2, 1, 7, 1, 2, 2, 7, 2, 2, 3, 7, 3, 2, 4, 7, 4, 2, 5, 7, 5, 2, 6,
    7, 6, 2, 7, 7, 7, 2, 8, 7, 8, 2, 9, 7, 9, 2, 10, 7, 10, 2, 11, 7, 11, 2, 12, 7, 12, 2, 13, 7,
    13, 2, 14, 7, 14, 2, 15, 7, 15, 2, 16, 7, 16, 2, 17, 7, 17, 2, 18, 7, 18, 2, 19, 7, 19, 2, 20,
    7, 20, 2, 21, 7, 21, 2, 22, 7, 22, 2, 23, 7, 23, 2, 24, 7, 24, 2, 25, 7, 25, 2, 26, 7, 26, 2,
    27, 7, 27, 2, 28, 7, 28, 2, 29, 7, 29, 2, 30, 7, 30, 2, 31, 7, 31, 2, 32, 7, 32, 2, 33, 7, 33,
    2, 34, 7, 34, 2, 35, 7, 35, 2, 36, 7, 36, 2, 37, 7, 37, 2, 38, 7, 38, 2, 39, 7, 39, 2, 40, 7,
    40, 2, 41, 7, 41, 2, 42, 7, 42, 2, 43, 7, 43, 2, 44, 7, 44, 2, 45, 7, 45, 2, 46, 7, 46, 2, 47,
    7, 47, 2, 48, 7, 48, 2, 49, 7, 49, 2, 50, 7, 50, 2, 51, 7, 51, 2, 52, 7, 52, 2, 53, 7, 53, 2,
    54, 7, 54, 2, 55, 7, 55, 2, 56, 7, 56, 2, 57, 7, 57, 2, 58, 7, 58, 2, 59, 7, 59, 2, 60, 7, 60,
    2, 61, 7, 61, 2, 62, 7, 62, 2, 63, 7, 63, 2, 64, 7, 64, 2, 65, 7, 65, 2, 66, 7, 66, 2, 67, 7,
    67, 2, 68, 7, 68, 2, 69, 7, 69, 2, 70, 7, 70, 2, 71, 7, 71, 2, 72, 7, 72, 2, 73, 7, 73, 2, 74,
    7, 74, 2, 75, 7, 75, 2, 76, 7, 76, 2, 77, 7, 77, 2, 78, 7, 78, 2, 79, 7, 79, 2, 80, 7, 80, 2,
    81, 7, 81, 2, 82, 7, 82, 2, 83, 7, 83, 2, 84, 7, 84, 2, 85, 7, 85, 2, 86, 7, 86, 2, 87, 7, 87,
    2, 88, 7, 88, 2, 89, 7, 89, 2, 90, 7, 90, 2, 91, 7, 91, 2, 92, 7, 92, 2, 93, 7, 93, 2, 94, 7,
    94, 2, 95, 7, 95, 2, 96, 7, 96, 2, 97, 7, 97, 2, 98, 7, 98, 2, 99, 7, 99, 2, 100, 7, 100, 2,
    101, 7, 101, 2, 102, 7, 102, 2, 103, 7, 103, 2, 104, 7, 104, 1, 0, 1, 0, 3, 0, 213, 8, 0, 1, 0,
    1, 0, 1, 0, 3, 0, 218, 8, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 5, 1, 228, 8, 1,
    10, 1, 12, 1, 231, 9, 1, 1, 1, 1, 1, 5, 1, 235, 8, 1, 10, 1, 12, 1, 238, 9, 1, 1, 1, 5, 1, 241,
    8, 1, 10, 1, 12, 1, 244, 9, 1, 1, 1, 5, 1, 247, 8, 1, 10, 1, 12, 1, 250, 9, 1, 1, 1, 5, 1, 253,
    8, 1, 10, 1, 12, 1, 256, 9, 1, 1, 1, 1, 1, 1, 2, 1, 2, 3, 2, 262, 8, 2, 1, 3, 1, 3, 1, 3, 1, 3,
    1, 3, 1, 3, 1, 3, 1, 3, 1, 3, 1, 4, 1, 4, 1, 4, 1, 4, 1, 4, 1, 4, 1, 4, 1, 4, 1, 4, 1, 5, 1, 5,
    1, 5, 1, 5, 1, 5, 1, 5, 1, 5, 1, 5, 1, 6, 1, 6, 1, 6, 1, 6, 1, 6, 1, 6, 1, 6, 5, 6, 297, 8, 6,
    10, 6, 12, 6, 300, 9, 6, 1, 6, 1, 6, 1, 6, 1, 6, 1, 6, 5, 6, 307, 8, 6, 10, 6, 12, 6, 310, 9, 6,
    1, 6, 1, 6, 1, 7, 1, 7, 1, 8, 1, 8, 1, 8, 1, 8, 1, 8, 1, 8, 1, 8, 1, 9, 1, 9, 3, 9, 325, 8, 9,
    1, 10, 1, 10, 3, 10, 329, 8, 10, 1, 11, 1, 11, 3, 11, 333, 8, 11, 1, 12, 1, 12, 1, 12, 1, 12, 1,
    12, 1, 12, 1, 12, 1, 13, 1, 13, 1, 13, 1, 13, 1, 13, 1, 13, 1, 13, 1, 14, 1, 14, 1, 14, 1, 14,
    1, 14, 1, 14, 1, 15, 1, 15, 1, 15, 1, 15, 1, 15, 1, 15, 1, 16, 1, 16, 1, 16, 1, 16, 1, 16, 3,
    16, 366, 8, 16, 1, 16, 1, 16, 5, 16, 370, 8, 16, 10, 16, 12, 16, 373, 9, 16, 1, 16, 1, 16, 1,
    17, 1, 17, 1, 17, 1, 17, 1, 17, 3, 17, 382, 8, 17, 1, 17, 1, 17, 5, 17, 386, 8, 17, 10, 17, 12,
    17, 389, 9, 17, 1, 17, 5, 17, 392, 8, 17, 10, 17, 12, 17, 395, 9, 17, 1, 17, 5, 17, 398, 8, 17,
    10, 17, 12, 17, 401, 9, 17, 1, 17, 5, 17, 404, 8, 17, 10, 17, 12, 17, 407, 9, 17, 1, 17, 5, 17,
    410, 8, 17, 10, 17, 12, 17, 413, 9, 17, 1, 17, 1, 17, 1, 18, 1, 18, 1, 18, 1, 18, 1, 18, 3, 18,
    422, 8, 18, 1, 18, 1, 18, 3, 18, 426, 8, 18, 1, 18, 1, 18, 1, 18, 1, 18, 3, 18, 432, 8, 18, 1,
    18, 5, 18, 435, 8, 18, 10, 18, 12, 18, 438, 9, 18, 1, 18, 1, 18, 1, 19, 1, 19, 1, 19, 1, 19, 3,
    19, 446, 8, 19, 1, 19, 3, 19, 449, 8, 19, 1, 19, 3, 19, 452, 8, 19, 1, 19, 1, 19, 1, 19, 1, 19,
    5, 19, 458, 8, 19, 10, 19, 12, 19, 461, 9, 19, 3, 19, 463, 8, 19, 1, 19, 1, 19, 1, 19, 1, 19, 1,
    19, 5, 19, 470, 8, 19, 10, 19, 12, 19, 473, 9, 19, 1, 19, 3, 19, 476, 8, 19, 1, 19, 1, 19, 1,
    19, 1, 19, 1, 19, 5, 19, 483, 8, 19, 10, 19, 12, 19, 486, 9, 19, 1, 19, 3, 19, 489, 8, 19, 1,
    19, 1, 19, 1, 19, 3, 19, 494, 8, 19, 1, 20, 1, 20, 1, 20, 1, 20, 1, 20, 1, 20, 3, 20, 502, 8,
    20, 1, 20, 1, 20, 5, 20, 506, 8, 20, 10, 20, 12, 20, 509, 9, 20, 3, 20, 511, 8, 20, 1, 20, 1,
    20, 5, 20, 515, 8, 20, 10, 20, 12, 20, 518, 9, 20, 3, 20, 520, 8, 20, 1, 20, 1, 20, 5, 20, 524,
    8, 20, 10, 20, 12, 20, 527, 9, 20, 3, 20, 529, 8, 20, 1, 20, 1, 20, 5, 20, 533, 8, 20, 10, 20,
    12, 20, 536, 9, 20, 3, 20, 538, 8, 20, 1, 20, 1, 20, 1, 21, 1, 21, 3, 21, 544, 8, 21, 1, 22, 1,
    22, 1, 22, 5, 22, 549, 8, 22, 10, 22, 12, 22, 552, 9, 22, 1, 22, 1, 22, 1, 23, 1, 23, 1, 23, 1,
    23, 1, 23, 1, 23, 1, 23, 3, 23, 563, 8, 23, 1, 24, 1, 24, 1, 24, 1, 24, 1, 24, 1, 25, 1, 25, 1,
    26, 1, 26, 1, 27, 1, 27, 1, 27, 1, 27, 4, 27, 578, 8, 27, 11, 27, 12, 27, 579, 1, 27, 1, 27, 1,
    28, 1, 28, 4, 28, 586, 8, 28, 11, 28, 12, 28, 587, 1, 28, 1, 28, 1, 28, 1, 28, 1, 29, 1, 29, 3,
    29, 596, 8, 29, 1, 30, 1, 30, 1, 31, 1, 31, 1, 31, 1, 31, 1, 31, 5, 31, 605, 8, 31, 10, 31, 12,
    31, 608, 9, 31, 1, 31, 1, 31, 1, 32, 1, 32, 1, 32, 1, 32, 1, 32, 5, 32, 617, 8, 32, 10, 32, 12,
    32, 620, 9, 32, 1, 32, 3, 32, 623, 8, 32, 1, 32, 1, 32, 1, 33, 1, 33, 1, 33, 1, 33, 1, 33, 1,
    34, 1, 34, 1, 34, 1, 35, 1, 35, 1, 35, 3, 35, 638, 8, 35, 1, 35, 1, 35, 5, 35, 642, 8, 35, 10,
    35, 12, 35, 645, 9, 35, 1, 35, 1, 35, 1, 35, 3, 35, 650, 8, 35, 1, 36, 1, 36, 1, 37, 1, 37, 1,
    37, 3, 37, 657, 8, 37, 1, 38, 1, 38, 1, 39, 3, 39, 662, 8, 39, 1, 39, 1, 39, 1, 39, 1, 39, 3,
    39, 668, 8, 39, 1, 39, 1, 39, 1, 39, 1, 39, 3, 39, 674, 8, 39, 1, 39, 5, 39, 677, 8, 39, 10, 39,
    12, 39, 680, 9, 39, 1, 39, 1, 39, 5, 39, 684, 8, 39, 10, 39, 12, 39, 687, 9, 39, 3, 39, 689, 8,
    39, 1, 39, 1, 39, 5, 39, 693, 8, 39, 10, 39, 12, 39, 696, 9, 39, 3, 39, 698, 8, 39, 1, 39, 1,
    39, 1, 40, 1, 40, 1, 40, 1, 40, 3, 40, 706, 8, 40, 1, 41, 1, 41, 1, 41, 1, 41, 3, 41, 712, 8,
    41, 1, 41, 3, 41, 715, 8, 41, 1, 41, 3, 41, 718, 8, 41, 1, 41, 3, 41, 721, 8, 41, 1, 41, 1, 41,
    1, 42, 1, 42, 1, 42, 1, 42, 3, 42, 729, 8, 42, 1, 43, 1, 43, 1, 43, 1, 43, 1, 43, 1, 43, 1, 43,
    1, 43, 3, 43, 739, 8, 43, 1, 43, 3, 43, 742, 8, 43, 1, 44, 1, 44, 1, 45, 1, 45, 1, 45, 1, 45, 1,
    45, 5, 45, 751, 8, 45, 10, 45, 12, 45, 754, 9, 45, 1, 45, 1, 45, 1, 46, 1, 46, 1, 47, 1, 47, 1,
    48, 1, 48, 1, 48, 1, 48, 1, 48, 1, 48, 3, 48, 768, 8, 48, 1, 48, 1, 48, 1, 48, 1, 48, 1, 49, 1,
    49, 1, 49, 1, 50, 1, 50, 1, 50, 1, 51, 1, 51, 1, 51, 1, 52, 1, 52, 1, 52, 1, 53, 1, 53, 1, 53,
    1, 53, 1, 53, 5, 53, 791, 8, 53, 10, 53, 12, 53, 794, 9, 53, 1, 54, 1, 54, 1, 54, 1, 54, 1, 54,
    1, 54, 1, 54, 3, 54, 803, 8, 54, 1, 55, 1, 55, 1, 55, 1, 55, 1, 55, 1, 55, 1, 55, 3, 55, 812, 8,
    55, 1, 56, 1, 56, 1, 56, 1, 56, 1, 56, 3, 56, 819, 8, 56, 1, 57, 1, 57, 1, 57, 1, 57, 1, 58, 1,
    58, 1, 58, 1, 58, 1, 58, 3, 58, 830, 8, 58, 4, 58, 832, 8, 58, 11, 58, 12, 58, 833, 1, 58, 1,
    58, 1, 58, 1, 58, 3, 58, 840, 8, 58, 4, 58, 842, 8, 58, 11, 58, 12, 58, 843, 3, 58, 846, 8, 58,
    1, 59, 1, 59, 1, 59, 1, 59, 1, 59, 1, 59, 3, 59, 854, 8, 59, 3, 59, 856, 8, 59, 3, 59, 858, 8,
    59, 1, 60, 1, 60, 3, 60, 862, 8, 60, 1, 61, 1, 61, 1, 61, 3, 61, 867, 8, 61, 1, 62, 1, 62, 1,
    63, 1, 63, 1, 64, 1, 64, 3, 64, 875, 8, 64, 1, 65, 1, 65, 1, 66, 1, 66, 3, 66, 881, 8, 66, 1,
    66, 3, 66, 884, 8, 66, 1, 66, 1, 66, 1, 66, 1, 66, 1, 66, 1, 66, 5, 66, 892, 8, 66, 10, 66, 12,
    66, 895, 9, 66, 1, 66, 1, 66, 3, 66, 899, 8, 66, 1, 66, 1, 66, 3, 66, 903, 8, 66, 1, 66, 1, 66,
    1, 67, 1, 67, 1, 68, 1, 68, 1, 68, 3, 68, 912, 8, 68, 1, 69, 1, 69, 1, 69, 1, 69, 1, 69, 3, 69,
    919, 8, 69, 1, 70, 1, 70, 1, 70, 3, 70, 924, 8, 70, 1, 70, 1, 70, 1, 70, 1, 71, 1, 71, 1, 71, 1,
    71, 1, 71, 1, 71, 3, 71, 935, 8, 71, 1, 71, 1, 71, 1, 71, 3, 71, 940, 8, 71, 1, 72, 1, 72, 1,
    72, 3, 72, 945, 8, 72, 1, 73, 1, 73, 1, 74, 1, 74, 1, 74, 1, 74, 3, 74, 953, 8, 74, 1, 74, 1,
    74, 1, 75, 1, 75, 1, 75, 1, 75, 1, 75, 1, 76, 1, 76, 1, 76, 1, 76, 1, 76, 3, 76, 967, 8, 76, 1,
    76, 1, 76, 1, 76, 3, 76, 972, 8, 76, 1, 77, 1, 77, 1, 77, 1, 77, 1, 78, 1, 78, 1, 78, 1, 78, 1,
    78, 3, 78, 983, 8, 78, 1, 78, 1, 78, 3, 78, 987, 8, 78, 1, 79, 1, 79, 1, 79, 3, 79, 992, 8, 79,
    1, 79, 1, 79, 5, 79, 996, 8, 79, 10, 79, 12, 79, 999, 9, 79, 1, 79, 1, 79, 1, 80, 1, 80, 1, 80,
    3, 80, 1006, 8, 80, 1, 81, 1, 81, 1, 81, 1, 82, 1, 82, 1, 82, 3, 82, 1014, 8, 82, 1, 83, 1, 83,
    1, 84, 1, 84, 1, 84, 1, 84, 1, 84, 1, 84, 3, 84, 1024, 8, 84, 1, 84, 1, 84, 1, 85, 1, 85, 1, 85,
    1, 85, 5, 85, 1032, 8, 85, 10, 85, 12, 85, 1035, 9, 85, 1, 85, 1, 85, 1, 85, 1, 86, 1, 86, 1,
    86, 3, 86, 1043, 8, 86, 1, 86, 1, 86, 3, 86, 1047, 8, 86, 1, 87, 1, 87, 1, 87, 3, 87, 1052, 8,
    87, 1, 88, 1, 88, 1, 88, 1, 88, 1, 89, 1, 89, 1, 89, 1, 89, 1, 89, 1, 90, 1, 90, 1, 90, 3, 90,
    1066, 8, 90, 1, 90, 1, 90, 5, 90, 1070, 8, 90, 10, 90, 12, 90, 1073, 9, 90, 1, 90, 1, 90, 1, 91,
    1, 91, 3, 91, 1079, 8, 91, 1, 92, 1, 92, 1, 92, 1, 92, 1, 93, 1, 93, 1, 94, 1, 94, 1, 94, 1, 94,
    3, 94, 1091, 8, 94, 1, 95, 1, 95, 3, 95, 1095, 8, 95, 1, 96, 1, 96, 1, 97, 1, 97, 1, 98, 1, 98,
    1, 99, 1, 99, 1, 100, 1, 100, 1, 101, 1, 101, 1, 101, 1, 101, 1, 102, 1, 102, 1, 103, 1, 103, 1,
    104, 1, 104, 1, 104, 0, 0, 105, 0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32,
    34, 36, 38, 40, 42, 44, 46, 48, 50, 52, 54, 56, 58, 60, 62, 64, 66, 68, 70, 72, 74, 76, 78, 80,
    82, 84, 86, 88, 90, 92, 94, 96, 98, 100, 102, 104, 106, 108, 110, 112, 114, 116, 118, 120, 122,
    124, 126, 128, 130, 132, 134, 136, 138, 140, 142, 144, 146, 148, 150, 152, 154, 156, 158, 160,
    162, 164, 166, 168, 170, 172, 174, 176, 178, 180, 182, 184, 186, 188, 190, 192, 194, 196, 198,
    200, 202, 204, 206, 208, 0, 14, 1, 0, 15, 17, 1, 0, 57, 58, 1, 0, 65, 70, 2, 0, 49, 49, 71, 73,
    1, 0, 74, 80, 2, 0, 11, 11, 81, 81, 1, 0, 82, 87, 1, 0, 89, 92, 1, 0, 93, 97, 1, 0, 98, 99, 1,
    0, 123, 124, 1, 0, 111, 112, 1, 0, 115, 119, 1, 0, 120, 122, 1156, 0, 212, 1, 0, 0, 0, 2, 222,
    1, 0, 0, 0, 4, 261, 1, 0, 0, 0, 6, 263, 1, 0, 0, 0, 8, 272, 1, 0, 0, 0, 10, 281, 1, 0, 0, 0, 12,
    289, 1, 0, 0, 0, 14, 313, 1, 0, 0, 0, 16, 315, 1, 0, 0, 0, 18, 324, 1, 0, 0, 0, 20, 328, 1, 0,
    0, 0, 22, 332, 1, 0, 0, 0, 24, 334, 1, 0, 0, 0, 26, 341, 1, 0, 0, 0, 28, 348, 1, 0, 0, 0, 30,
    354, 1, 0, 0, 0, 32, 360, 1, 0, 0, 0, 34, 376, 1, 0, 0, 0, 36, 416, 1, 0, 0, 0, 38, 441, 1, 0,
    0, 0, 40, 495, 1, 0, 0, 0, 42, 543, 1, 0, 0, 0, 44, 545, 1, 0, 0, 0, 46, 562, 1, 0, 0, 0, 48,
    564, 1, 0, 0, 0, 50, 569, 1, 0, 0, 0, 52, 571, 1, 0, 0, 0, 54, 573, 1, 0, 0, 0, 56, 583, 1, 0,
    0, 0, 58, 595, 1, 0, 0, 0, 60, 597, 1, 0, 0, 0, 62, 599, 1, 0, 0, 0, 64, 611, 1, 0, 0, 0, 66,
    626, 1, 0, 0, 0, 68, 631, 1, 0, 0, 0, 70, 634, 1, 0, 0, 0, 72, 651, 1, 0, 0, 0, 74, 653, 1, 0,
    0, 0, 76, 658, 1, 0, 0, 0, 78, 661, 1, 0, 0, 0, 80, 701, 1, 0, 0, 0, 82, 707, 1, 0, 0, 0, 84,
    728, 1, 0, 0, 0, 86, 730, 1, 0, 0, 0, 88, 743, 1, 0, 0, 0, 90, 745, 1, 0, 0, 0, 92, 757, 1, 0,
    0, 0, 94, 759, 1, 0, 0, 0, 96, 761, 1, 0, 0, 0, 98, 773, 1, 0, 0, 0, 100, 776, 1, 0, 0, 0, 102,
    779, 1, 0, 0, 0, 104, 782, 1, 0, 0, 0, 106, 785, 1, 0, 0, 0, 108, 795, 1, 0, 0, 0, 110, 804, 1,
    0, 0, 0, 112, 818, 1, 0, 0, 0, 114, 820, 1, 0, 0, 0, 116, 824, 1, 0, 0, 0, 118, 847, 1, 0, 0, 0,
    120, 861, 1, 0, 0, 0, 122, 866, 1, 0, 0, 0, 124, 868, 1, 0, 0, 0, 126, 870, 1, 0, 0, 0, 128,
    874, 1, 0, 0, 0, 130, 876, 1, 0, 0, 0, 132, 883, 1, 0, 0, 0, 134, 906, 1, 0, 0, 0, 136, 908, 1,
    0, 0, 0, 138, 918, 1, 0, 0, 0, 140, 923, 1, 0, 0, 0, 142, 928, 1, 0, 0, 0, 144, 944, 1, 0, 0, 0,
    146, 946, 1, 0, 0, 0, 148, 948, 1, 0, 0, 0, 150, 956, 1, 0, 0, 0, 152, 961, 1, 0, 0, 0, 154,
    973, 1, 0, 0, 0, 156, 977, 1, 0, 0, 0, 158, 988, 1, 0, 0, 0, 160, 1005, 1, 0, 0, 0, 162, 1007,
    1, 0, 0, 0, 164, 1013, 1, 0, 0, 0, 166, 1015, 1, 0, 0, 0, 168, 1017, 1, 0, 0, 0, 170, 1027, 1,
    0, 0, 0, 172, 1039, 1, 0, 0, 0, 174, 1051, 1, 0, 0, 0, 176, 1053, 1, 0, 0, 0, 178, 1057, 1, 0,
    0, 0, 180, 1062, 1, 0, 0, 0, 182, 1078, 1, 0, 0, 0, 184, 1080, 1, 0, 0, 0, 186, 1084, 1, 0, 0,
    0, 188, 1090, 1, 0, 0, 0, 190, 1094, 1, 0, 0, 0, 192, 1096, 1, 0, 0, 0, 194, 1098, 1, 0, 0, 0,
    196, 1100, 1, 0, 0, 0, 198, 1102, 1, 0, 0, 0, 200, 1104, 1, 0, 0, 0, 202, 1106, 1, 0, 0, 0, 204,
    1110, 1, 0, 0, 0, 206, 1112, 1, 0, 0, 0, 208, 1114, 1, 0, 0, 0, 210, 211, 5, 1, 0, 0, 211, 213,
    3, 166, 83, 0, 212, 210, 1, 0, 0, 0, 212, 213, 1, 0, 0, 0, 213, 217, 1, 0, 0, 0, 214, 215, 5, 2,
    0, 0, 215, 216, 5, 123, 0, 0, 216, 218, 5, 3, 0, 0, 217, 214, 1, 0, 0, 0, 217, 218, 1, 0, 0, 0,
    218, 219, 1, 0, 0, 0, 219, 220, 3, 34, 17, 0, 220, 221, 3, 32, 16, 0, 221, 1, 1, 0, 0, 0, 222,
    223, 5, 4, 0, 0, 223, 224, 3, 166, 83, 0, 224, 225, 5, 5, 0, 0, 225, 229, 5, 6, 0, 0, 226, 228,
    5, 126, 0, 0, 227, 226, 1, 0, 0, 0, 228, 231, 1, 0, 0, 0, 229, 227, 1, 0, 0, 0, 229, 230, 1, 0,
    0, 0, 230, 232, 1, 0, 0, 0, 231, 229, 1, 0, 0, 0, 232, 236, 5, 7, 0, 0, 233, 235, 3, 4, 2, 0,
    234, 233, 1, 0, 0, 0, 235, 238, 1, 0, 0, 0, 236, 234, 1, 0, 0, 0, 236, 237, 1, 0, 0, 0, 237,
    242, 1, 0, 0, 0, 238, 236, 1, 0, 0, 0, 239, 241, 3, 10, 5, 0, 240, 239, 1, 0, 0, 0, 241, 244, 1,
    0, 0, 0, 242, 240, 1, 0, 0, 0, 242, 243, 1, 0, 0, 0, 243, 248, 1, 0, 0, 0, 244, 242, 1, 0, 0, 0,
    245, 247, 3, 12, 6, 0, 246, 245, 1, 0, 0, 0, 247, 250, 1, 0, 0, 0, 248, 246, 1, 0, 0, 0, 248,
    249, 1, 0, 0, 0, 249, 254, 1, 0, 0, 0, 250, 248, 1, 0, 0, 0, 251, 253, 3, 18, 9, 0, 252, 251, 1,
    0, 0, 0, 253, 256, 1, 0, 0, 0, 254, 252, 1, 0, 0, 0, 254, 255, 1, 0, 0, 0, 255, 257, 1, 0, 0, 0,
    256, 254, 1, 0, 0, 0, 257, 258, 5, 8, 0, 0, 258, 3, 1, 0, 0, 0, 259, 262, 3, 6, 3, 0, 260, 262,
    3, 8, 4, 0, 261, 259, 1, 0, 0, 0, 261, 260, 1, 0, 0, 0, 262, 5, 1, 0, 0, 0, 263, 264, 5, 9, 0,
    0, 264, 265, 3, 166, 83, 0, 265, 266, 5, 10, 0, 0, 266, 267, 5, 126, 0, 0, 267, 268, 5, 126, 0,
    0, 268, 269, 5, 11, 0, 0, 269, 270, 5, 126, 0, 0, 270, 271, 5, 3, 0, 0, 271, 7, 1, 0, 0, 0, 272,
    273, 5, 12, 0, 0, 273, 274, 3, 166, 83, 0, 274, 275, 5, 10, 0, 0, 275, 276, 5, 126, 0, 0, 276,
    277, 5, 11, 0, 0, 277, 278, 5, 126, 0, 0, 278, 279, 5, 126, 0, 0, 279, 280, 5, 3, 0, 0, 280, 9,
    1, 0, 0, 0, 281, 282, 5, 13, 0, 0, 282, 283, 3, 166, 83, 0, 283, 284, 5, 10, 0, 0, 284, 285, 5,
    126, 0, 0, 285, 286, 5, 126, 0, 0, 286, 287, 5, 126, 0, 0, 287, 288, 5, 3, 0, 0, 288, 11, 1, 0,
    0, 0, 289, 290, 5, 14, 0, 0, 290, 291, 3, 166, 83, 0, 291, 292, 5, 11, 0, 0, 292, 293, 3, 14, 7,
    0, 293, 294, 5, 5, 0, 0, 294, 298, 5, 6, 0, 0, 295, 297, 5, 126, 0, 0, 296, 295, 1, 0, 0, 0,
    297, 300, 1, 0, 0, 0, 298, 296, 1, 0, 0, 0, 298, 299, 1, 0, 0, 0, 299, 301, 1, 0, 0, 0, 300,
    298, 1, 0, 0, 0, 301, 302, 5, 7, 0, 0, 302, 303, 5, 126, 0, 0, 303, 304, 5, 11, 0, 0, 304, 308,
    5, 126, 0, 0, 305, 307, 3, 16, 8, 0, 306, 305, 1, 0, 0, 0, 307, 310, 1, 0, 0, 0, 308, 306, 1, 0,
    0, 0, 308, 309, 1, 0, 0, 0, 309, 311, 1, 0, 0, 0, 310, 308, 1, 0, 0, 0, 311, 312, 5, 8, 0, 0,
    312, 13, 1, 0, 0, 0, 313, 314, 7, 0, 0, 0, 314, 15, 1, 0, 0, 0, 315, 316, 5, 18, 0, 0, 316, 317,
    3, 166, 83, 0, 317, 318, 5, 10, 0, 0, 318, 319, 5, 126, 0, 0, 319, 320, 5, 126, 0, 0, 320, 321,
    5, 3, 0, 0, 321, 17, 1, 0, 0, 0, 322, 325, 3, 20, 10, 0, 323, 325, 3, 22, 11, 0, 324, 322, 1, 0,
    0, 0, 324, 323, 1, 0, 0, 0, 325, 19, 1, 0, 0, 0, 326, 329, 3, 26, 13, 0, 327, 329, 3, 24, 12, 0,
    328, 326, 1, 0, 0, 0, 328, 327, 1, 0, 0, 0, 329, 21, 1, 0, 0, 0, 330, 333, 3, 28, 14, 0, 331,
    333, 3, 30, 15, 0, 332, 330, 1, 0, 0, 0, 332, 331, 1, 0, 0, 0, 333, 23, 1, 0, 0, 0, 334, 335, 5,
    19, 0, 0, 335, 336, 3, 166, 83, 0, 336, 337, 5, 10, 0, 0, 337, 338, 5, 126, 0, 0, 338, 339, 5,
    126, 0, 0, 339, 340, 5, 3, 0, 0, 340, 25, 1, 0, 0, 0, 341, 342, 5, 20, 0, 0, 342, 343, 3, 166,
    83, 0, 343, 344, 5, 10, 0, 0, 344, 345, 5, 126, 0, 0, 345, 346, 5, 126, 0, 0, 346, 347, 5, 3, 0,
    0, 347, 27, 1, 0, 0, 0, 348, 349, 5, 21, 0, 0, 349, 350, 3, 166, 83, 0, 350, 351, 5, 10, 0, 0,
    351, 352, 5, 126, 0, 0, 352, 353, 5, 3, 0, 0, 353, 29, 1, 0, 0, 0, 354, 355, 5, 22, 0, 0, 355,
    356, 3, 166, 83, 0, 356, 357, 5, 10, 0, 0, 357, 358, 5, 126, 0, 0, 358, 359, 5, 3, 0, 0, 359,
    31, 1, 0, 0, 0, 360, 361, 5, 23, 0, 0, 361, 365, 3, 166, 83, 0, 362, 363, 5, 10, 0, 0, 363, 364,
    5, 123, 0, 0, 364, 366, 5, 3, 0, 0, 365, 362, 1, 0, 0, 0, 365, 366, 1, 0, 0, 0, 366, 367, 1, 0,
    0, 0, 367, 371, 5, 5, 0, 0, 368, 370, 3, 78, 39, 0, 369, 368, 1, 0, 0, 0, 370, 373, 1, 0, 0, 0,
    371, 369, 1, 0, 0, 0, 371, 372, 1, 0, 0, 0, 372, 374, 1, 0, 0, 0, 373, 371, 1, 0, 0, 0, 374,
    375, 5, 8, 0, 0, 375, 33, 1, 0, 0, 0, 376, 377, 5, 24, 0, 0, 377, 381, 3, 166, 83, 0, 378, 379,
    5, 10, 0, 0, 379, 380, 5, 123, 0, 0, 380, 382, 5, 3, 0, 0, 381, 378, 1, 0, 0, 0, 381, 382, 1, 0,
    0, 0, 382, 383, 1, 0, 0, 0, 383, 387, 5, 5, 0, 0, 384, 386, 3, 38, 19, 0, 385, 384, 1, 0, 0, 0,
    386, 389, 1, 0, 0, 0, 387, 385, 1, 0, 0, 0, 387, 388, 1, 0, 0, 0, 388, 393, 1, 0, 0, 0, 389,
    387, 1, 0, 0, 0, 390, 392, 3, 36, 18, 0, 391, 390, 1, 0, 0, 0, 392, 395, 1, 0, 0, 0, 393, 391,
    1, 0, 0, 0, 393, 394, 1, 0, 0, 0, 394, 399, 1, 0, 0, 0, 395, 393, 1, 0, 0, 0, 396, 398, 3, 2, 1,
    0, 397, 396, 1, 0, 0, 0, 398, 401, 1, 0, 0, 0, 399, 397, 1, 0, 0, 0, 399, 400, 1, 0, 0, 0, 400,
    405, 1, 0, 0, 0, 401, 399, 1, 0, 0, 0, 402, 404, 3, 40, 20, 0, 403, 402, 1, 0, 0, 0, 404, 407,
    1, 0, 0, 0, 405, 403, 1, 0, 0, 0, 405, 406, 1, 0, 0, 0, 406, 411, 1, 0, 0, 0, 407, 405, 1, 0, 0,
    0, 408, 410, 3, 96, 48, 0, 409, 408, 1, 0, 0, 0, 410, 413, 1, 0, 0, 0, 411, 409, 1, 0, 0, 0,
    411, 412, 1, 0, 0, 0, 412, 414, 1, 0, 0, 0, 413, 411, 1, 0, 0, 0, 414, 415, 5, 8, 0, 0, 415, 35,
    1, 0, 0, 0, 416, 417, 5, 25, 0, 0, 417, 421, 3, 166, 83, 0, 418, 419, 5, 10, 0, 0, 419, 420, 5,
    123, 0, 0, 420, 422, 5, 3, 0, 0, 421, 418, 1, 0, 0, 0, 421, 422, 1, 0, 0, 0, 422, 425, 1, 0, 0,
    0, 423, 424, 5, 26, 0, 0, 424, 426, 5, 126, 0, 0, 425, 423, 1, 0, 0, 0, 425, 426, 1, 0, 0, 0,
    426, 427, 1, 0, 0, 0, 427, 431, 5, 5, 0, 0, 428, 429, 5, 2, 0, 0, 429, 430, 5, 123, 0, 0, 430,
    432, 5, 3, 0, 0, 431, 428, 1, 0, 0, 0, 431, 432, 1, 0, 0, 0, 432, 436, 1, 0, 0, 0, 433, 435, 5,
    126, 0, 0, 434, 433, 1, 0, 0, 0, 435, 438, 1, 0, 0, 0, 436, 434, 1, 0, 0, 0, 436, 437, 1, 0, 0,
    0, 437, 439, 1, 0, 0, 0, 438, 436, 1, 0, 0, 0, 439, 440, 5, 8, 0, 0, 440, 37, 1, 0, 0, 0, 441,
    442, 5, 27, 0, 0, 442, 443, 5, 28, 0, 0, 443, 445, 3, 166, 83, 0, 444, 446, 5, 10, 0, 0, 445,
    444, 1, 0, 0, 0, 445, 446, 1, 0, 0, 0, 446, 448, 1, 0, 0, 0, 447, 449, 5, 123, 0, 0, 448, 447,
    1, 0, 0, 0, 448, 449, 1, 0, 0, 0, 449, 451, 1, 0, 0, 0, 450, 452, 5, 3, 0, 0, 451, 450, 1, 0, 0,
    0, 451, 452, 1, 0, 0, 0, 452, 462, 1, 0, 0, 0, 453, 454, 3, 94, 47, 0, 454, 459, 5, 126, 0, 0,
    455, 456, 5, 29, 0, 0, 456, 458, 5, 126, 0, 0, 457, 455, 1, 0, 0, 0, 458, 461, 1, 0, 0, 0, 459,
    457, 1, 0, 0, 0, 459, 460, 1, 0, 0, 0, 460, 463, 1, 0, 0, 0, 461, 459, 1, 0, 0, 0, 462, 453, 1,
    0, 0, 0, 462, 463, 1, 0, 0, 0, 463, 475, 1, 0, 0, 0, 464, 465, 5, 30, 0, 0, 465, 466, 5, 10, 0,
    0, 466, 471, 5, 126, 0, 0, 467, 468, 5, 29, 0, 0, 468, 470, 5, 126, 0, 0, 469, 467, 1, 0, 0, 0,
    470, 473, 1, 0, 0, 0, 471, 469, 1, 0, 0, 0, 471, 472, 1, 0, 0, 0, 472, 474, 1, 0, 0, 0, 473,
    471, 1, 0, 0, 0, 474, 476, 5, 3, 0, 0, 475, 464, 1, 0, 0, 0, 475, 476, 1, 0, 0, 0, 476, 488, 1,
    0, 0, 0, 477, 478, 5, 31, 0, 0, 478, 479, 5, 10, 0, 0, 479, 484, 5, 126, 0, 0, 480, 481, 5, 29,
    0, 0, 481, 483, 5, 126, 0, 0, 482, 480, 1, 0, 0, 0, 483, 486, 1, 0, 0, 0, 484, 482, 1, 0, 0, 0,
    484, 485, 1, 0, 0, 0, 485, 487, 1, 0, 0, 0, 486, 484, 1, 0, 0, 0, 487, 489, 5, 3, 0, 0, 488,
    477, 1, 0, 0, 0, 488, 489, 1, 0, 0, 0, 489, 493, 1, 0, 0, 0, 490, 491, 5, 2, 0, 0, 491, 492, 5,
    123, 0, 0, 492, 494, 5, 3, 0, 0, 493, 490, 1, 0, 0, 0, 493, 494, 1, 0, 0, 0, 494, 39, 1, 0, 0,
    0, 495, 496, 5, 32, 0, 0, 496, 497, 3, 166, 83, 0, 497, 501, 5, 5, 0, 0, 498, 499, 5, 2, 0, 0,
    499, 500, 5, 123, 0, 0, 500, 502, 5, 3, 0, 0, 501, 498, 1, 0, 0, 0, 501, 502, 1, 0, 0, 0, 502,
    510, 1, 0, 0, 0, 503, 507, 5, 33, 0, 0, 504, 506, 3, 70, 35, 0, 505, 504, 1, 0, 0, 0, 506, 509,
    1, 0, 0, 0, 507, 505, 1, 0, 0, 0, 507, 508, 1, 0, 0, 0, 508, 511, 1, 0, 0, 0, 509, 507, 1, 0, 0,
    0, 510, 503, 1, 0, 0, 0, 510, 511, 1, 0, 0, 0, 511, 519, 1, 0, 0, 0, 512, 516, 5, 34, 0, 0, 513,
    515, 3, 80, 40, 0, 514, 513, 1, 0, 0, 0, 515, 518, 1, 0, 0, 0, 516, 514, 1, 0, 0, 0, 516, 517,
    1, 0, 0, 0, 517, 520, 1, 0, 0, 0, 518, 516, 1, 0, 0, 0, 519, 512, 1, 0, 0, 0, 519, 520, 1, 0, 0,
    0, 520, 528, 1, 0, 0, 0, 521, 525, 5, 35, 0, 0, 522, 524, 5, 126, 0, 0, 523, 522, 1, 0, 0, 0,
    524, 527, 1, 0, 0, 0, 525, 523, 1, 0, 0, 0, 525, 526, 1, 0, 0, 0, 526, 529, 1, 0, 0, 0, 527,
    525, 1, 0, 0, 0, 528, 521, 1, 0, 0, 0, 528, 529, 1, 0, 0, 0, 529, 537, 1, 0, 0, 0, 530, 534, 5,
    36, 0, 0, 531, 533, 3, 86, 43, 0, 532, 531, 1, 0, 0, 0, 533, 536, 1, 0, 0, 0, 534, 532, 1, 0, 0,
    0, 534, 535, 1, 0, 0, 0, 535, 538, 1, 0, 0, 0, 536, 534, 1, 0, 0, 0, 537, 530, 1, 0, 0, 0, 537,
    538, 1, 0, 0, 0, 538, 539, 1, 0, 0, 0, 539, 540, 5, 8, 0, 0, 540, 41, 1, 0, 0, 0, 541, 544, 3,
    36, 18, 0, 542, 544, 3, 40, 20, 0, 543, 541, 1, 0, 0, 0, 543, 542, 1, 0, 0, 0, 544, 43, 1, 0, 0,
    0, 545, 546, 5, 126, 0, 0, 546, 550, 5, 5, 0, 0, 547, 549, 3, 46, 23, 0, 548, 547, 1, 0, 0, 0,
    549, 552, 1, 0, 0, 0, 550, 548, 1, 0, 0, 0, 550, 551, 1, 0, 0, 0, 551, 553, 1, 0, 0, 0, 552,
    550, 1, 0, 0, 0, 553, 554, 5, 8, 0, 0, 554, 45, 1, 0, 0, 0, 555, 563, 3, 60, 30, 0, 556, 563, 3,
    58, 29, 0, 557, 563, 3, 52, 26, 0, 558, 563, 3, 50, 25, 0, 559, 563, 3, 54, 27, 0, 560, 563, 3,
    56, 28, 0, 561, 563, 3, 48, 24, 0, 562, 555, 1, 0, 0, 0, 562, 556, 1, 0, 0, 0, 562, 557, 1, 0,
    0, 0, 562, 558, 1, 0, 0, 0, 562, 559, 1, 0, 0, 0, 562, 560, 1, 0, 0, 0, 562, 561, 1, 0, 0, 0,
    563, 47, 1, 0, 0, 0, 564, 565, 5, 11, 0, 0, 565, 566, 5, 126, 0, 0, 566, 567, 5, 37, 0, 0, 567,
    568, 5, 126, 0, 0, 568, 49, 1, 0, 0, 0, 569, 570, 5, 38, 0, 0, 570, 51, 1, 0, 0, 0, 571, 572, 5,
    39, 0, 0, 572, 53, 1, 0, 0, 0, 573, 574, 5, 40, 0, 0, 574, 575, 5, 11, 0, 0, 575, 577, 5, 10, 0,
    0, 576, 578, 5, 126, 0, 0, 577, 576, 1, 0, 0, 0, 578, 579, 1, 0, 0, 0, 579, 577, 1, 0, 0, 0,
    579, 580, 1, 0, 0, 0, 580, 581, 1, 0, 0, 0, 581, 582, 5, 3, 0, 0, 582, 55, 1, 0, 0, 0, 583, 585,
    5, 10, 0, 0, 584, 586, 5, 126, 0, 0, 585, 584, 1, 0, 0, 0, 586, 587, 1, 0, 0, 0, 587, 585, 1, 0,
    0, 0, 587, 588, 1, 0, 0, 0, 588, 589, 1, 0, 0, 0, 589, 590, 5, 3, 0, 0, 590, 591, 5, 11, 0, 0,
    591, 592, 5, 41, 0, 0, 592, 57, 1, 0, 0, 0, 593, 596, 3, 62, 31, 0, 594, 596, 3, 64, 32, 0, 595,
    593, 1, 0, 0, 0, 595, 594, 1, 0, 0, 0, 596, 59, 1, 0, 0, 0, 597, 598, 5, 126, 0, 0, 598, 61, 1,
    0, 0, 0, 599, 600, 5, 42, 0, 0, 600, 601, 5, 11, 0, 0, 601, 602, 3, 166, 83, 0, 602, 606, 5, 5,
    0, 0, 603, 605, 3, 46, 23, 0, 604, 603, 1, 0, 0, 0, 605, 608, 1, 0, 0, 0, 606, 604, 1, 0, 0, 0,
    606, 607, 1, 0, 0, 0, 607, 609, 1, 0, 0, 0, 608, 606, 1, 0, 0, 0, 609, 610, 5, 8, 0, 0, 610, 63,
    1, 0, 0, 0, 611, 612, 5, 43, 0, 0, 612, 613, 5, 11, 0, 0, 613, 614, 3, 166, 83, 0, 614, 618, 5,
    5, 0, 0, 615, 617, 3, 66, 33, 0, 616, 615, 1, 0, 0, 0, 617, 620, 1, 0, 0, 0, 618, 616, 1, 0, 0,
    0, 618, 619, 1, 0, 0, 0, 619, 622, 1, 0, 0, 0, 620, 618, 1, 0, 0, 0, 621, 623, 3, 68, 34, 0,
    622, 621, 1, 0, 0, 0, 622, 623, 1, 0, 0, 0, 623, 624, 1, 0, 0, 0, 624, 625, 5, 8, 0, 0, 625, 65,
    1, 0, 0, 0, 626, 627, 5, 44, 0, 0, 627, 628, 3, 166, 83, 0, 628, 629, 5, 11, 0, 0, 629, 630, 3,
    60, 30, 0, 630, 67, 1, 0, 0, 0, 631, 632, 5, 45, 0, 0, 632, 633, 3, 60, 30, 0, 633, 69, 1, 0, 0,
    0, 634, 635, 3, 72, 36, 0, 635, 637, 5, 10, 0, 0, 636, 638, 3, 74, 37, 0, 637, 636, 1, 0, 0, 0,
    637, 638, 1, 0, 0, 0, 638, 643, 1, 0, 0, 0, 639, 640, 5, 29, 0, 0, 640, 642, 3, 74, 37, 0, 641,
    639, 1, 0, 0, 0, 642, 645, 1, 0, 0, 0, 643, 641, 1, 0, 0, 0, 643, 644, 1, 0, 0, 0, 644, 646, 1,
    0, 0, 0, 645, 643, 1, 0, 0, 0, 646, 649, 5, 3, 0, 0, 647, 648, 5, 37, 0, 0, 648, 650, 3, 84, 42,
    0, 649, 647, 1, 0, 0, 0, 649, 650, 1, 0, 0, 0, 650, 71, 1, 0, 0, 0, 651, 652, 3, 166, 83, 0,
    652, 73, 1, 0, 0, 0, 653, 656, 3, 76, 38, 0, 654, 655, 5, 37, 0, 0, 655, 657, 3, 84, 42, 0, 656,
    654, 1, 0, 0, 0, 656, 657, 1, 0, 0, 0, 657, 75, 1, 0, 0, 0, 658, 659, 3, 166, 83, 0, 659, 77, 1,
    0, 0, 0, 660, 662, 5, 46, 0, 0, 661, 660, 1, 0, 0, 0, 661, 662, 1, 0, 0, 0, 662, 663, 1, 0, 0,
    0, 663, 664, 5, 47, 0, 0, 664, 667, 3, 166, 83, 0, 665, 666, 5, 26, 0, 0, 666, 668, 5, 126, 0,
    0, 667, 665, 1, 0, 0, 0, 667, 668, 1, 0, 0, 0, 668, 669, 1, 0, 0, 0, 669, 673, 5, 5, 0, 0, 670,
    671, 5, 2, 0, 0, 671, 672, 5, 123, 0, 0, 672, 674, 5, 3, 0, 0, 673, 670, 1, 0, 0, 0, 673, 674,
    1, 0, 0, 0, 674, 678, 1, 0, 0, 0, 675, 677, 3, 80, 40, 0, 676, 675, 1, 0, 0, 0, 677, 680, 1, 0,
    0, 0, 678, 676, 1, 0, 0, 0, 678, 679, 1, 0, 0, 0, 679, 688, 1, 0, 0, 0, 680, 678, 1, 0, 0, 0,
    681, 685, 5, 48, 0, 0, 682, 684, 3, 82, 41, 0, 683, 682, 1, 0, 0, 0, 684, 687, 1, 0, 0, 0, 685,
    683, 1, 0, 0, 0, 685, 686, 1, 0, 0, 0, 686, 689, 1, 0, 0, 0, 687, 685, 1, 0, 0, 0, 688, 681, 1,
    0, 0, 0, 688, 689, 1, 0, 0, 0, 689, 697, 1, 0, 0, 0, 690, 694, 5, 36, 0, 0, 691, 693, 3, 86, 43,
    0, 692, 691, 1, 0, 0, 0, 693, 696, 1, 0, 0, 0, 694, 692, 1, 0, 0, 0, 694, 695, 1, 0, 0, 0, 695,
    698, 1, 0, 0, 0, 696, 694, 1, 0, 0, 0, 697, 690, 1, 0, 0, 0, 697, 698, 1, 0, 0, 0, 698, 699, 1,
    0, 0, 0, 699, 700, 5, 8, 0, 0, 700, 79, 1, 0, 0, 0, 701, 702, 3, 166, 83, 0, 702, 703, 5, 37, 0,
    0, 703, 705, 3, 84, 42, 0, 704, 706, 5, 49, 0, 0, 705, 704, 1, 0, 0, 0, 705, 706, 1, 0, 0, 0,
    706, 81, 1, 0, 0, 0, 707, 708, 3, 166, 83, 0, 708, 709, 5, 37, 0, 0, 709, 711, 5, 126, 0, 0,
    710, 712, 5, 49, 0, 0, 711, 710, 1, 0, 0, 0, 711, 712, 1, 0, 0, 0, 712, 714, 1, 0, 0, 0, 713,
    715, 5, 50, 0, 0, 714, 713, 1, 0, 0, 0, 714, 715, 1, 0, 0, 0, 715, 717, 1, 0, 0, 0, 716, 718, 5,
    51, 0, 0, 717, 716, 1, 0, 0, 0, 717, 718, 1, 0, 0, 0, 718, 720, 1, 0, 0, 0, 719, 721, 5, 52, 0,
    0, 720, 719, 1, 0, 0, 0, 720, 721, 1, 0, 0, 0, 721, 722, 1, 0, 0, 0, 722, 723, 3, 208, 104, 0,
    723, 83, 1, 0, 0, 0, 724, 729, 3, 88, 44, 0, 725, 729, 3, 206, 103, 0, 726, 729, 3, 90, 45, 0,
    727, 729, 3, 178, 89, 0, 728, 724, 1, 0, 0, 0, 728, 725, 1, 0, 0, 0, 728, 726, 1, 0, 0, 0, 728,
    727, 1, 0, 0, 0, 729, 85, 1, 0, 0, 0, 730, 731, 5, 53, 0, 0, 731, 732, 3, 166, 83, 0, 732, 738,
    5, 37, 0, 0, 733, 734, 5, 5, 0, 0, 734, 735, 3, 112, 56, 0, 735, 736, 5, 8, 0, 0, 736, 739, 1,
    0, 0, 0, 737, 739, 3, 112, 56, 0, 738, 733, 1, 0, 0, 0, 738, 737, 1, 0, 0, 0, 739, 741, 1, 0, 0,
    0, 740, 742, 5, 54, 0, 0, 741, 740, 1, 0, 0, 0, 741, 742, 1, 0, 0, 0, 742, 87, 1, 0, 0, 0, 743,
    744, 5, 126, 0, 0, 744, 89, 1, 0, 0, 0, 745, 746, 3, 166, 83, 0, 746, 747, 5, 55, 0, 0, 747,
    752, 3, 92, 46, 0, 748, 749, 5, 56, 0, 0, 749, 751, 3, 92, 46, 0, 750, 748, 1, 0, 0, 0, 751,
    754, 1, 0, 0, 0, 752, 750, 1, 0, 0, 0, 752, 753, 1, 0, 0, 0, 753, 755, 1, 0, 0, 0, 754, 752, 1,
    0, 0, 0, 755, 756, 5, 7, 0, 0, 756, 91, 1, 0, 0, 0, 757, 758, 5, 126, 0, 0, 758, 93, 1, 0, 0, 0,
    759, 760, 7, 1, 0, 0, 760, 95, 1, 0, 0, 0, 761, 762, 5, 59, 0, 0, 762, 763, 5, 126, 0, 0, 763,
    764, 5, 28, 0, 0, 764, 765, 3, 70, 35, 0, 765, 767, 5, 5, 0, 0, 766, 768, 3, 106, 53, 0, 767,
    766, 1, 0, 0, 0, 767, 768, 1, 0, 0, 0, 768, 769, 1, 0, 0, 0, 769, 770, 3, 108, 54, 0, 770, 771,
    3, 110, 55, 0, 771, 772, 5, 8, 0, 0, 772, 97, 1, 0, 0, 0, 773, 774, 3, 96, 48, 0, 774, 775, 5,
    0, 0, 1, 775, 99, 1, 0, 0, 0, 776, 777, 3, 106, 53, 0, 777, 778, 5, 0, 0, 1, 778, 101, 1, 0, 0,
    0, 779, 780, 3, 108, 54, 0, 780, 781, 5, 0, 0, 1, 781, 103, 1, 0, 0, 0, 782, 783, 3, 110, 55, 0,
    783, 784, 5, 0, 0, 1, 784, 105, 1, 0, 0, 0, 785, 786, 5, 60, 0, 0, 786, 787, 5, 37, 0, 0, 787,
    792, 3, 172, 86, 0, 788, 789, 5, 29, 0, 0, 789, 791, 3, 172, 86, 0, 790, 788, 1, 0, 0, 0, 791,
    794, 1, 0, 0, 0, 792, 790, 1, 0, 0, 0, 792, 793, 1, 0, 0, 0, 793, 107, 1, 0, 0, 0, 794, 792, 1,
    0, 0, 0, 795, 796, 5, 61, 0, 0, 796, 802, 5, 37, 0, 0, 797, 803, 3, 112, 56, 0, 798, 799, 5, 5,
    0, 0, 799, 800, 3, 112, 56, 0, 800, 801, 5, 8, 0, 0, 801, 803, 1, 0, 0, 0, 802, 797, 1, 0, 0, 0,
    802, 798, 1, 0, 0, 0, 803, 109, 1, 0, 0, 0, 804, 805, 5, 62, 0, 0, 805, 811, 5, 37, 0, 0, 806,
    812, 3, 112, 56, 0, 807, 808, 5, 5, 0, 0, 808, 809, 3, 112, 56, 0, 809, 810, 5, 8, 0, 0, 810,
    812, 1, 0, 0, 0, 811, 806, 1, 0, 0, 0, 811, 807, 1, 0, 0, 0, 812, 111, 1, 0, 0, 0, 813, 819, 3,
    174, 87, 0, 814, 819, 3, 170, 85, 0, 815, 819, 3, 168, 84, 0, 816, 819, 3, 116, 58, 0, 817, 819,
    3, 114, 57, 0, 818, 813, 1, 0, 0, 0, 818, 814, 1, 0, 0, 0, 818, 815, 1, 0, 0, 0, 818, 816, 1, 0,
    0, 0, 818, 817, 1, 0, 0, 0, 819, 113, 1, 0, 0, 0, 820, 821, 5, 10, 0, 0, 821, 822, 3, 112, 56,
    0, 822, 823, 5, 3, 0, 0, 823, 115, 1, 0, 0, 0, 824, 845, 3, 118, 59, 0, 825, 829, 5, 63, 0, 0,
    826, 830, 3, 118, 59, 0, 827, 830, 3, 168, 84, 0, 828, 830, 3, 114, 57, 0, 829, 826, 1, 0, 0, 0,
    829, 827, 1, 0, 0, 0, 829, 828, 1, 0, 0, 0, 830, 832, 1, 0, 0, 0, 831, 825, 1, 0, 0, 0, 832,
    833, 1, 0, 0, 0, 833, 831, 1, 0, 0, 0, 833, 834, 1, 0, 0, 0, 834, 846, 1, 0, 0, 0, 835, 839, 5,
    64, 0, 0, 836, 840, 3, 118, 59, 0, 837, 840, 3, 168, 84, 0, 838, 840, 3, 114, 57, 0, 839, 836,
    1, 0, 0, 0, 839, 837, 1, 0, 0, 0, 839, 838, 1, 0, 0, 0, 840, 842, 1, 0, 0, 0, 841, 835, 1, 0, 0,
    0, 842, 843, 1, 0, 0, 0, 843, 841, 1, 0, 0, 0, 843, 844, 1, 0, 0, 0, 844, 846, 1, 0, 0, 0, 845,
    831, 1, 0, 0, 0, 845, 841, 1, 0, 0, 0, 845, 846, 1, 0, 0, 0, 846, 117, 1, 0, 0, 0, 847, 857, 3,
    120, 60, 0, 848, 849, 3, 124, 62, 0, 849, 855, 3, 122, 61, 0, 850, 853, 3, 126, 63, 0, 851, 854,
    3, 188, 94, 0, 852, 854, 3, 118, 59, 0, 853, 851, 1, 0, 0, 0, 853, 852, 1, 0, 0, 0, 854, 856, 1,
    0, 0, 0, 855, 850, 1, 0, 0, 0, 855, 856, 1, 0, 0, 0, 856, 858, 1, 0, 0, 0, 857, 848, 1, 0, 0, 0,
    857, 858, 1, 0, 0, 0, 858, 119, 1, 0, 0, 0, 859, 862, 3, 164, 82, 0, 860, 862, 3, 128, 64, 0,
    861, 859, 1, 0, 0, 0, 861, 860, 1, 0, 0, 0, 862, 121, 1, 0, 0, 0, 863, 867, 3, 174, 87, 0, 864,
    867, 3, 164, 82, 0, 865, 867, 3, 128, 64, 0, 866, 863, 1, 0, 0, 0, 866, 864, 1, 0, 0, 0, 866,
    865, 1, 0, 0, 0, 867, 123, 1, 0, 0, 0, 868, 869, 7, 2, 0, 0, 869, 125, 1, 0, 0, 0, 870, 871, 7,
    3, 0, 0, 871, 127, 1, 0, 0, 0, 872, 875, 3, 138, 69, 0, 873, 875, 3, 130, 65, 0, 874, 872, 1, 0,
    0, 0, 874, 873, 1, 0, 0, 0, 875, 129, 1, 0, 0, 0, 876, 877, 3, 132, 66, 0, 877, 131, 1, 0, 0, 0,
    878, 881, 3, 154, 77, 0, 879, 881, 3, 156, 78, 0, 880, 878, 1, 0, 0, 0, 880, 879, 1, 0, 0, 0,
    881, 884, 1, 0, 0, 0, 882, 884, 3, 166, 83, 0, 883, 880, 1, 0, 0, 0, 883, 882, 1, 0, 0, 0, 884,
    885, 1, 0, 0, 0, 885, 886, 5, 11, 0, 0, 886, 887, 3, 134, 67, 0, 887, 898, 5, 10, 0, 0, 888,
    893, 3, 172, 86, 0, 889, 890, 5, 29, 0, 0, 890, 892, 3, 172, 86, 0, 891, 889, 1, 0, 0, 0, 892,
    895, 1, 0, 0, 0, 893, 891, 1, 0, 0, 0, 893, 894, 1, 0, 0, 0, 894, 896, 1, 0, 0, 0, 895, 893, 1,
    0, 0, 0, 896, 897, 5, 56, 0, 0, 897, 899, 1, 0, 0, 0, 898, 888, 1, 0, 0, 0, 898, 899, 1, 0, 0,
    0, 899, 902, 1, 0, 0, 0, 900, 903, 3, 116, 58, 0, 901, 903, 3, 168, 84, 0, 902, 900, 1, 0, 0, 0,
    902, 901, 1, 0, 0, 0, 903, 904, 1, 0, 0, 0, 904, 905, 5, 3, 0, 0, 905, 133, 1, 0, 0, 0, 906,
    907, 7, 4, 0, 0, 907, 135, 1, 0, 0, 0, 908, 911, 3, 112, 56, 0, 909, 910, 5, 29, 0, 0, 910, 912,
    3, 136, 68, 0, 911, 909, 1, 0, 0, 0, 911, 912, 1, 0, 0, 0, 912, 137, 1, 0, 0, 0, 913, 919, 3,
    156, 78, 0, 914, 919, 3, 154, 77, 0, 915, 919, 3, 142, 71, 0, 916, 919, 3, 140, 70, 0, 917, 919,
    3, 158, 79, 0, 918, 913, 1, 0, 0, 0, 918, 914, 1, 0, 0, 0, 918, 915, 1, 0, 0, 0, 918, 916, 1, 0,
    0, 0, 918, 917, 1, 0, 0, 0, 919, 139, 1, 0, 0, 0, 920, 924, 3, 154, 77, 0, 921, 924, 3, 156, 78,
    0, 922, 924, 3, 166, 83, 0, 923, 920, 1, 0, 0, 0, 923, 921, 1, 0, 0, 0, 923, 922, 1, 0, 0, 0,
    924, 925, 1, 0, 0, 0, 925, 926, 5, 11, 0, 0, 926, 927, 3, 150, 75, 0, 927, 141, 1, 0, 0, 0, 928,
    939, 3, 164, 82, 0, 929, 930, 7, 5, 0, 0, 930, 940, 3, 144, 72, 0, 931, 932, 5, 81, 0, 0, 932,
    934, 3, 164, 82, 0, 933, 935, 3, 162, 81, 0, 934, 933, 1, 0, 0, 0, 934, 935, 1, 0, 0, 0, 935,
    936, 1, 0, 0, 0, 936, 937, 7, 5, 0, 0, 937, 938, 3, 144, 72, 0, 938, 940, 1, 0, 0, 0, 939, 929,
    1, 0, 0, 0, 939, 931, 1, 0, 0, 0, 940, 143, 1, 0, 0, 0, 941, 945, 3, 146, 73, 0, 942, 945, 3,
    148, 74, 0, 943, 945, 3, 152, 76, 0, 944, 941, 1, 0, 0, 0, 944, 942, 1, 0, 0, 0, 944, 943, 1, 0,
    0, 0, 945, 145, 1, 0, 0, 0, 946, 947, 7, 6, 0, 0, 947, 147, 1, 0, 0, 0, 948, 949, 5, 88, 0, 0,
    949, 952, 5, 10, 0, 0, 950, 953, 3, 206, 103, 0, 951, 953, 3, 88, 44, 0, 952, 950, 1, 0, 0, 0,
    952, 951, 1, 0, 0, 0, 953, 954, 1, 0, 0, 0, 954, 955, 5, 3, 0, 0, 955, 149, 1, 0, 0, 0, 956,
    957, 7, 7, 0, 0, 957, 958, 5, 10, 0, 0, 958, 959, 3, 166, 83, 0, 959, 960, 5, 3, 0, 0, 960, 151,
    1, 0, 0, 0, 961, 962, 7, 8, 0, 0, 962, 966, 5, 10, 0, 0, 963, 967, 3, 166, 83, 0, 964, 967, 3,
    190, 95, 0, 965, 967, 3, 156, 78, 0, 966, 963, 1, 0, 0, 0, 966, 964, 1, 0, 0, 0, 966, 965, 1, 0,
    0, 0, 967, 968, 1, 0, 0, 0, 968, 971, 5, 3, 0, 0, 969, 970, 5, 81, 0, 0, 970, 972, 3, 152, 76,
    0, 971, 969, 1, 0, 0, 0, 971, 972, 1, 0, 0, 0, 972, 153, 1, 0, 0, 0, 973, 974, 3, 166, 83, 0,
    974, 975, 5, 81, 0, 0, 975, 976, 7, 9, 0, 0, 976, 155, 1, 0, 0, 0, 977, 978, 3, 164, 82, 0, 978,
    982, 5, 81, 0, 0, 979, 980, 3, 164, 82, 0, 980, 981, 5, 81, 0, 0, 981, 983, 1, 0, 0, 0, 982,
    979, 1, 0, 0, 0, 982, 983, 1, 0, 0, 0, 983, 984, 1, 0, 0, 0, 984, 986, 3, 166, 83, 0, 985, 987,
    3, 162, 81, 0, 986, 985, 1, 0, 0, 0, 986, 987, 1, 0, 0, 0, 987, 157, 1, 0, 0, 0, 988, 989, 3,
    166, 83, 0, 989, 991, 5, 10, 0, 0, 990, 992, 3, 160, 80, 0, 991, 990, 1, 0, 0, 0, 991, 992, 1,
    0, 0, 0, 992, 997, 1, 0, 0, 0, 993, 994, 5, 29, 0, 0, 994, 996, 3, 160, 80, 0, 995, 993, 1, 0,
    0, 0, 996, 999, 1, 0, 0, 0, 997, 995, 1, 0, 0, 0, 997, 998, 1, 0, 0, 0, 998, 1000, 1, 0, 0, 0,
    999, 997, 1, 0, 0, 0, 1000, 1001, 5, 3, 0, 0, 1001, 159, 1, 0, 0, 0, 1002, 1006, 3, 166, 83, 0,
    1003, 1006, 3, 156, 78, 0, 1004, 1006, 7, 10, 0, 0, 1005, 1002, 1, 0, 0, 0, 1005, 1003, 1, 0, 0,
    0, 1005, 1004, 1, 0, 0, 0, 1006, 161, 1, 0, 0, 0, 1007, 1008, 5, 100, 0, 0, 1008, 1009, 5, 101,
    0, 0, 1009, 163, 1, 0, 0, 0, 1010, 1014, 5, 102, 0, 0, 1011, 1014, 5, 103, 0, 0, 1012, 1014, 3,
    166, 83, 0, 1013, 1010, 1, 0, 0, 0, 1013, 1011, 1, 0, 0, 0, 1013, 1012, 1, 0, 0, 0, 1014, 165,
    1, 0, 0, 0, 1015, 1016, 5, 126, 0, 0, 1016, 167, 1, 0, 0, 0, 1017, 1018, 5, 104, 0, 0, 1018,
    1019, 3, 112, 56, 0, 1019, 1020, 5, 105, 0, 0, 1020, 1023, 3, 112, 56, 0, 1021, 1022, 5, 106, 0,
    0, 1022, 1024, 3, 112, 56, 0, 1023, 1021, 1, 0, 0, 0, 1023, 1024, 1, 0, 0, 0, 1024, 1025, 1, 0,
    0, 0, 1025, 1026, 5, 107, 0, 0, 1026, 169, 1, 0, 0, 0, 1027, 1028, 5, 108, 0, 0, 1028, 1033, 3,
    172, 86, 0, 1029, 1030, 5, 29, 0, 0, 1030, 1032, 3, 172, 86, 0, 1031, 1029, 1, 0, 0, 0, 1032,
    1035, 1, 0, 0, 0, 1033, 1031, 1, 0, 0, 0, 1033, 1034, 1, 0, 0, 0, 1034, 1036, 1, 0, 0, 0, 1035,
    1033, 1, 0, 0, 0, 1036, 1037, 5, 109, 0, 0, 1037, 1038, 3, 112, 56, 0, 1038, 171, 1, 0, 0, 0,
    1039, 1042, 3, 166, 83, 0, 1040, 1041, 5, 37, 0, 0, 1041, 1043, 3, 84, 42, 0, 1042, 1040, 1, 0,
    0, 0, 1042, 1043, 1, 0, 0, 0, 1043, 1046, 1, 0, 0, 0, 1044, 1045, 5, 69, 0, 0, 1045, 1047, 3,
    112, 56, 0, 1046, 1044, 1, 0, 0, 0, 1046, 1047, 1, 0, 0, 0, 1047, 173, 1, 0, 0, 0, 1048, 1052,
    3, 180, 90, 0, 1049, 1052, 3, 188, 94, 0, 1050, 1052, 3, 176, 88, 0, 1051, 1048, 1, 0, 0, 0,
    1051, 1049, 1, 0, 0, 0, 1051, 1050, 1, 0, 0, 0, 1052, 175, 1, 0, 0, 0, 1053, 1054, 3, 166, 83,
    0, 1054, 1055, 5, 28, 0, 0, 1055, 1056, 5, 126, 0, 0, 1056, 177, 1, 0, 0, 0, 1057, 1058, 3, 204,
    102, 0, 1058, 1059, 5, 10, 0, 0, 1059, 1060, 3, 84, 42, 0, 1060, 1061, 5, 3, 0, 0, 1061, 179, 1,
    0, 0, 0, 1062, 1063, 3, 204, 102, 0, 1063, 1065, 5, 5, 0, 0, 1064, 1066, 3, 182, 91, 0, 1065,
    1064, 1, 0, 0, 0, 1065, 1066, 1, 0, 0, 0, 1066, 1071, 1, 0, 0, 0, 1067, 1068, 5, 29, 0, 0, 1068,
    1070, 3, 182, 91, 0, 1069, 1067, 1, 0, 0, 0, 1070, 1073, 1, 0, 0, 0, 1071, 1069, 1, 0, 0, 0,
    1071, 1072, 1, 0, 0, 0, 1072, 1074, 1, 0, 0, 0, 1073, 1071, 1, 0, 0, 0, 1074, 1075, 5, 8, 0, 0,
    1075, 181, 1, 0, 0, 0, 1076, 1079, 3, 184, 92, 0, 1077, 1079, 3, 186, 93, 0, 1078, 1076, 1, 0,
    0, 0, 1078, 1077, 1, 0, 0, 0, 1079, 183, 1, 0, 0, 0, 1080, 1081, 3, 112, 56, 0, 1081, 1082, 5,
    110, 0, 0, 1082, 1083, 3, 112, 56, 0, 1083, 185, 1, 0, 0, 0, 1084, 1085, 3, 112, 56, 0, 1085,
    187, 1, 0, 0, 0, 1086, 1091, 3, 190, 95, 0, 1087, 1091, 3, 198, 99, 0, 1088, 1091, 3, 196, 98,
    0, 1089, 1091, 3, 200, 100, 0, 1090, 1086, 1, 0, 0, 0, 1090, 1087, 1, 0, 0, 0, 1090, 1088, 1, 0,
    0, 0, 1090, 1089, 1, 0, 0, 0, 1091, 189, 1, 0, 0, 0, 1092, 1095, 3, 192, 96, 0, 1093, 1095, 3,
    194, 97, 0, 1094, 1092, 1, 0, 0, 0, 1094, 1093, 1, 0, 0, 0, 1095, 191, 1, 0, 0, 0, 1096, 1097,
    5, 127, 0, 0, 1097, 193, 1, 0, 0, 0, 1098, 1099, 3, 202, 101, 0, 1099, 195, 1, 0, 0, 0, 1100,
    1101, 7, 11, 0, 0, 1101, 197, 1, 0, 0, 0, 1102, 1103, 7, 10, 0, 0, 1103, 199, 1, 0, 0, 0, 1104,
    1105, 5, 113, 0, 0, 1105, 201, 1, 0, 0, 0, 1106, 1107, 5, 127, 0, 0, 1107, 1108, 5, 81, 0, 0,
    1108, 1109, 5, 127, 0, 0, 1109, 203, 1, 0, 0, 0, 1110, 1111, 5, 114, 0, 0, 1111, 205, 1, 0, 0,
    0, 1112, 1113, 7, 12, 0, 0, 1113, 207, 1, 0, 0, 0, 1114, 1115, 7, 13, 0, 0, 1115, 209, 1, 0, 0,
    0, 120, 212, 217, 229, 236, 242, 248, 254, 261, 298, 308, 324, 328, 332, 365, 371, 381, 387,
    393, 399, 405, 411, 421, 425, 431, 436, 445, 448, 451, 459, 462, 471, 475, 484, 488, 493, 501,
    507, 510, 516, 519, 525, 528, 534, 537, 543, 550, 562, 579, 587, 595, 606, 618, 622, 637, 643,
    649, 656, 661, 667, 673, 678, 685, 688, 694, 697, 705, 711, 714, 717, 720, 728, 738, 741, 752,
    767, 792, 802, 811, 818, 829, 833, 839, 843, 845, 853, 855, 857, 861, 866, 874, 880, 883, 893,
    898, 902, 911, 918, 923, 934, 939, 944, 952, 966, 971, 982, 986, 991, 997, 1005, 1013, 1023,
    1033, 1042, 1046, 1051, 1065, 1071, 1078, 1090, 1094,
  ];

  private static __ATN: ATN;
  public static get _ATN(): ATN {
    if (!REMODELParser.__ATN) {
      REMODELParser.__ATN = new ATNDeserializer().deserialize(REMODELParser._serializedATN);
    }

    return REMODELParser.__ATN;
  }

  static DecisionsToDFA = REMODELParser._ATN.decisionToState.map(
    (ds: DecisionState, index: number) => new DFA(ds, index)
  );
}

export class RuleRequirementModelContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public ruleUseCaseModel(): RuleUseCaseModelContext {
    return this.getTypedRuleContext(RuleUseCaseModelContext, 0) as RuleUseCaseModelContext;
  }
  public ruleDomainModel(): RuleDomainModelContext {
    return this.getTypedRuleContext(RuleDomainModelContext, 0) as RuleDomainModelContext;
  }
  public ruleSimpleNameCS(): RuleSimpleNameCSContext {
    return this.getTypedRuleContext(RuleSimpleNameCSContext, 0) as RuleSimpleNameCSContext;
  }
  public RULE_DOUBLE_QUOTED_STRING(): TerminalNode {
    return this.getToken(REMODELParser.RULE_DOUBLE_QUOTED_STRING, 0);
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleRequirementModel;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleRequirementModel) {
      listener.enterRuleRequirementModel(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleRequirementModel) {
      listener.exitRuleRequirementModel(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleRequirementModel) {
      return visitor.visitRuleRequirementModel(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RuleInteractionContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public ruleSimpleNameCS(): RuleSimpleNameCSContext {
    return this.getTypedRuleContext(RuleSimpleNameCSContext, 0) as RuleSimpleNameCSContext;
  }
  public RULE_ID_list(): TerminalNode[] {
    return this.getTokens(REMODELParser.RULE_ID);
  }
  public RULE_ID(i: number): TerminalNode {
    return this.getToken(REMODELParser.RULE_ID, i);
  }
  public ruleMessage_list(): RuleMessageContext[] {
    return this.getTypedRuleContexts(RuleMessageContext) as RuleMessageContext[];
  }
  public ruleMessage(i: number): RuleMessageContext {
    return this.getTypedRuleContext(RuleMessageContext, i) as RuleMessageContext;
  }
  public ruleExecution_list(): RuleExecutionContext[] {
    return this.getTypedRuleContexts(RuleExecutionContext) as RuleExecutionContext[];
  }
  public ruleExecution(i: number): RuleExecutionContext {
    return this.getTypedRuleContext(RuleExecutionContext, i) as RuleExecutionContext;
  }
  public ruleCombinedFragment_list(): RuleCombinedFragmentContext[] {
    return this.getTypedRuleContexts(RuleCombinedFragmentContext) as RuleCombinedFragmentContext[];
  }
  public ruleCombinedFragment(i: number): RuleCombinedFragmentContext {
    return this.getTypedRuleContext(RuleCombinedFragmentContext, i) as RuleCombinedFragmentContext;
  }
  public ruleAbstractEnd_list(): RuleAbstractEndContext[] {
    return this.getTypedRuleContexts(RuleAbstractEndContext) as RuleAbstractEndContext[];
  }
  public ruleAbstractEnd(i: number): RuleAbstractEndContext {
    return this.getTypedRuleContext(RuleAbstractEndContext, i) as RuleAbstractEndContext;
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleInteraction;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleInteraction) {
      listener.enterRuleInteraction(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleInteraction) {
      listener.exitRuleInteraction(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleInteraction) {
      return visitor.visitRuleInteraction(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RuleMessageContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public ruleCallMessage(): RuleCallMessageContext {
    return this.getTypedRuleContext(RuleCallMessageContext, 0) as RuleCallMessageContext;
  }
  public ruleReturnMessage(): RuleReturnMessageContext {
    return this.getTypedRuleContext(RuleReturnMessageContext, 0) as RuleReturnMessageContext;
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleMessage;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleMessage) {
      listener.enterRuleMessage(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleMessage) {
      listener.exitRuleMessage(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleMessage) {
      return visitor.visitRuleMessage(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RuleCallMessageContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public ruleSimpleNameCS(): RuleSimpleNameCSContext {
    return this.getTypedRuleContext(RuleSimpleNameCSContext, 0) as RuleSimpleNameCSContext;
  }
  public RULE_ID_list(): TerminalNode[] {
    return this.getTokens(REMODELParser.RULE_ID);
  }
  public RULE_ID(i: number): TerminalNode {
    return this.getToken(REMODELParser.RULE_ID, i);
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleCallMessage;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleCallMessage) {
      listener.enterRuleCallMessage(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleCallMessage) {
      listener.exitRuleCallMessage(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleCallMessage) {
      return visitor.visitRuleCallMessage(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RuleReturnMessageContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public ruleSimpleNameCS(): RuleSimpleNameCSContext {
    return this.getTypedRuleContext(RuleSimpleNameCSContext, 0) as RuleSimpleNameCSContext;
  }
  public RULE_ID_list(): TerminalNode[] {
    return this.getTokens(REMODELParser.RULE_ID);
  }
  public RULE_ID(i: number): TerminalNode {
    return this.getToken(REMODELParser.RULE_ID, i);
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleReturnMessage;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleReturnMessage) {
      listener.enterRuleReturnMessage(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleReturnMessage) {
      listener.exitRuleReturnMessage(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleReturnMessage) {
      return visitor.visitRuleReturnMessage(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RuleExecutionContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public ruleSimpleNameCS(): RuleSimpleNameCSContext {
    return this.getTypedRuleContext(RuleSimpleNameCSContext, 0) as RuleSimpleNameCSContext;
  }
  public RULE_ID_list(): TerminalNode[] {
    return this.getTokens(REMODELParser.RULE_ID);
  }
  public RULE_ID(i: number): TerminalNode {
    return this.getToken(REMODELParser.RULE_ID, i);
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleExecution;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleExecution) {
      listener.enterRuleExecution(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleExecution) {
      listener.exitRuleExecution(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleExecution) {
      return visitor.visitRuleExecution(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RuleCombinedFragmentContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public ruleSimpleNameCS(): RuleSimpleNameCSContext {
    return this.getTypedRuleContext(RuleSimpleNameCSContext, 0) as RuleSimpleNameCSContext;
  }
  public ruleOperator(): RuleOperatorContext {
    return this.getTypedRuleContext(RuleOperatorContext, 0) as RuleOperatorContext;
  }
  public RULE_ID_list(): TerminalNode[] {
    return this.getTokens(REMODELParser.RULE_ID);
  }
  public RULE_ID(i: number): TerminalNode {
    return this.getToken(REMODELParser.RULE_ID, i);
  }
  public ruleOperand_list(): RuleOperandContext[] {
    return this.getTypedRuleContexts(RuleOperandContext) as RuleOperandContext[];
  }
  public ruleOperand(i: number): RuleOperandContext {
    return this.getTypedRuleContext(RuleOperandContext, i) as RuleOperandContext;
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleCombinedFragment;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleCombinedFragment) {
      listener.enterRuleCombinedFragment(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleCombinedFragment) {
      listener.exitRuleCombinedFragment(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleCombinedFragment) {
      return visitor.visitRuleCombinedFragment(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RuleOperatorContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleOperator;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleOperator) {
      listener.enterRuleOperator(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleOperator) {
      listener.exitRuleOperator(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleOperator) {
      return visitor.visitRuleOperator(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RuleOperandContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public ruleSimpleNameCS(): RuleSimpleNameCSContext {
    return this.getTypedRuleContext(RuleSimpleNameCSContext, 0) as RuleSimpleNameCSContext;
  }
  public RULE_ID_list(): TerminalNode[] {
    return this.getTokens(REMODELParser.RULE_ID);
  }
  public RULE_ID(i: number): TerminalNode {
    return this.getToken(REMODELParser.RULE_ID, i);
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleOperand;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleOperand) {
      listener.enterRuleOperand(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleOperand) {
      listener.exitRuleOperand(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleOperand) {
      return visitor.visitRuleOperand(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RuleAbstractEndContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public ruleMixEnd(): RuleMixEndContext {
    return this.getTypedRuleContext(RuleMixEndContext, 0) as RuleMixEndContext;
  }
  public ruleMixOpAndCFEnd(): RuleMixOpAndCFEndContext {
    return this.getTypedRuleContext(RuleMixOpAndCFEndContext, 0) as RuleMixOpAndCFEndContext;
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleAbstractEnd;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleAbstractEnd) {
      listener.enterRuleAbstractEnd(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleAbstractEnd) {
      listener.exitRuleAbstractEnd(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleAbstractEnd) {
      return visitor.visitRuleAbstractEnd(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RuleMixEndContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public ruleExecutionEnd(): RuleExecutionEndContext {
    return this.getTypedRuleContext(RuleExecutionEndContext, 0) as RuleExecutionEndContext;
  }
  public ruleMessageEnd(): RuleMessageEndContext {
    return this.getTypedRuleContext(RuleMessageEndContext, 0) as RuleMessageEndContext;
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleMixEnd;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleMixEnd) {
      listener.enterRuleMixEnd(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleMixEnd) {
      listener.exitRuleMixEnd(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleMixEnd) {
      return visitor.visitRuleMixEnd(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RuleMixOpAndCFEndContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public ruleCombinedFragmentEnd(): RuleCombinedFragmentEndContext {
    return this.getTypedRuleContext(
      RuleCombinedFragmentEndContext,
      0
    ) as RuleCombinedFragmentEndContext;
  }
  public ruleOperandEnd(): RuleOperandEndContext {
    return this.getTypedRuleContext(RuleOperandEndContext, 0) as RuleOperandEndContext;
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleMixOpAndCFEnd;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleMixOpAndCFEnd) {
      listener.enterRuleMixOpAndCFEnd(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleMixOpAndCFEnd) {
      listener.exitRuleMixOpAndCFEnd(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleMixOpAndCFEnd) {
      return visitor.visitRuleMixOpAndCFEnd(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RuleMessageEndContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public ruleSimpleNameCS(): RuleSimpleNameCSContext {
    return this.getTypedRuleContext(RuleSimpleNameCSContext, 0) as RuleSimpleNameCSContext;
  }
  public RULE_ID_list(): TerminalNode[] {
    return this.getTokens(REMODELParser.RULE_ID);
  }
  public RULE_ID(i: number): TerminalNode {
    return this.getToken(REMODELParser.RULE_ID, i);
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleMessageEnd;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleMessageEnd) {
      listener.enterRuleMessageEnd(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleMessageEnd) {
      listener.exitRuleMessageEnd(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleMessageEnd) {
      return visitor.visitRuleMessageEnd(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RuleExecutionEndContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public ruleSimpleNameCS(): RuleSimpleNameCSContext {
    return this.getTypedRuleContext(RuleSimpleNameCSContext, 0) as RuleSimpleNameCSContext;
  }
  public RULE_ID_list(): TerminalNode[] {
    return this.getTokens(REMODELParser.RULE_ID);
  }
  public RULE_ID(i: number): TerminalNode {
    return this.getToken(REMODELParser.RULE_ID, i);
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleExecutionEnd;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleExecutionEnd) {
      listener.enterRuleExecutionEnd(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleExecutionEnd) {
      listener.exitRuleExecutionEnd(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleExecutionEnd) {
      return visitor.visitRuleExecutionEnd(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RuleCombinedFragmentEndContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public ruleSimpleNameCS(): RuleSimpleNameCSContext {
    return this.getTypedRuleContext(RuleSimpleNameCSContext, 0) as RuleSimpleNameCSContext;
  }
  public RULE_ID(): TerminalNode {
    return this.getToken(REMODELParser.RULE_ID, 0);
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleCombinedFragmentEnd;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleCombinedFragmentEnd) {
      listener.enterRuleCombinedFragmentEnd(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleCombinedFragmentEnd) {
      listener.exitRuleCombinedFragmentEnd(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleCombinedFragmentEnd) {
      return visitor.visitRuleCombinedFragmentEnd(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RuleOperandEndContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public ruleSimpleNameCS(): RuleSimpleNameCSContext {
    return this.getTypedRuleContext(RuleSimpleNameCSContext, 0) as RuleSimpleNameCSContext;
  }
  public RULE_ID(): TerminalNode {
    return this.getToken(REMODELParser.RULE_ID, 0);
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleOperandEnd;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleOperandEnd) {
      listener.enterRuleOperandEnd(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleOperandEnd) {
      listener.exitRuleOperandEnd(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleOperandEnd) {
      return visitor.visitRuleOperandEnd(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RuleDomainModelContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public ruleSimpleNameCS(): RuleSimpleNameCSContext {
    return this.getTypedRuleContext(RuleSimpleNameCSContext, 0) as RuleSimpleNameCSContext;
  }
  public RULE_DOUBLE_QUOTED_STRING(): TerminalNode {
    return this.getToken(REMODELParser.RULE_DOUBLE_QUOTED_STRING, 0);
  }
  public ruleEntity_list(): RuleEntityContext[] {
    return this.getTypedRuleContexts(RuleEntityContext) as RuleEntityContext[];
  }
  public ruleEntity(i: number): RuleEntityContext {
    return this.getTypedRuleContext(RuleEntityContext, i) as RuleEntityContext;
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleDomainModel;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleDomainModel) {
      listener.enterRuleDomainModel(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleDomainModel) {
      listener.exitRuleDomainModel(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleDomainModel) {
      return visitor.visitRuleDomainModel(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RuleUseCaseModelContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public ruleSimpleNameCS(): RuleSimpleNameCSContext {
    return this.getTypedRuleContext(RuleSimpleNameCSContext, 0) as RuleSimpleNameCSContext;
  }
  public RULE_DOUBLE_QUOTED_STRING(): TerminalNode {
    return this.getToken(REMODELParser.RULE_DOUBLE_QUOTED_STRING, 0);
  }
  public ruleUC_list(): RuleUCContext[] {
    return this.getTypedRuleContexts(RuleUCContext) as RuleUCContext[];
  }
  public ruleUC(i: number): RuleUCContext {
    return this.getTypedRuleContext(RuleUCContext, i) as RuleUCContext;
  }
  public ruleActor_list(): RuleActorContext[] {
    return this.getTypedRuleContexts(RuleActorContext) as RuleActorContext[];
  }
  public ruleActor(i: number): RuleActorContext {
    return this.getTypedRuleContext(RuleActorContext, i) as RuleActorContext;
  }
  public ruleInteraction_list(): RuleInteractionContext[] {
    return this.getTypedRuleContexts(RuleInteractionContext) as RuleInteractionContext[];
  }
  public ruleInteraction(i: number): RuleInteractionContext {
    return this.getTypedRuleContext(RuleInteractionContext, i) as RuleInteractionContext;
  }
  public ruleService_list(): RuleServiceContext[] {
    return this.getTypedRuleContexts(RuleServiceContext) as RuleServiceContext[];
  }
  public ruleService(i: number): RuleServiceContext {
    return this.getTypedRuleContext(RuleServiceContext, i) as RuleServiceContext;
  }
  public ruleContract_list(): RuleContractContext[] {
    return this.getTypedRuleContexts(RuleContractContext) as RuleContractContext[];
  }
  public ruleContract(i: number): RuleContractContext {
    return this.getTypedRuleContext(RuleContractContext, i) as RuleContractContext;
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleUseCaseModel;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleUseCaseModel) {
      listener.enterRuleUseCaseModel(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleUseCaseModel) {
      listener.exitRuleUseCaseModel(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleUseCaseModel) {
      return visitor.visitRuleUseCaseModel(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RuleActorContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public ruleSimpleNameCS(): RuleSimpleNameCSContext {
    return this.getTypedRuleContext(RuleSimpleNameCSContext, 0) as RuleSimpleNameCSContext;
  }
  public RULE_DOUBLE_QUOTED_STRING_list(): TerminalNode[] {
    return this.getTokens(REMODELParser.RULE_DOUBLE_QUOTED_STRING);
  }
  public RULE_DOUBLE_QUOTED_STRING(i: number): TerminalNode {
    return this.getToken(REMODELParser.RULE_DOUBLE_QUOTED_STRING, i);
  }
  public RULE_ID_list(): TerminalNode[] {
    return this.getTokens(REMODELParser.RULE_ID);
  }
  public RULE_ID(i: number): TerminalNode {
    return this.getToken(REMODELParser.RULE_ID, i);
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleActor;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleActor) {
      listener.enterRuleActor(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleActor) {
      listener.exitRuleActor(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleActor) {
      return visitor.visitRuleActor(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RuleUCContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public ruleSimpleNameCS(): RuleSimpleNameCSContext {
    return this.getTypedRuleContext(RuleSimpleNameCSContext, 0) as RuleSimpleNameCSContext;
  }
  public RULE_DOUBLE_QUOTED_STRING_list(): TerminalNode[] {
    return this.getTokens(REMODELParser.RULE_DOUBLE_QUOTED_STRING);
  }
  public RULE_DOUBLE_QUOTED_STRING(i: number): TerminalNode {
    return this.getToken(REMODELParser.RULE_DOUBLE_QUOTED_STRING, i);
  }
  public ruleUSECASE_RELATION(): RuleUSECASE_RELATIONContext {
    return this.getTypedRuleContext(RuleUSECASE_RELATIONContext, 0) as RuleUSECASE_RELATIONContext;
  }
  public RULE_ID_list(): TerminalNode[] {
    return this.getTokens(REMODELParser.RULE_ID);
  }
  public RULE_ID(i: number): TerminalNode {
    return this.getToken(REMODELParser.RULE_ID, i);
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleUC;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleUC) {
      listener.enterRuleUC(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleUC) {
      listener.exitRuleUC(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleUC) {
      return visitor.visitRuleUC(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RuleServiceContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public ruleSimpleNameCS(): RuleSimpleNameCSContext {
    return this.getTypedRuleContext(RuleSimpleNameCSContext, 0) as RuleSimpleNameCSContext;
  }
  public RULE_DOUBLE_QUOTED_STRING(): TerminalNode {
    return this.getToken(REMODELParser.RULE_DOUBLE_QUOTED_STRING, 0);
  }
  public ruleOperation_list(): RuleOperationContext[] {
    return this.getTypedRuleContexts(RuleOperationContext) as RuleOperationContext[];
  }
  public ruleOperation(i: number): RuleOperationContext {
    return this.getTypedRuleContext(RuleOperationContext, i) as RuleOperationContext;
  }
  public ruleAttribute_list(): RuleAttributeContext[] {
    return this.getTypedRuleContexts(RuleAttributeContext) as RuleAttributeContext[];
  }
  public ruleAttribute(i: number): RuleAttributeContext {
    return this.getTypedRuleContext(RuleAttributeContext, i) as RuleAttributeContext;
  }
  public RULE_ID_list(): TerminalNode[] {
    return this.getTokens(REMODELParser.RULE_ID);
  }
  public RULE_ID(i: number): TerminalNode {
    return this.getToken(REMODELParser.RULE_ID, i);
  }
  public ruleInvariance_list(): RuleInvarianceContext[] {
    return this.getTypedRuleContexts(RuleInvarianceContext) as RuleInvarianceContext[];
  }
  public ruleInvariance(i: number): RuleInvarianceContext {
    return this.getTypedRuleContext(RuleInvarianceContext, i) as RuleInvarianceContext;
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleService;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleService) {
      listener.enterRuleService(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleService) {
      listener.exitRuleService(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleService) {
      return visitor.visitRuleService(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RuleParticipantContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public ruleActor(): RuleActorContext {
    return this.getTypedRuleContext(RuleActorContext, 0) as RuleActorContext;
  }
  public ruleService(): RuleServiceContext {
    return this.getTypedRuleContext(RuleServiceContext, 0) as RuleServiceContext;
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleParticipant;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleParticipant) {
      listener.enterRuleParticipant(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleParticipant) {
      listener.exitRuleParticipant(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleParticipant) {
      return visitor.visitRuleParticipant(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RulePartitionContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public RULE_ID(): TerminalNode {
    return this.getToken(REMODELParser.RULE_ID, 0);
  }
  public ruleWorkflowExp_list(): RuleWorkflowExpContext[] {
    return this.getTypedRuleContexts(RuleWorkflowExpContext) as RuleWorkflowExpContext[];
  }
  public ruleWorkflowExp(i: number): RuleWorkflowExpContext {
    return this.getTypedRuleContext(RuleWorkflowExpContext, i) as RuleWorkflowExpContext;
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_rulePartition;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRulePartition) {
      listener.enterRulePartition(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRulePartition) {
      listener.exitRulePartition(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRulePartition) {
      return visitor.visitRulePartition(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RuleWorkflowExpContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public ruleSimpleOperation(): RuleSimpleOperationContext {
    return this.getTypedRuleContext(RuleSimpleOperationContext, 0) as RuleSimpleOperationContext;
  }
  public ruleComplexOpeartion(): RuleComplexOpeartionContext {
    return this.getTypedRuleContext(RuleComplexOpeartionContext, 0) as RuleComplexOpeartionContext;
  }
  public ruleInitalNode(): RuleInitalNodeContext {
    return this.getTypedRuleContext(RuleInitalNodeContext, 0) as RuleInitalNodeContext;
  }
  public ruleActivityFinal(): RuleActivityFinalContext {
    return this.getTypedRuleContext(RuleActivityFinalContext, 0) as RuleActivityFinalContext;
  }
  public ruleForkNode(): RuleForkNodeContext {
    return this.getTypedRuleContext(RuleForkNodeContext, 0) as RuleForkNodeContext;
  }
  public ruleJoinNode(): RuleJoinNodeContext {
    return this.getTypedRuleContext(RuleJoinNodeContext, 0) as RuleJoinNodeContext;
  }
  public rulePartitionAction(): RulePartitionActionContext {
    return this.getTypedRuleContext(RulePartitionActionContext, 0) as RulePartitionActionContext;
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleWorkflowExp;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleWorkflowExp) {
      listener.enterRuleWorkflowExp(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleWorkflowExp) {
      listener.exitRuleWorkflowExp(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleWorkflowExp) {
      return visitor.visitRuleWorkflowExp(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RulePartitionActionContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public RULE_ID_list(): TerminalNode[] {
    return this.getTokens(REMODELParser.RULE_ID);
  }
  public RULE_ID(i: number): TerminalNode {
    return this.getToken(REMODELParser.RULE_ID, i);
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_rulePartitionAction;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRulePartitionAction) {
      listener.enterRulePartitionAction(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRulePartitionAction) {
      listener.exitRulePartitionAction(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRulePartitionAction) {
      return visitor.visitRulePartitionAction(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RuleActivityFinalContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleActivityFinal;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleActivityFinal) {
      listener.enterRuleActivityFinal(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleActivityFinal) {
      listener.exitRuleActivityFinal(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleActivityFinal) {
      return visitor.visitRuleActivityFinal(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RuleInitalNodeContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleInitalNode;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleInitalNode) {
      listener.enterRuleInitalNode(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleInitalNode) {
      listener.exitRuleInitalNode(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleInitalNode) {
      return visitor.visitRuleInitalNode(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RuleForkNodeContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public RULE_ID_list(): TerminalNode[] {
    return this.getTokens(REMODELParser.RULE_ID);
  }
  public RULE_ID(i: number): TerminalNode {
    return this.getToken(REMODELParser.RULE_ID, i);
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleForkNode;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleForkNode) {
      listener.enterRuleForkNode(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleForkNode) {
      listener.exitRuleForkNode(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleForkNode) {
      return visitor.visitRuleForkNode(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RuleJoinNodeContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public RULE_ID_list(): TerminalNode[] {
    return this.getTokens(REMODELParser.RULE_ID);
  }
  public RULE_ID(i: number): TerminalNode {
    return this.getToken(REMODELParser.RULE_ID, i);
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleJoinNode;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleJoinNode) {
      listener.enterRuleJoinNode(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleJoinNode) {
      listener.exitRuleJoinNode(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleJoinNode) {
      return visitor.visitRuleJoinNode(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RuleComplexOpeartionContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public ruleLoopExp(): RuleLoopExpContext {
    return this.getTypedRuleContext(RuleLoopExpContext, 0) as RuleLoopExpContext;
  }
  public ruleSwitchExp(): RuleSwitchExpContext {
    return this.getTypedRuleContext(RuleSwitchExpContext, 0) as RuleSwitchExpContext;
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleComplexOpeartion;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleComplexOpeartion) {
      listener.enterRuleComplexOpeartion(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleComplexOpeartion) {
      listener.exitRuleComplexOpeartion(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleComplexOpeartion) {
      return visitor.visitRuleComplexOpeartion(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RuleSimpleOperationContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public RULE_ID(): TerminalNode {
    return this.getToken(REMODELParser.RULE_ID, 0);
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleSimpleOperation;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleSimpleOperation) {
      listener.enterRuleSimpleOperation(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleSimpleOperation) {
      listener.exitRuleSimpleOperation(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleSimpleOperation) {
      return visitor.visitRuleSimpleOperation(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RuleLoopExpContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public ruleSimpleNameCS(): RuleSimpleNameCSContext {
    return this.getTypedRuleContext(RuleSimpleNameCSContext, 0) as RuleSimpleNameCSContext;
  }
  public ruleWorkflowExp_list(): RuleWorkflowExpContext[] {
    return this.getTypedRuleContexts(RuleWorkflowExpContext) as RuleWorkflowExpContext[];
  }
  public ruleWorkflowExp(i: number): RuleWorkflowExpContext {
    return this.getTypedRuleContext(RuleWorkflowExpContext, i) as RuleWorkflowExpContext;
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleLoopExp;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleLoopExp) {
      listener.enterRuleLoopExp(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleLoopExp) {
      listener.exitRuleLoopExp(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleLoopExp) {
      return visitor.visitRuleLoopExp(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RuleSwitchExpContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public ruleSimpleNameCS(): RuleSimpleNameCSContext {
    return this.getTypedRuleContext(RuleSimpleNameCSContext, 0) as RuleSimpleNameCSContext;
  }
  public ruleSwitchCase_list(): RuleSwitchCaseContext[] {
    return this.getTypedRuleContexts(RuleSwitchCaseContext) as RuleSwitchCaseContext[];
  }
  public ruleSwitchCase(i: number): RuleSwitchCaseContext {
    return this.getTypedRuleContext(RuleSwitchCaseContext, i) as RuleSwitchCaseContext;
  }
  public ruleSwitchDefault(): RuleSwitchDefaultContext {
    return this.getTypedRuleContext(RuleSwitchDefaultContext, 0) as RuleSwitchDefaultContext;
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleSwitchExp;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleSwitchExp) {
      listener.enterRuleSwitchExp(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleSwitchExp) {
      listener.exitRuleSwitchExp(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleSwitchExp) {
      return visitor.visitRuleSwitchExp(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RuleSwitchCaseContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public ruleSimpleNameCS(): RuleSimpleNameCSContext {
    return this.getTypedRuleContext(RuleSimpleNameCSContext, 0) as RuleSimpleNameCSContext;
  }
  public ruleSimpleOperation(): RuleSimpleOperationContext {
    return this.getTypedRuleContext(RuleSimpleOperationContext, 0) as RuleSimpleOperationContext;
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleSwitchCase;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleSwitchCase) {
      listener.enterRuleSwitchCase(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleSwitchCase) {
      listener.exitRuleSwitchCase(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleSwitchCase) {
      return visitor.visitRuleSwitchCase(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RuleSwitchDefaultContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public ruleSimpleOperation(): RuleSimpleOperationContext {
    return this.getTypedRuleContext(RuleSimpleOperationContext, 0) as RuleSimpleOperationContext;
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleSwitchDefault;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleSwitchDefault) {
      listener.enterRuleSwitchDefault(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleSwitchDefault) {
      listener.exitRuleSwitchDefault(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleSwitchDefault) {
      return visitor.visitRuleSwitchDefault(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RuleOperationContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public ruleOperationName(): RuleOperationNameContext {
    return this.getTypedRuleContext(RuleOperationNameContext, 0) as RuleOperationNameContext;
  }
  public ruleParameter_list(): RuleParameterContext[] {
    return this.getTypedRuleContexts(RuleParameterContext) as RuleParameterContext[];
  }
  public ruleParameter(i: number): RuleParameterContext {
    return this.getTypedRuleContext(RuleParameterContext, i) as RuleParameterContext;
  }
  public ruleTypeCS(): RuleTypeCSContext {
    return this.getTypedRuleContext(RuleTypeCSContext, 0) as RuleTypeCSContext;
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleOperation;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleOperation) {
      listener.enterRuleOperation(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleOperation) {
      listener.exitRuleOperation(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleOperation) {
      return visitor.visitRuleOperation(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RuleOperationNameContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public ruleSimpleNameCS(): RuleSimpleNameCSContext {
    return this.getTypedRuleContext(RuleSimpleNameCSContext, 0) as RuleSimpleNameCSContext;
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleOperationName;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleOperationName) {
      listener.enterRuleOperationName(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleOperationName) {
      listener.exitRuleOperationName(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleOperationName) {
      return visitor.visitRuleOperationName(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RuleParameterContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public ruleParametersName(): RuleParametersNameContext {
    return this.getTypedRuleContext(RuleParametersNameContext, 0) as RuleParametersNameContext;
  }
  public ruleTypeCS(): RuleTypeCSContext {
    return this.getTypedRuleContext(RuleTypeCSContext, 0) as RuleTypeCSContext;
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleParameter;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleParameter) {
      listener.enterRuleParameter(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleParameter) {
      listener.exitRuleParameter(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleParameter) {
      return visitor.visitRuleParameter(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RuleParametersNameContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public ruleSimpleNameCS(): RuleSimpleNameCSContext {
    return this.getTypedRuleContext(RuleSimpleNameCSContext, 0) as RuleSimpleNameCSContext;
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleParametersName;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleParametersName) {
      listener.enterRuleParametersName(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleParametersName) {
      listener.exitRuleParametersName(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleParametersName) {
      return visitor.visitRuleParametersName(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RuleEntityContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public ruleSimpleNameCS(): RuleSimpleNameCSContext {
    return this.getTypedRuleContext(RuleSimpleNameCSContext, 0) as RuleSimpleNameCSContext;
  }
  public RULE_ID(): TerminalNode {
    return this.getToken(REMODELParser.RULE_ID, 0);
  }
  public RULE_DOUBLE_QUOTED_STRING(): TerminalNode {
    return this.getToken(REMODELParser.RULE_DOUBLE_QUOTED_STRING, 0);
  }
  public ruleAttribute_list(): RuleAttributeContext[] {
    return this.getTypedRuleContexts(RuleAttributeContext) as RuleAttributeContext[];
  }
  public ruleAttribute(i: number): RuleAttributeContext {
    return this.getTypedRuleContext(RuleAttributeContext, i) as RuleAttributeContext;
  }
  public ruleReference_list(): RuleReferenceContext[] {
    return this.getTypedRuleContexts(RuleReferenceContext) as RuleReferenceContext[];
  }
  public ruleReference(i: number): RuleReferenceContext {
    return this.getTypedRuleContext(RuleReferenceContext, i) as RuleReferenceContext;
  }
  public ruleInvariance_list(): RuleInvarianceContext[] {
    return this.getTypedRuleContexts(RuleInvarianceContext) as RuleInvarianceContext[];
  }
  public ruleInvariance(i: number): RuleInvarianceContext {
    return this.getTypedRuleContext(RuleInvarianceContext, i) as RuleInvarianceContext;
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleEntity;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleEntity) {
      listener.enterRuleEntity(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleEntity) {
      listener.exitRuleEntity(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleEntity) {
      return visitor.visitRuleEntity(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RuleAttributeContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public ruleSimpleNameCS(): RuleSimpleNameCSContext {
    return this.getTypedRuleContext(RuleSimpleNameCSContext, 0) as RuleSimpleNameCSContext;
  }
  public ruleTypeCS(): RuleTypeCSContext {
    return this.getTypedRuleContext(RuleTypeCSContext, 0) as RuleTypeCSContext;
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleAttribute;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleAttribute) {
      listener.enterRuleAttribute(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleAttribute) {
      listener.exitRuleAttribute(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleAttribute) {
      return visitor.visitRuleAttribute(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RuleReferenceContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public ruleSimpleNameCS(): RuleSimpleNameCSContext {
    return this.getTypedRuleContext(RuleSimpleNameCSContext, 0) as RuleSimpleNameCSContext;
  }
  public RULE_ID(): TerminalNode {
    return this.getToken(REMODELParser.RULE_ID, 0);
  }
  public ruleAssociationTypeCS(): RuleAssociationTypeCSContext {
    return this.getTypedRuleContext(
      RuleAssociationTypeCSContext,
      0
    ) as RuleAssociationTypeCSContext;
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleReference;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleReference) {
      listener.enterRuleReference(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleReference) {
      listener.exitRuleReference(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleReference) {
      return visitor.visitRuleReference(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RuleTypeCSContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public ruleEntityType(): RuleEntityTypeContext {
    return this.getTypedRuleContext(RuleEntityTypeContext, 0) as RuleEntityTypeContext;
  }
  public rulePrimitiveTypeCS(): RulePrimitiveTypeCSContext {
    return this.getTypedRuleContext(RulePrimitiveTypeCSContext, 0) as RulePrimitiveTypeCSContext;
  }
  public ruleEnumEntity(): RuleEnumEntityContext {
    return this.getTypedRuleContext(RuleEnumEntityContext, 0) as RuleEnumEntityContext;
  }
  public ruleCollectionTypeCS(): RuleCollectionTypeCSContext {
    return this.getTypedRuleContext(RuleCollectionTypeCSContext, 0) as RuleCollectionTypeCSContext;
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleTypeCS;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleTypeCS) {
      listener.enterRuleTypeCS(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleTypeCS) {
      listener.exitRuleTypeCS(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleTypeCS) {
      return visitor.visitRuleTypeCS(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RuleInvarianceContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public ruleSimpleNameCS(): RuleSimpleNameCSContext {
    return this.getTypedRuleContext(RuleSimpleNameCSContext, 0) as RuleSimpleNameCSContext;
  }
  public ruleOCLExpressionCS(): RuleOCLExpressionCSContext {
    return this.getTypedRuleContext(RuleOCLExpressionCSContext, 0) as RuleOCLExpressionCSContext;
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleInvariance;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleInvariance) {
      listener.enterRuleInvariance(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleInvariance) {
      listener.exitRuleInvariance(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleInvariance) {
      return visitor.visitRuleInvariance(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RuleEntityTypeContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public RULE_ID(): TerminalNode {
    return this.getToken(REMODELParser.RULE_ID, 0);
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleEntityType;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleEntityType) {
      listener.enterRuleEntityType(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleEntityType) {
      listener.exitRuleEntityType(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleEntityType) {
      return visitor.visitRuleEntityType(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RuleEnumEntityContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public ruleSimpleNameCS(): RuleSimpleNameCSContext {
    return this.getTypedRuleContext(RuleSimpleNameCSContext, 0) as RuleSimpleNameCSContext;
  }
  public ruleEnumItem_list(): RuleEnumItemContext[] {
    return this.getTypedRuleContexts(RuleEnumItemContext) as RuleEnumItemContext[];
  }
  public ruleEnumItem(i: number): RuleEnumItemContext {
    return this.getTypedRuleContext(RuleEnumItemContext, i) as RuleEnumItemContext;
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleEnumEntity;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleEnumEntity) {
      listener.enterRuleEnumEntity(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleEnumEntity) {
      listener.exitRuleEnumEntity(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleEnumEntity) {
      return visitor.visitRuleEnumEntity(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RuleEnumItemContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public RULE_ID(): TerminalNode {
    return this.getToken(REMODELParser.RULE_ID, 0);
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleEnumItem;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleEnumItem) {
      listener.enterRuleEnumItem(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleEnumItem) {
      listener.exitRuleEnumItem(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleEnumItem) {
      return visitor.visitRuleEnumItem(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RuleUSECASE_RELATIONContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleUSECASE_RELATION;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleUSECASE_RELATION) {
      listener.enterRuleUSECASE_RELATION(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleUSECASE_RELATION) {
      listener.exitRuleUSECASE_RELATION(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleUSECASE_RELATION) {
      return visitor.visitRuleUSECASE_RELATION(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RuleContractContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public RULE_ID(): TerminalNode {
    return this.getToken(REMODELParser.RULE_ID, 0);
  }
  public ruleOperation(): RuleOperationContext {
    return this.getTypedRuleContext(RuleOperationContext, 0) as RuleOperationContext;
  }
  public rulePrecondition(): RulePreconditionContext {
    return this.getTypedRuleContext(RulePreconditionContext, 0) as RulePreconditionContext;
  }
  public rulePostcondition(): RulePostconditionContext {
    return this.getTypedRuleContext(RulePostconditionContext, 0) as RulePostconditionContext;
  }
  public ruleDefinition(): RuleDefinitionContext {
    return this.getTypedRuleContext(RuleDefinitionContext, 0) as RuleDefinitionContext;
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleContract;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleContract) {
      listener.enterRuleContract(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleContract) {
      listener.exitRuleContract(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleContract) {
      return visitor.visitRuleContract(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RuleStandaloneContractContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public ruleContract(): RuleContractContext {
    return this.getTypedRuleContext(RuleContractContext, 0) as RuleContractContext;
  }
  public EOF(): TerminalNode {
    return this.getToken(REMODELParser.EOF, 0);
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleStandaloneContract;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleStandaloneContract) {
      listener.enterRuleStandaloneContract(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleStandaloneContract) {
      listener.exitRuleStandaloneContract(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleStandaloneContract) {
      return visitor.visitRuleStandaloneContract(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RuleStandaloneDefinitionContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public ruleDefinition(): RuleDefinitionContext {
    return this.getTypedRuleContext(RuleDefinitionContext, 0) as RuleDefinitionContext;
  }
  public EOF(): TerminalNode {
    return this.getToken(REMODELParser.EOF, 0);
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleStandaloneDefinition;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleStandaloneDefinition) {
      listener.enterRuleStandaloneDefinition(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleStandaloneDefinition) {
      listener.exitRuleStandaloneDefinition(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleStandaloneDefinition) {
      return visitor.visitRuleStandaloneDefinition(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RuleStandalonePreconditionContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public rulePrecondition(): RulePreconditionContext {
    return this.getTypedRuleContext(RulePreconditionContext, 0) as RulePreconditionContext;
  }
  public EOF(): TerminalNode {
    return this.getToken(REMODELParser.EOF, 0);
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleStandalonePrecondition;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleStandalonePrecondition) {
      listener.enterRuleStandalonePrecondition(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleStandalonePrecondition) {
      listener.exitRuleStandalonePrecondition(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleStandalonePrecondition) {
      return visitor.visitRuleStandalonePrecondition(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RuleStandalonePostconditionContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public rulePostcondition(): RulePostconditionContext {
    return this.getTypedRuleContext(RulePostconditionContext, 0) as RulePostconditionContext;
  }
  public EOF(): TerminalNode {
    return this.getToken(REMODELParser.EOF, 0);
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleStandalonePostcondition;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleStandalonePostcondition) {
      listener.enterRuleStandalonePostcondition(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleStandalonePostcondition) {
      listener.exitRuleStandalonePostcondition(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleStandalonePostcondition) {
      return visitor.visitRuleStandalonePostcondition(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RuleDefinitionContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public ruleVariableDeclarationCS_list(): RuleVariableDeclarationCSContext[] {
    return this.getTypedRuleContexts(
      RuleVariableDeclarationCSContext
    ) as RuleVariableDeclarationCSContext[];
  }
  public ruleVariableDeclarationCS(i: number): RuleVariableDeclarationCSContext {
    return this.getTypedRuleContext(
      RuleVariableDeclarationCSContext,
      i
    ) as RuleVariableDeclarationCSContext;
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleDefinition;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleDefinition) {
      listener.enterRuleDefinition(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleDefinition) {
      listener.exitRuleDefinition(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleDefinition) {
      return visitor.visitRuleDefinition(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RulePreconditionContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public ruleOCLExpressionCS(): RuleOCLExpressionCSContext {
    return this.getTypedRuleContext(RuleOCLExpressionCSContext, 0) as RuleOCLExpressionCSContext;
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_rulePrecondition;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRulePrecondition) {
      listener.enterRulePrecondition(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRulePrecondition) {
      listener.exitRulePrecondition(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRulePrecondition) {
      return visitor.visitRulePrecondition(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RulePostconditionContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public ruleOCLExpressionCS(): RuleOCLExpressionCSContext {
    return this.getTypedRuleContext(RuleOCLExpressionCSContext, 0) as RuleOCLExpressionCSContext;
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_rulePostcondition;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRulePostcondition) {
      listener.enterRulePostcondition(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRulePostcondition) {
      listener.exitRulePostcondition(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRulePostcondition) {
      return visitor.visitRulePostcondition(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RuleOCLExpressionCSContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public ruleLiteralExpCS(): RuleLiteralExpCSContext {
    return this.getTypedRuleContext(RuleLiteralExpCSContext, 0) as RuleLiteralExpCSContext;
  }
  public ruleLetExpCS(): RuleLetExpCSContext {
    return this.getTypedRuleContext(RuleLetExpCSContext, 0) as RuleLetExpCSContext;
  }
  public ruleIfExpCS(): RuleIfExpCSContext {
    return this.getTypedRuleContext(RuleIfExpCSContext, 0) as RuleIfExpCSContext;
  }
  public ruleLogicFormulaExpCS(): RuleLogicFormulaExpCSContext {
    return this.getTypedRuleContext(
      RuleLogicFormulaExpCSContext,
      0
    ) as RuleLogicFormulaExpCSContext;
  }
  public ruleNestedExpCS(): RuleNestedExpCSContext {
    return this.getTypedRuleContext(RuleNestedExpCSContext, 0) as RuleNestedExpCSContext;
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleOCLExpressionCS;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleOCLExpressionCS) {
      listener.enterRuleOCLExpressionCS(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleOCLExpressionCS) {
      listener.exitRuleOCLExpressionCS(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleOCLExpressionCS) {
      return visitor.visitRuleOCLExpressionCS(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RuleNestedExpCSContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public ruleOCLExpressionCS(): RuleOCLExpressionCSContext {
    return this.getTypedRuleContext(RuleOCLExpressionCSContext, 0) as RuleOCLExpressionCSContext;
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleNestedExpCS;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleNestedExpCS) {
      listener.enterRuleNestedExpCS(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleNestedExpCS) {
      listener.exitRuleNestedExpCS(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleNestedExpCS) {
      return visitor.visitRuleNestedExpCS(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RuleLogicFormulaExpCSContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public ruleAtomicExpression_list(): RuleAtomicExpressionContext[] {
    return this.getTypedRuleContexts(RuleAtomicExpressionContext) as RuleAtomicExpressionContext[];
  }
  public ruleAtomicExpression(i: number): RuleAtomicExpressionContext {
    return this.getTypedRuleContext(RuleAtomicExpressionContext, i) as RuleAtomicExpressionContext;
  }
  public ruleIfExpCS_list(): RuleIfExpCSContext[] {
    return this.getTypedRuleContexts(RuleIfExpCSContext) as RuleIfExpCSContext[];
  }
  public ruleIfExpCS(i: number): RuleIfExpCSContext {
    return this.getTypedRuleContext(RuleIfExpCSContext, i) as RuleIfExpCSContext;
  }
  public ruleNestedExpCS_list(): RuleNestedExpCSContext[] {
    return this.getTypedRuleContexts(RuleNestedExpCSContext) as RuleNestedExpCSContext[];
  }
  public ruleNestedExpCS(i: number): RuleNestedExpCSContext {
    return this.getTypedRuleContext(RuleNestedExpCSContext, i) as RuleNestedExpCSContext;
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleLogicFormulaExpCS;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleLogicFormulaExpCS) {
      listener.enterRuleLogicFormulaExpCS(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleLogicFormulaExpCS) {
      listener.exitRuleLogicFormulaExpCS(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleLogicFormulaExpCS) {
      return visitor.visitRuleLogicFormulaExpCS(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RuleAtomicExpressionContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public ruleLeftSubAtomicExpression(): RuleLeftSubAtomicExpressionContext {
    return this.getTypedRuleContext(
      RuleLeftSubAtomicExpressionContext,
      0
    ) as RuleLeftSubAtomicExpressionContext;
  }
  public ruleInfixCompareOperatorName(): RuleInfixCompareOperatorNameContext {
    return this.getTypedRuleContext(
      RuleInfixCompareOperatorNameContext,
      0
    ) as RuleInfixCompareOperatorNameContext;
  }
  public ruleRightSubAtomicExpression(): RuleRightSubAtomicExpressionContext {
    return this.getTypedRuleContext(
      RuleRightSubAtomicExpressionContext,
      0
    ) as RuleRightSubAtomicExpressionContext;
  }
  public ruleInfixOperatorName(): RuleInfixOperatorNameContext {
    return this.getTypedRuleContext(
      RuleInfixOperatorNameContext,
      0
    ) as RuleInfixOperatorNameContext;
  }
  public rulePrimitiveLiteralExpCS(): RulePrimitiveLiteralExpCSContext {
    return this.getTypedRuleContext(
      RulePrimitiveLiteralExpCSContext,
      0
    ) as RulePrimitiveLiteralExpCSContext;
  }
  public ruleAtomicExpression(): RuleAtomicExpressionContext {
    return this.getTypedRuleContext(RuleAtomicExpressionContext, 0) as RuleAtomicExpressionContext;
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleAtomicExpression;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleAtomicExpression) {
      listener.enterRuleAtomicExpression(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleAtomicExpression) {
      listener.exitRuleAtomicExpression(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleAtomicExpression) {
      return visitor.visitRuleAtomicExpression(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RuleLeftSubAtomicExpressionContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public ruleVariableExpCS(): RuleVariableExpCSContext {
    return this.getTypedRuleContext(RuleVariableExpCSContext, 0) as RuleVariableExpCSContext;
  }
  public ruleCallExpCS(): RuleCallExpCSContext {
    return this.getTypedRuleContext(RuleCallExpCSContext, 0) as RuleCallExpCSContext;
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleLeftSubAtomicExpression;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleLeftSubAtomicExpression) {
      listener.enterRuleLeftSubAtomicExpression(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleLeftSubAtomicExpression) {
      listener.exitRuleLeftSubAtomicExpression(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleLeftSubAtomicExpression) {
      return visitor.visitRuleLeftSubAtomicExpression(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RuleRightSubAtomicExpressionContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public ruleLiteralExpCS(): RuleLiteralExpCSContext {
    return this.getTypedRuleContext(RuleLiteralExpCSContext, 0) as RuleLiteralExpCSContext;
  }
  public ruleVariableExpCS(): RuleVariableExpCSContext {
    return this.getTypedRuleContext(RuleVariableExpCSContext, 0) as RuleVariableExpCSContext;
  }
  public ruleCallExpCS(): RuleCallExpCSContext {
    return this.getTypedRuleContext(RuleCallExpCSContext, 0) as RuleCallExpCSContext;
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleRightSubAtomicExpression;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleRightSubAtomicExpression) {
      listener.enterRuleRightSubAtomicExpression(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleRightSubAtomicExpression) {
      listener.exitRuleRightSubAtomicExpression(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleRightSubAtomicExpression) {
      return visitor.visitRuleRightSubAtomicExpression(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RuleInfixCompareOperatorNameContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleInfixCompareOperatorName;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleInfixCompareOperatorName) {
      listener.enterRuleInfixCompareOperatorName(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleInfixCompareOperatorName) {
      listener.exitRuleInfixCompareOperatorName(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleInfixCompareOperatorName) {
      return visitor.visitRuleInfixCompareOperatorName(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RuleInfixOperatorNameContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleInfixOperatorName;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleInfixOperatorName) {
      listener.enterRuleInfixOperatorName(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleInfixOperatorName) {
      listener.exitRuleInfixOperatorName(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleInfixOperatorName) {
      return visitor.visitRuleInfixOperatorName(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RuleCallExpCSContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public ruleFeatureCallExpCS(): RuleFeatureCallExpCSContext {
    return this.getTypedRuleContext(RuleFeatureCallExpCSContext, 0) as RuleFeatureCallExpCSContext;
  }
  public ruleLoopExpCS(): RuleLoopExpCSContext {
    return this.getTypedRuleContext(RuleLoopExpCSContext, 0) as RuleLoopExpCSContext;
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleCallExpCS;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleCallExpCS) {
      listener.enterRuleCallExpCS(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleCallExpCS) {
      listener.exitRuleCallExpCS(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleCallExpCS) {
      return visitor.visitRuleCallExpCS(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RuleLoopExpCSContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public ruleIteratorExpCS(): RuleIteratorExpCSContext {
    return this.getTypedRuleContext(RuleIteratorExpCSContext, 0) as RuleIteratorExpCSContext;
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleLoopExpCS;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleLoopExpCS) {
      listener.enterRuleLoopExpCS(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleLoopExpCS) {
      listener.exitRuleLoopExpCS(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleLoopExpCS) {
      return visitor.visitRuleLoopExpCS(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RuleIteratorExpCSContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public ruleIteratorIdentifier(): RuleIteratorIdentifierContext {
    return this.getTypedRuleContext(
      RuleIteratorIdentifierContext,
      0
    ) as RuleIteratorIdentifierContext;
  }
  public ruleSimpleNameCS(): RuleSimpleNameCSContext {
    return this.getTypedRuleContext(RuleSimpleNameCSContext, 0) as RuleSimpleNameCSContext;
  }
  public ruleLogicFormulaExpCS(): RuleLogicFormulaExpCSContext {
    return this.getTypedRuleContext(
      RuleLogicFormulaExpCSContext,
      0
    ) as RuleLogicFormulaExpCSContext;
  }
  public ruleIfExpCS(): RuleIfExpCSContext {
    return this.getTypedRuleContext(RuleIfExpCSContext, 0) as RuleIfExpCSContext;
  }
  public ruleVariableDeclarationCS_list(): RuleVariableDeclarationCSContext[] {
    return this.getTypedRuleContexts(
      RuleVariableDeclarationCSContext
    ) as RuleVariableDeclarationCSContext[];
  }
  public ruleVariableDeclarationCS(i: number): RuleVariableDeclarationCSContext {
    return this.getTypedRuleContext(
      RuleVariableDeclarationCSContext,
      i
    ) as RuleVariableDeclarationCSContext;
  }
  public ruleClassiferCallExpCS(): RuleClassiferCallExpCSContext {
    return this.getTypedRuleContext(
      RuleClassiferCallExpCSContext,
      0
    ) as RuleClassiferCallExpCSContext;
  }
  public rulePropertyCallExpCS(): RulePropertyCallExpCSContext {
    return this.getTypedRuleContext(
      RulePropertyCallExpCSContext,
      0
    ) as RulePropertyCallExpCSContext;
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleIteratorExpCS;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleIteratorExpCS) {
      listener.enterRuleIteratorExpCS(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleIteratorExpCS) {
      listener.exitRuleIteratorExpCS(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleIteratorExpCS) {
      return visitor.visitRuleIteratorExpCS(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RuleIteratorIdentifierContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleIteratorIdentifier;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleIteratorIdentifier) {
      listener.enterRuleIteratorIdentifier(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleIteratorIdentifier) {
      listener.exitRuleIteratorIdentifier(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleIteratorIdentifier) {
      return visitor.visitRuleIteratorIdentifier(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RuleArgumentsCSContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public ruleOCLExpressionCS(): RuleOCLExpressionCSContext {
    return this.getTypedRuleContext(RuleOCLExpressionCSContext, 0) as RuleOCLExpressionCSContext;
  }
  public ruleArgumentsCS(): RuleArgumentsCSContext {
    return this.getTypedRuleContext(RuleArgumentsCSContext, 0) as RuleArgumentsCSContext;
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleArgumentsCS;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleArgumentsCS) {
      listener.enterRuleArgumentsCS(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleArgumentsCS) {
      listener.exitRuleArgumentsCS(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleArgumentsCS) {
      return visitor.visitRuleArgumentsCS(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RuleFeatureCallExpCSContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public rulePropertyCallExpCS(): RulePropertyCallExpCSContext {
    return this.getTypedRuleContext(
      RulePropertyCallExpCSContext,
      0
    ) as RulePropertyCallExpCSContext;
  }
  public ruleClassiferCallExpCS(): RuleClassiferCallExpCSContext {
    return this.getTypedRuleContext(
      RuleClassiferCallExpCSContext,
      0
    ) as RuleClassiferCallExpCSContext;
  }
  public ruleStandardOperationExpCS(): RuleStandardOperationExpCSContext {
    return this.getTypedRuleContext(
      RuleStandardOperationExpCSContext,
      0
    ) as RuleStandardOperationExpCSContext;
  }
  public ruleStandardNavigationCallExpCS(): RuleStandardNavigationCallExpCSContext {
    return this.getTypedRuleContext(
      RuleStandardNavigationCallExpCSContext,
      0
    ) as RuleStandardNavigationCallExpCSContext;
  }
  public ruleOperationCallExpCS(): RuleOperationCallExpCSContext {
    return this.getTypedRuleContext(
      RuleOperationCallExpCSContext,
      0
    ) as RuleOperationCallExpCSContext;
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleFeatureCallExpCS;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleFeatureCallExpCS) {
      listener.enterRuleFeatureCallExpCS(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleFeatureCallExpCS) {
      listener.exitRuleFeatureCallExpCS(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleFeatureCallExpCS) {
      return visitor.visitRuleFeatureCallExpCS(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RuleStandardNavigationCallExpCSContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public ruleStandardCollectionOperation(): RuleStandardCollectionOperationContext {
    return this.getTypedRuleContext(
      RuleStandardCollectionOperationContext,
      0
    ) as RuleStandardCollectionOperationContext;
  }
  public ruleClassiferCallExpCS(): RuleClassiferCallExpCSContext {
    return this.getTypedRuleContext(
      RuleClassiferCallExpCSContext,
      0
    ) as RuleClassiferCallExpCSContext;
  }
  public rulePropertyCallExpCS(): RulePropertyCallExpCSContext {
    return this.getTypedRuleContext(
      RulePropertyCallExpCSContext,
      0
    ) as RulePropertyCallExpCSContext;
  }
  public ruleSimpleNameCS(): RuleSimpleNameCSContext {
    return this.getTypedRuleContext(RuleSimpleNameCSContext, 0) as RuleSimpleNameCSContext;
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleStandardNavigationCallExpCS;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleStandardNavigationCallExpCS) {
      listener.enterRuleStandardNavigationCallExpCS(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleStandardNavigationCallExpCS) {
      listener.exitRuleStandardNavigationCallExpCS(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleStandardNavigationCallExpCS) {
      return visitor.visitRuleStandardNavigationCallExpCS(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RuleStandardOperationExpCSContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public ruleVariableExpCS_list(): RuleVariableExpCSContext[] {
    return this.getTypedRuleContexts(RuleVariableExpCSContext) as RuleVariableExpCSContext[];
  }
  public ruleVariableExpCS(i: number): RuleVariableExpCSContext {
    return this.getTypedRuleContext(RuleVariableExpCSContext, i) as RuleVariableExpCSContext;
  }
  public rulePredefineOp(): RulePredefineOpContext {
    return this.getTypedRuleContext(RulePredefineOpContext, 0) as RulePredefineOpContext;
  }
  public ruleIsMarkedPreCS(): RuleIsMarkedPreCSContext {
    return this.getTypedRuleContext(RuleIsMarkedPreCSContext, 0) as RuleIsMarkedPreCSContext;
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleStandardOperationExpCS;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleStandardOperationExpCS) {
      listener.enterRuleStandardOperationExpCS(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleStandardOperationExpCS) {
      listener.exitRuleStandardOperationExpCS(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleStandardOperationExpCS) {
      return visitor.visitRuleStandardOperationExpCS(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RulePredefineOpContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public ruleStandardNoneParameterOperation(): RuleStandardNoneParameterOperationContext {
    return this.getTypedRuleContext(
      RuleStandardNoneParameterOperationContext,
      0
    ) as RuleStandardNoneParameterOperationContext;
  }
  public ruleStandardParameterOperation(): RuleStandardParameterOperationContext {
    return this.getTypedRuleContext(
      RuleStandardParameterOperationContext,
      0
    ) as RuleStandardParameterOperationContext;
  }
  public ruleStandardDateOperation(): RuleStandardDateOperationContext {
    return this.getTypedRuleContext(
      RuleStandardDateOperationContext,
      0
    ) as RuleStandardDateOperationContext;
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_rulePredefineOp;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRulePredefineOp) {
      listener.enterRulePredefineOp(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRulePredefineOp) {
      listener.exitRulePredefineOp(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRulePredefineOp) {
      return visitor.visitRulePredefineOp(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RuleStandardNoneParameterOperationContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleStandardNoneParameterOperation;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleStandardNoneParameterOperation) {
      listener.enterRuleStandardNoneParameterOperation(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleStandardNoneParameterOperation) {
      listener.exitRuleStandardNoneParameterOperation(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleStandardNoneParameterOperation) {
      return visitor.visitRuleStandardNoneParameterOperation(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RuleStandardParameterOperationContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public rulePrimitiveTypeCS(): RulePrimitiveTypeCSContext {
    return this.getTypedRuleContext(RulePrimitiveTypeCSContext, 0) as RulePrimitiveTypeCSContext;
  }
  public ruleEntityType(): RuleEntityTypeContext {
    return this.getTypedRuleContext(RuleEntityTypeContext, 0) as RuleEntityTypeContext;
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleStandardParameterOperation;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleStandardParameterOperation) {
      listener.enterRuleStandardParameterOperation(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleStandardParameterOperation) {
      listener.exitRuleStandardParameterOperation(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleStandardParameterOperation) {
      return visitor.visitRuleStandardParameterOperation(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RuleStandardCollectionOperationContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public ruleSimpleNameCS(): RuleSimpleNameCSContext {
    return this.getTypedRuleContext(RuleSimpleNameCSContext, 0) as RuleSimpleNameCSContext;
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleStandardCollectionOperation;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleStandardCollectionOperation) {
      listener.enterRuleStandardCollectionOperation(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleStandardCollectionOperation) {
      listener.exitRuleStandardCollectionOperation(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleStandardCollectionOperation) {
      return visitor.visitRuleStandardCollectionOperation(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RuleStandardDateOperationContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public ruleSimpleNameCS(): RuleSimpleNameCSContext {
    return this.getTypedRuleContext(RuleSimpleNameCSContext, 0) as RuleSimpleNameCSContext;
  }
  public ruleNumberLiteralExpCS(): RuleNumberLiteralExpCSContext {
    return this.getTypedRuleContext(
      RuleNumberLiteralExpCSContext,
      0
    ) as RuleNumberLiteralExpCSContext;
  }
  public rulePropertyCallExpCS(): RulePropertyCallExpCSContext {
    return this.getTypedRuleContext(
      RulePropertyCallExpCSContext,
      0
    ) as RulePropertyCallExpCSContext;
  }
  public ruleStandardDateOperation(): RuleStandardDateOperationContext {
    return this.getTypedRuleContext(
      RuleStandardDateOperationContext,
      0
    ) as RuleStandardDateOperationContext;
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleStandardDateOperation;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleStandardDateOperation) {
      listener.enterRuleStandardDateOperation(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleStandardDateOperation) {
      listener.exitRuleStandardDateOperation(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleStandardDateOperation) {
      return visitor.visitRuleStandardDateOperation(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RuleClassiferCallExpCSContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public ruleSimpleNameCS(): RuleSimpleNameCSContext {
    return this.getTypedRuleContext(RuleSimpleNameCSContext, 0) as RuleSimpleNameCSContext;
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleClassiferCallExpCS;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleClassiferCallExpCS) {
      listener.enterRuleClassiferCallExpCS(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleClassiferCallExpCS) {
      listener.exitRuleClassiferCallExpCS(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleClassiferCallExpCS) {
      return visitor.visitRuleClassiferCallExpCS(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RulePropertyCallExpCSContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public ruleVariableExpCS_list(): RuleVariableExpCSContext[] {
    return this.getTypedRuleContexts(RuleVariableExpCSContext) as RuleVariableExpCSContext[];
  }
  public ruleVariableExpCS(i: number): RuleVariableExpCSContext {
    return this.getTypedRuleContext(RuleVariableExpCSContext, i) as RuleVariableExpCSContext;
  }
  public ruleSimpleNameCS(): RuleSimpleNameCSContext {
    return this.getTypedRuleContext(RuleSimpleNameCSContext, 0) as RuleSimpleNameCSContext;
  }
  public ruleIsMarkedPreCS(): RuleIsMarkedPreCSContext {
    return this.getTypedRuleContext(RuleIsMarkedPreCSContext, 0) as RuleIsMarkedPreCSContext;
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_rulePropertyCallExpCS;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRulePropertyCallExpCS) {
      listener.enterRulePropertyCallExpCS(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRulePropertyCallExpCS) {
      listener.exitRulePropertyCallExpCS(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRulePropertyCallExpCS) {
      return visitor.visitRulePropertyCallExpCS(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RuleOperationCallExpCSContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public ruleSimpleNameCS(): RuleSimpleNameCSContext {
    return this.getTypedRuleContext(RuleSimpleNameCSContext, 0) as RuleSimpleNameCSContext;
  }
  public ruleOperationParameters_list(): RuleOperationParametersContext[] {
    return this.getTypedRuleContexts(
      RuleOperationParametersContext
    ) as RuleOperationParametersContext[];
  }
  public ruleOperationParameters(i: number): RuleOperationParametersContext {
    return this.getTypedRuleContext(
      RuleOperationParametersContext,
      i
    ) as RuleOperationParametersContext;
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleOperationCallExpCS;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleOperationCallExpCS) {
      listener.enterRuleOperationCallExpCS(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleOperationCallExpCS) {
      listener.exitRuleOperationCallExpCS(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleOperationCallExpCS) {
      return visitor.visitRuleOperationCallExpCS(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RuleOperationParametersContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public ruleSimpleNameCS(): RuleSimpleNameCSContext {
    return this.getTypedRuleContext(RuleSimpleNameCSContext, 0) as RuleSimpleNameCSContext;
  }
  public rulePropertyCallExpCS(): RulePropertyCallExpCSContext {
    return this.getTypedRuleContext(
      RulePropertyCallExpCSContext,
      0
    ) as RulePropertyCallExpCSContext;
  }
  public RULE_SINGLE_QUOTED_STRING(): TerminalNode {
    return this.getToken(REMODELParser.RULE_SINGLE_QUOTED_STRING, 0);
  }
  public RULE_DOUBLE_QUOTED_STRING(): TerminalNode {
    return this.getToken(REMODELParser.RULE_DOUBLE_QUOTED_STRING, 0);
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleOperationParameters;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleOperationParameters) {
      listener.enterRuleOperationParameters(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleOperationParameters) {
      listener.exitRuleOperationParameters(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleOperationParameters) {
      return visitor.visitRuleOperationParameters(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RuleIsMarkedPreCSContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleIsMarkedPreCS;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleIsMarkedPreCS) {
      listener.enterRuleIsMarkedPreCS(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleIsMarkedPreCS) {
      listener.exitRuleIsMarkedPreCS(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleIsMarkedPreCS) {
      return visitor.visitRuleIsMarkedPreCS(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RuleVariableExpCSContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public ruleSimpleNameCS(): RuleSimpleNameCSContext {
    return this.getTypedRuleContext(RuleSimpleNameCSContext, 0) as RuleSimpleNameCSContext;
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleVariableExpCS;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleVariableExpCS) {
      listener.enterRuleVariableExpCS(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleVariableExpCS) {
      listener.exitRuleVariableExpCS(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleVariableExpCS) {
      return visitor.visitRuleVariableExpCS(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RuleSimpleNameCSContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public RULE_ID(): TerminalNode {
    return this.getToken(REMODELParser.RULE_ID, 0);
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleSimpleNameCS;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleSimpleNameCS) {
      listener.enterRuleSimpleNameCS(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleSimpleNameCS) {
      listener.exitRuleSimpleNameCS(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleSimpleNameCS) {
      return visitor.visitRuleSimpleNameCS(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RuleIfExpCSContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public ruleOCLExpressionCS_list(): RuleOCLExpressionCSContext[] {
    return this.getTypedRuleContexts(RuleOCLExpressionCSContext) as RuleOCLExpressionCSContext[];
  }
  public ruleOCLExpressionCS(i: number): RuleOCLExpressionCSContext {
    return this.getTypedRuleContext(RuleOCLExpressionCSContext, i) as RuleOCLExpressionCSContext;
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleIfExpCS;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleIfExpCS) {
      listener.enterRuleIfExpCS(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleIfExpCS) {
      listener.exitRuleIfExpCS(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleIfExpCS) {
      return visitor.visitRuleIfExpCS(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RuleLetExpCSContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public ruleVariableDeclarationCS_list(): RuleVariableDeclarationCSContext[] {
    return this.getTypedRuleContexts(
      RuleVariableDeclarationCSContext
    ) as RuleVariableDeclarationCSContext[];
  }
  public ruleVariableDeclarationCS(i: number): RuleVariableDeclarationCSContext {
    return this.getTypedRuleContext(
      RuleVariableDeclarationCSContext,
      i
    ) as RuleVariableDeclarationCSContext;
  }
  public ruleOCLExpressionCS(): RuleOCLExpressionCSContext {
    return this.getTypedRuleContext(RuleOCLExpressionCSContext, 0) as RuleOCLExpressionCSContext;
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleLetExpCS;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleLetExpCS) {
      listener.enterRuleLetExpCS(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleLetExpCS) {
      listener.exitRuleLetExpCS(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleLetExpCS) {
      return visitor.visitRuleLetExpCS(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RuleVariableDeclarationCSContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public ruleSimpleNameCS(): RuleSimpleNameCSContext {
    return this.getTypedRuleContext(RuleSimpleNameCSContext, 0) as RuleSimpleNameCSContext;
  }
  public ruleTypeCS(): RuleTypeCSContext {
    return this.getTypedRuleContext(RuleTypeCSContext, 0) as RuleTypeCSContext;
  }
  public ruleOCLExpressionCS(): RuleOCLExpressionCSContext {
    return this.getTypedRuleContext(RuleOCLExpressionCSContext, 0) as RuleOCLExpressionCSContext;
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleVariableDeclarationCS;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleVariableDeclarationCS) {
      listener.enterRuleVariableDeclarationCS(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleVariableDeclarationCS) {
      listener.exitRuleVariableDeclarationCS(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleVariableDeclarationCS) {
      return visitor.visitRuleVariableDeclarationCS(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RuleLiteralExpCSContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public ruleCollectionLiteralExpCS(): RuleCollectionLiteralExpCSContext {
    return this.getTypedRuleContext(
      RuleCollectionLiteralExpCSContext,
      0
    ) as RuleCollectionLiteralExpCSContext;
  }
  public rulePrimitiveLiteralExpCS(): RulePrimitiveLiteralExpCSContext {
    return this.getTypedRuleContext(
      RulePrimitiveLiteralExpCSContext,
      0
    ) as RulePrimitiveLiteralExpCSContext;
  }
  public ruleEnumLiteralExpCS(): RuleEnumLiteralExpCSContext {
    return this.getTypedRuleContext(RuleEnumLiteralExpCSContext, 0) as RuleEnumLiteralExpCSContext;
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleLiteralExpCS;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleLiteralExpCS) {
      listener.enterRuleLiteralExpCS(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleLiteralExpCS) {
      listener.exitRuleLiteralExpCS(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleLiteralExpCS) {
      return visitor.visitRuleLiteralExpCS(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RuleEnumLiteralExpCSContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public ruleSimpleNameCS(): RuleSimpleNameCSContext {
    return this.getTypedRuleContext(RuleSimpleNameCSContext, 0) as RuleSimpleNameCSContext;
  }
  public RULE_ID(): TerminalNode {
    return this.getToken(REMODELParser.RULE_ID, 0);
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleEnumLiteralExpCS;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleEnumLiteralExpCS) {
      listener.enterRuleEnumLiteralExpCS(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleEnumLiteralExpCS) {
      listener.exitRuleEnumLiteralExpCS(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleEnumLiteralExpCS) {
      return visitor.visitRuleEnumLiteralExpCS(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RuleCollectionTypeCSContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public ruleCollectionTypeIdentifierCS(): RuleCollectionTypeIdentifierCSContext {
    return this.getTypedRuleContext(
      RuleCollectionTypeIdentifierCSContext,
      0
    ) as RuleCollectionTypeIdentifierCSContext;
  }
  public ruleTypeCS(): RuleTypeCSContext {
    return this.getTypedRuleContext(RuleTypeCSContext, 0) as RuleTypeCSContext;
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleCollectionTypeCS;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleCollectionTypeCS) {
      listener.enterRuleCollectionTypeCS(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleCollectionTypeCS) {
      listener.exitRuleCollectionTypeCS(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleCollectionTypeCS) {
      return visitor.visitRuleCollectionTypeCS(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RuleCollectionLiteralExpCSContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public ruleCollectionTypeIdentifierCS(): RuleCollectionTypeIdentifierCSContext {
    return this.getTypedRuleContext(
      RuleCollectionTypeIdentifierCSContext,
      0
    ) as RuleCollectionTypeIdentifierCSContext;
  }
  public ruleCollectionLiteralPartCS_list(): RuleCollectionLiteralPartCSContext[] {
    return this.getTypedRuleContexts(
      RuleCollectionLiteralPartCSContext
    ) as RuleCollectionLiteralPartCSContext[];
  }
  public ruleCollectionLiteralPartCS(i: number): RuleCollectionLiteralPartCSContext {
    return this.getTypedRuleContext(
      RuleCollectionLiteralPartCSContext,
      i
    ) as RuleCollectionLiteralPartCSContext;
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleCollectionLiteralExpCS;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleCollectionLiteralExpCS) {
      listener.enterRuleCollectionLiteralExpCS(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleCollectionLiteralExpCS) {
      listener.exitRuleCollectionLiteralExpCS(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleCollectionLiteralExpCS) {
      return visitor.visitRuleCollectionLiteralExpCS(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RuleCollectionLiteralPartCSContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public ruleCollectionRangeCS(): RuleCollectionRangeCSContext {
    return this.getTypedRuleContext(
      RuleCollectionRangeCSContext,
      0
    ) as RuleCollectionRangeCSContext;
  }
  public ruleCollectionItem(): RuleCollectionItemContext {
    return this.getTypedRuleContext(RuleCollectionItemContext, 0) as RuleCollectionItemContext;
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleCollectionLiteralPartCS;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleCollectionLiteralPartCS) {
      listener.enterRuleCollectionLiteralPartCS(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleCollectionLiteralPartCS) {
      listener.exitRuleCollectionLiteralPartCS(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleCollectionLiteralPartCS) {
      return visitor.visitRuleCollectionLiteralPartCS(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RuleCollectionRangeCSContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public ruleOCLExpressionCS_list(): RuleOCLExpressionCSContext[] {
    return this.getTypedRuleContexts(RuleOCLExpressionCSContext) as RuleOCLExpressionCSContext[];
  }
  public ruleOCLExpressionCS(i: number): RuleOCLExpressionCSContext {
    return this.getTypedRuleContext(RuleOCLExpressionCSContext, i) as RuleOCLExpressionCSContext;
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleCollectionRangeCS;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleCollectionRangeCS) {
      listener.enterRuleCollectionRangeCS(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleCollectionRangeCS) {
      listener.exitRuleCollectionRangeCS(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleCollectionRangeCS) {
      return visitor.visitRuleCollectionRangeCS(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RuleCollectionItemContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public ruleOCLExpressionCS(): RuleOCLExpressionCSContext {
    return this.getTypedRuleContext(RuleOCLExpressionCSContext, 0) as RuleOCLExpressionCSContext;
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleCollectionItem;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleCollectionItem) {
      listener.enterRuleCollectionItem(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleCollectionItem) {
      listener.exitRuleCollectionItem(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleCollectionItem) {
      return visitor.visitRuleCollectionItem(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RulePrimitiveLiteralExpCSContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public ruleNumberLiteralExpCS(): RuleNumberLiteralExpCSContext {
    return this.getTypedRuleContext(
      RuleNumberLiteralExpCSContext,
      0
    ) as RuleNumberLiteralExpCSContext;
  }
  public ruleStringLiteralExpCS(): RuleStringLiteralExpCSContext {
    return this.getTypedRuleContext(
      RuleStringLiteralExpCSContext,
      0
    ) as RuleStringLiteralExpCSContext;
  }
  public ruleBooleanLiteralExpCS(): RuleBooleanLiteralExpCSContext {
    return this.getTypedRuleContext(
      RuleBooleanLiteralExpCSContext,
      0
    ) as RuleBooleanLiteralExpCSContext;
  }
  public ruleNullLiteralExpCS(): RuleNullLiteralExpCSContext {
    return this.getTypedRuleContext(RuleNullLiteralExpCSContext, 0) as RuleNullLiteralExpCSContext;
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_rulePrimitiveLiteralExpCS;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRulePrimitiveLiteralExpCS) {
      listener.enterRulePrimitiveLiteralExpCS(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRulePrimitiveLiteralExpCS) {
      listener.exitRulePrimitiveLiteralExpCS(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRulePrimitiveLiteralExpCS) {
      return visitor.visitRulePrimitiveLiteralExpCS(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RuleNumberLiteralExpCSContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public ruleIntegerLiteralExpCS(): RuleIntegerLiteralExpCSContext {
    return this.getTypedRuleContext(
      RuleIntegerLiteralExpCSContext,
      0
    ) as RuleIntegerLiteralExpCSContext;
  }
  public ruleRealLiteralExpCS(): RuleRealLiteralExpCSContext {
    return this.getTypedRuleContext(RuleRealLiteralExpCSContext, 0) as RuleRealLiteralExpCSContext;
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleNumberLiteralExpCS;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleNumberLiteralExpCS) {
      listener.enterRuleNumberLiteralExpCS(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleNumberLiteralExpCS) {
      listener.exitRuleNumberLiteralExpCS(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleNumberLiteralExpCS) {
      return visitor.visitRuleNumberLiteralExpCS(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RuleIntegerLiteralExpCSContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public RULE_INT(): TerminalNode {
    return this.getToken(REMODELParser.RULE_INT, 0);
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleIntegerLiteralExpCS;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleIntegerLiteralExpCS) {
      listener.enterRuleIntegerLiteralExpCS(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleIntegerLiteralExpCS) {
      listener.exitRuleIntegerLiteralExpCS(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleIntegerLiteralExpCS) {
      return visitor.visitRuleIntegerLiteralExpCS(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RuleRealLiteralExpCSContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public ruleFloat(): RuleFloatContext {
    return this.getTypedRuleContext(RuleFloatContext, 0) as RuleFloatContext;
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleRealLiteralExpCS;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleRealLiteralExpCS) {
      listener.enterRuleRealLiteralExpCS(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleRealLiteralExpCS) {
      listener.exitRuleRealLiteralExpCS(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleRealLiteralExpCS) {
      return visitor.visitRuleRealLiteralExpCS(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RuleBooleanLiteralExpCSContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleBooleanLiteralExpCS;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleBooleanLiteralExpCS) {
      listener.enterRuleBooleanLiteralExpCS(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleBooleanLiteralExpCS) {
      listener.exitRuleBooleanLiteralExpCS(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleBooleanLiteralExpCS) {
      return visitor.visitRuleBooleanLiteralExpCS(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RuleStringLiteralExpCSContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public RULE_SINGLE_QUOTED_STRING(): TerminalNode {
    return this.getToken(REMODELParser.RULE_SINGLE_QUOTED_STRING, 0);
  }
  public RULE_DOUBLE_QUOTED_STRING(): TerminalNode {
    return this.getToken(REMODELParser.RULE_DOUBLE_QUOTED_STRING, 0);
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleStringLiteralExpCS;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleStringLiteralExpCS) {
      listener.enterRuleStringLiteralExpCS(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleStringLiteralExpCS) {
      listener.exitRuleStringLiteralExpCS(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleStringLiteralExpCS) {
      return visitor.visitRuleStringLiteralExpCS(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RuleNullLiteralExpCSContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleNullLiteralExpCS;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleNullLiteralExpCS) {
      listener.enterRuleNullLiteralExpCS(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleNullLiteralExpCS) {
      listener.exitRuleNullLiteralExpCS(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleNullLiteralExpCS) {
      return visitor.visitRuleNullLiteralExpCS(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RuleFloatContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public RULE_INT_list(): TerminalNode[] {
    return this.getTokens(REMODELParser.RULE_INT);
  }
  public RULE_INT(i: number): TerminalNode {
    return this.getToken(REMODELParser.RULE_INT, i);
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleFloat;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleFloat) {
      listener.enterRuleFloat(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleFloat) {
      listener.exitRuleFloat(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleFloat) {
      return visitor.visitRuleFloat(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RuleCollectionTypeIdentifierCSContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleCollectionTypeIdentifierCS;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleCollectionTypeIdentifierCS) {
      listener.enterRuleCollectionTypeIdentifierCS(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleCollectionTypeIdentifierCS) {
      listener.exitRuleCollectionTypeIdentifierCS(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleCollectionTypeIdentifierCS) {
      return visitor.visitRuleCollectionTypeIdentifierCS(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RulePrimitiveTypeCSContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_rulePrimitiveTypeCS;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRulePrimitiveTypeCS) {
      listener.enterRulePrimitiveTypeCS(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRulePrimitiveTypeCS) {
      listener.exitRulePrimitiveTypeCS(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRulePrimitiveTypeCS) {
      return visitor.visitRulePrimitiveTypeCS(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}

export class RuleAssociationTypeCSContext extends ParserRuleContext {
  constructor(parser?: REMODELParser, parent?: ParserRuleContext, invokingState?: number) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public get ruleIndex(): number {
    return REMODELParser.RULE_ruleAssociationTypeCS;
  }
  public enterRule(listener: REMODELListener): void {
    if (listener.enterRuleAssociationTypeCS) {
      listener.enterRuleAssociationTypeCS(this);
    }
  }
  public exitRule(listener: REMODELListener): void {
    if (listener.exitRuleAssociationTypeCS) {
      listener.exitRuleAssociationTypeCS(this);
    }
  }
  // @Override
  public accept<Result>(visitor: REMODELVisitor<Result>): Result {
    if (visitor.visitRuleAssociationTypeCS) {
      return visitor.visitRuleAssociationTypeCS(this);
    } else {
      return visitor.visitChildren(this);
    }
  }
}
