import {getRemodelAntlr} from '@/remodel/parser';
import {chunk} from 'lodash';
import {TerminalNode} from 'antlr4';
import template from '@babel/template';
import 'colors';
import REMODELParser, {
  RuleVariableDeclarationCSContext,
  RuleDefinitionContext,
  RuleOCLExpressionCSContext,
  RuleLogicFormulaExpCSContext,
  RuleAtomicExpressionContext,
  RuleLeftSubAtomicExpressionContext,
  RuleCallExpCSContext,
  RuleLoopExpCSContext,
  RuleIteratorExpCSContext,
  RuleClassiferCallExpCSContext,
  RuleFeatureCallExpCSContext,
  RulePropertyCallExpCSContext,
  RuleRightSubAtomicExpressionContext,
  RuleVariableExpCSContext,
  RulePreconditionContext,
  RuleStandardOperationExpCSContext,
  RulePredefineOpContext,
  RuleLiteralExpCSContext,
  RulePrimitiveLiteralExpCSContext,
  RuleEnumLiteralExpCSContext,
  RuleIfExpCSContext,
  RuleNestedExpCSContext,
  RuleStandardNavigationCallExpCSContext,
  RuleOperationCallExpCSContext,
  RuleStandardDateOperationContext,
  RuleNumberLiteralExpCSContext,
  RulePostconditionContext,
  RuleLetExpCSContext,
  RuleOperationParametersContext,
  RuleCollectionLiteralExpCSContext,
  RuleCollectionLiteralPartCSContext,
  RuleCollectionRangeCSContext,
  RuleCollectionItemContext,
} from '../../antlr4/REMODELParser';
import * as t from '@babel/types';
import REMODELVisitor from '../../antlr4/REMODELVisitor';
import {getTypescriptType} from './util';
import generate from '@babel/generator';
type VisitorReturnType =
  | t.Expression
  | t.Statement
  | t.Identifier
  | t.Pattern
  | t.RestElement
  | t.SpreadElement;
type REMODELParserKeys = Extract<
  keyof Omit<InstanceType<typeof REMODELParser>, 'ruleNames'>,
  `rule${string}`
>;
type R<T> = T extends `rule${infer Rule}` ? Rule : string;
type Rule = R<REMODELParserKeys>;
type RuleContext = Extract<Rule, 'Definition' | 'Precondition' | 'Postcondition'>;
export type ContractLoweringMode = 'execute' | 'check';
export type ContractToTypescriptOptions = {
  loweringMode?: ContractLoweringMode;
  stateIdentifier?: string;
  traceIdentifier?: string;
  temporalIdentifier?: string;
};
type InternalContext =
  | 'ifContext'
  | 'thenContext'
  | 'elseContext'
  | 'someContext'
  | 'filterContext'
  | 'everyContext'
  | 'findContext'
  | 'mapContext'
  | 'forEachContext';
type LogicFormulaExpressionItem = {
  logic: t.Expression;
  execute?: t.Expression;
  description: t.Expression;
  then?: t.Expression;
  else?: t.Expression;
};
type Var = {
  name: string;
  type: string;
};
const ruleIteratorIdentifierMap = {
  one: 'one',
  forAll: 'every',
  exists: 'some',
  select: 'filter',
  any: 'find',
  collect: 'map',
};
const ruleStandardCollectionOperationMap = {
  includes: 'includes',
  excludes: 'excludes',
  includesAll: 'includesAll',
  excludesAll: 'excludesAll',
};
const ruleStandardCollectionPostconditionOperationMap = {
  includes: 'includeIfAbsent',
  excludes: 'removeIfPresent',
  includesAll: 'includeAllIfAbsent',
  excludesAll: 'removeAllIfPresent',
};
const dayjsCompareOperationMap = {
  isBefore: 'isBefore',
  isAfter: 'isAfter',
  isEqual: 'isSame',
};
const dayjsOperationMap = {
  Before: 'subtract',
  After: 'add',
};
const variableKeywordMap = {
  result: 'result',
  self: 'this',
};
export type C2TCounter = {
  variableKeyword: {[key in keyof typeof variableKeywordMap]: number};
  ruleIteratorIdentifier: {
    [key in keyof typeof ruleIteratorIdentifierMap]: number;
  };
  ruleStandardCollectionOperation: {
    [key in keyof typeof ruleStandardCollectionOperationMap]: number;
  };
  ruleStandardCollectionPostconditionOperation: {
    [key in keyof typeof ruleStandardCollectionPostconditionOperationMap]: number;
  };
  dayjsCompareOperation: {
    [key in keyof typeof dayjsCompareOperationMap]: number;
  };
  dayjsOperation: {[key in keyof typeof dayjsOperationMap]: number};
  expressionCount: number;
  expressions: string[];
};
export class ContractToTypescript extends REMODELVisitor<VisitorReturnType | VisitorReturnType[]> {
  counter!: C2TCounter;
  readonly loweringMode: ContractLoweringMode;
  readonly stateIdentifier: string;
  readonly traceIdentifier: string;
  readonly temporalIdentifier?: string;
  constructor(options: ContractToTypescriptOptions = {}) {
    super();
    this.loweringMode = options.loweringMode ?? 'execute';
    this.stateIdentifier = options.stateIdentifier ?? 'oclState';
    this.traceIdentifier = options.traceIdentifier ?? 'oclExecutionTrace';
    this.temporalIdentifier = options.temporalIdentifier;
    this.counter = {} as typeof this.counter;
    this.counter.expressionCount = 0;
    this.counter.expressions = [];
    this.counter.ruleIteratorIdentifier = {} as typeof this.counter.ruleIteratorIdentifier;
    this.counter.ruleStandardCollectionOperation =
      {} as typeof this.counter.ruleStandardCollectionOperation;
    this.counter.ruleStandardCollectionPostconditionOperation =
      {} as typeof this.counter.ruleStandardCollectionPostconditionOperation;
    this.counter.dayjsCompareOperation = {} as typeof this.counter.dayjsCompareOperation;
    this.counter.dayjsOperation = {} as typeof this.counter.dayjsOperation;
    this.counter.variableKeyword = {} as typeof this.counter.variableKeyword;
    Object.keys(ruleIteratorIdentifierMap).forEach(
      (k) =>
        (this.counter['ruleIteratorIdentifier'][k as keyof typeof ruleIteratorIdentifierMap] = 0)
    );
    Object.keys(ruleStandardCollectionOperationMap).forEach(
      (k) =>
        (this.counter['ruleStandardCollectionOperation'][
          k as keyof typeof ruleStandardCollectionOperationMap
        ] = 0)
    );
    Object.keys(ruleStandardCollectionPostconditionOperationMap).forEach(
      (k) =>
        (this.counter['ruleStandardCollectionPostconditionOperation'][
          k as keyof typeof ruleStandardCollectionPostconditionOperationMap
        ] = 0)
    );
    Object.keys(dayjsCompareOperationMap).forEach(
      (k) => (this.counter['dayjsCompareOperation'][k as keyof typeof dayjsCompareOperationMap] = 0)
    );
    Object.keys(dayjsOperationMap).forEach(
      (k) => (this.counter['dayjsOperation'][k as keyof typeof dayjsOperationMap] = 0)
    );
    Object.keys(variableKeywordMap).forEach(
      (k) => (this.counter['variableKeyword'][k as keyof typeof variableKeywordMap] = 0)
    );
  }
  vars: Var[] = [];
  globalVars: Var[] = [];
  private readonly inferredVarTypes = new WeakMap<RuleVariableDeclarationCSContext, string>();
  ruleContext: RuleContext = 'Precondition';
  internalContextArray: InternalContext[] = [];
  ruleIteratorIdentifierMap = ruleIteratorIdentifierMap;
  ruleStandardCollectionOperationMap = ruleStandardCollectionOperationMap;
  ruleStandardCollectionPostconditionOperationMap = ruleStandardCollectionPostconditionOperationMap;
  dayjsCompareOperationMap = dayjsCompareOperationMap;
  dayjsOperationMap = dayjsOperationMap;
  variableKeywordMap = variableKeywordMap;
  transform(
    input: string,
    rule: RuleContext,
    {
      ruleContext,
      vars,
      globalVars,
    }: {
      ruleContext?: RuleContext;
      globalVars?: Var[];
      vars?: Var[];
    } = {}
  ) {
    const {lexer, parser} = getRemodelAntlr(input);
    const errors: {
      line: number;
      column: number;
      msg: string;
    }[] = [];
    const errorListener = {
      syntaxError: function (
        _recognizer: unknown,
        _offendingSymbol: unknown,
        line: number,
        column: number,
        msg: string
      ) {
        errors.push({
          line,
          column,
          msg,
        });
      },
    };
    lexer.removeErrorListeners();
    parser.removeErrorListeners();
    lexer.addErrorListener(errorListener);
    parser.addErrorListener(errorListener);
    if (ruleContext) {
      this.ruleContext = ruleContext;
    }
    if (globalVars) {
      this.globalVars = globalVars;
    }
    if (vars) {
      this.vars = vars;
    }
    const context =
      rule === 'Definition'
        ? parser.ruleStandaloneDefinition().ruleDefinition()
        : rule === 'Precondition'
          ? parser.ruleStandalonePrecondition().rulePrecondition()
          : parser.ruleStandalonePostcondition().rulePostcondition();
    lexer.removeErrorListeners();
    parser.removeErrorListeners();
    if (errors.length > 0) {
      const details = errors.map(({line, column, msg}) => `${line}:${column} ${msg}`).join('; ');
      throw new Error(`Invalid REMODEL ${rule}: ${details}`);
    }
    return this.visit(context);
  }
  visitRuleDefinition = (ctx: RuleDefinitionContext) => {
    this.ruleContext = 'Definition';
    return ctx.ruleVariableDeclarationCS_list()?.map((e) => this.visit(e)) as t.Statement[];
  };
  visitRulePrecondition = (ctx: RulePreconditionContext) => {
    this.ruleContext = 'Precondition';
    const preconditionExpression = this.buildLogicFormulaBuilderBuildExpression(
      this.visit(ctx.ruleOCLExpressionCS()) as t.Expression
    );
    return [
      t.variableDeclaration('const', [
        t.variableDeclarator(
          t.objectPattern([
            t.objectProperty(
              t.identifier('errorMessage'),
              t.identifier('preconditionErrorMessage')
            ),
            t.objectProperty(t.identifier('pass'), t.identifier('isPreconditionPass')),
          ]),
          preconditionExpression
        ),
      ]),
      t.ifStatement(
        t.unaryExpression('!', t.identifier('isPreconditionPass')),
        t.blockStatement([
          t.throwStatement(
            t.newExpression(t.identifier('PreconditionError'), [
              t.identifier('preconditionErrorMessage'),
            ])
          ),
        ])
      ),
    ];
  };
  visitRulePostcondition = (ctx: RulePostconditionContext) => {
    this.ruleContext = 'Postcondition';
    const res = this.visit(ctx.ruleOCLExpressionCS());
    return Array.isArray(res)
      ? res
      : [
          t.returnStatement(
            t.memberExpression(
              this.buildLogicFormulaBuilderBuildExpression(res as t.CallExpression),
              t.identifier(this.loweringMode === 'execute' ? 'value' : 'pass')
            )
          ),
        ];
  };
  private buildLogicFormulaBuilderBuildExpression = (memberExpression: t.Expression) => {
    return t.callExpression(t.memberExpression(memberExpression, t.identifier('build')), []);
  };
  visitRuleVariableDeclarationCS = (ctx: RuleVariableDeclarationCSContext) => {
    const varName = ctx.ruleSimpleNameCS().getText();
    const varType = ctx.ruleTypeCS()?.getText() || this.inferredVarTypes.get(ctx) || 'any';
    this.vars.push({
      name: varName,
      type: varType,
    });
    const varValueContext = ctx.ruleOCLExpressionCS();
    const identifier = t.identifier(this.useVarName(varName));
    identifier.typeAnnotation = getTypescriptType(varType);
    if (
      ctx.parentCtx instanceof RuleDefinitionContext ||
      ctx.parentCtx instanceof RuleLetExpCSContext
    ) {
      const declaration = t.variableDeclarator(identifier);
      if (varValueContext) {
        const resultProperty =
          this.ruleContext === 'Postcondition' && this.loweringMode === 'execute'
            ? 'value'
            : 'pass';
        declaration.init = t.memberExpression(
          this.buildLogicFormulaBuilderBuildExpression(this.visit(varValueContext) as t.Expression),
          t.identifier(resultProperty)
        );
      } else if (
        this.loweringMode === 'check' &&
        this.ruleContext === 'Postcondition' &&
        ctx.parentCtx instanceof RuleLetExpCSContext
      ) {
        declaration.init = this.createStateCall('findNew', [t.identifier(varType)]);
      }
      return t.variableDeclaration('let', [declaration]);
    } else {
      return identifier;
    }
  };
  countExpression(expression: string) {
    if (!this.counter.expressions.includes(expression)) {
      this.counter.expressions.push(expression);
      this.counter.expressionCount++;
    }
  }
  visitRuleOCLExpressionCS = (ctx: RuleOCLExpressionCSContext) => {
    const ruleLetExpCSText = ctx.ruleLetExpCS()?.getText();
    const ruleIfExpCSText = ctx.ruleIfExpCS()?.getText();
    const ruleLogicFormulaExpCSText = ctx.ruleLogicFormulaExpCS()?.getText();
    const ruleLiteralExpCSText = ctx.ruleLiteralExpCS()?.getText();
    const ruleNestedExpCSText = ctx.ruleNestedExpCS()?.getText();
    if (ctx.ruleLetExpCS()) {
      this.countExpression(ruleLetExpCSText);
      return this.visit(ctx.ruleLetExpCS());
    }
    if (ctx.ruleIfExpCS()) {
      this.countExpression(ruleIfExpCSText);
      return this.visit(ctx.ruleIfExpCS());
    }
    if (ctx.ruleLogicFormulaExpCS()) {
      this.countExpression(ruleLogicFormulaExpCSText);
      return this.visit(ctx.ruleLogicFormulaExpCS());
    }
    if (ctx.ruleNestedExpCS()) {
      this.countExpression(ruleNestedExpCSText);
      return this.visit(ctx.ruleNestedExpCS());
    }
    this.countExpression(ruleLiteralExpCSText || ruleNestedExpCSText);
    return (
      template`
      l(PARAMS)
    `({
        PARAMS: t.objectExpression([
          t.objectProperty(
            t.identifier('logic'),
            t.arrowFunctionExpression(
              [],
              this.visit(ctx.ruleLiteralExpCS()) as t.Expression
            ) as t.Expression
          ),
          t.objectProperty(
            t.identifier('description'),
            t.stringLiteral(ctx.ruleLiteralExpCS().getText()!)
          ),
        ]),
      }) as t.ExpressionStatement
    ).expression;
  };
  visitRuleIfExpCS = (ctx: RuleIfExpCSContext) => {
    const [, ifContext, , thenContext, , elseContext] = ctx.children!;
    this.internalContextArray.push('ifContext');
    const item: LogicFormulaExpressionItem = {
      logic: t.arrowFunctionExpression([], this.visit(ifContext) as t.Expression),
      description: t.stringLiteral(ifContext.getText()),
    };
    this.internalContextArray.pop();
    this.internalContextArray.push('thenContext');
    item.then = this.visit(thenContext) as t.Expression;
    this.internalContextArray.pop();
    if (elseContext) {
      this.internalContextArray.push('elseContext');
      item.else = this.visit(elseContext) as t.Expression;
      this.internalContextArray.pop();
    }
    return t.callExpression(
      t.memberExpression(t.callExpression(t.identifier('l'), []), t.identifier('if')),
      [
        t.objectExpression(
          Object.entries(item).map(([key, value]) => t.objectProperty(t.identifier(key), value))
        ),
      ]
    );
  };
  visitRuleLetExpCS = (ctx: RuleLetExpCSContext) => {
    ctx.ruleVariableDeclarationCS_list().forEach((declaration) => {
      if (!declaration.ruleTypeCS()) {
        const inferredType = this.inferVariableTypeFromMembership(
          ctx.ruleOCLExpressionCS(),
          declaration.ruleSimpleNameCS().getText()
        );
        if (inferredType) {
          this.inferredVarTypes.set(declaration, inferredType);
        }
      }
    });
    const declareExpressions = ctx.ruleVariableDeclarationCS_list().map((e) => {
      return this.visit(e) as t.Statement;
    });
    const oclExpression = this.visit(ctx.ruleOCLExpressionCS()) as t.Expression;
    if (ctx.parentCtx?.parentCtx instanceof RulePostconditionContext) {
      return [
        ...declareExpressions,
        t.returnStatement(
          t.memberExpression(
            this.buildLogicFormulaBuilderBuildExpression(oclExpression),
            t.identifier(this.loweringMode === 'execute' ? 'value' : 'pass')
          )
        ),
      ];
    }
    return t.callExpression(
      t.arrowFunctionExpression(
        [],
        t.blockStatement([...declareExpressions, t.returnStatement(oclExpression)])
      ),
      []
    );
  };
  visitRuleNestedExpCS = (ctx: RuleNestedExpCSContext) => this.visit(ctx.ruleOCLExpressionCS());
  visitRuleLiteralExpCS = (ctx: RuleLiteralExpCSContext) => {
    if (ctx.ruleCollectionLiteralExpCS()) {
      return this.visit(ctx.ruleCollectionLiteralExpCS());
    }
    if (ctx.ruleEnumLiteralExpCS()) {
      return this.visit(ctx.ruleEnumLiteralExpCS());
    }
    return this.visit(ctx.rulePrimitiveLiteralExpCS());
  };
  private buildOclValue = (expression: t.Expression) =>
    t.memberExpression(
      this.buildLogicFormulaBuilderBuildExpression(expression),
      t.identifier('pass')
    );
  visitRuleCollectionLiteralExpCS = (ctx: RuleCollectionLiteralExpCSContext) => {
    const elements = ctx
      .ruleCollectionLiteralPartCS_list()
      .map((part) => this.visit(part) as t.Expression | t.SpreadElement);
    const values = t.arrayExpression(elements);
    return t.callExpression(t.memberExpression(t.identifier('Array'), t.identifier('from')), [
      t.newExpression(t.identifier('Set'), [values]),
    ]);
  };
  visitRuleCollectionLiteralPartCS = (ctx: RuleCollectionLiteralPartCSContext) =>
    ctx.ruleCollectionRangeCS()
      ? this.visit(ctx.ruleCollectionRangeCS())
      : this.visit(ctx.ruleCollectionItem());
  visitRuleCollectionItem = (ctx: RuleCollectionItemContext) =>
    this.buildOclValue(this.visit(ctx.ruleOCLExpressionCS()) as t.Expression);
  visitRuleCollectionRangeCS = (ctx: RuleCollectionRangeCSContext) => {
    const [startContext, endContext] = ctx.ruleOCLExpressionCS_list();
    const start = this.buildOclValue(this.visit(startContext) as t.Expression);
    const end = this.buildOclValue(this.visit(endContext) as t.Expression);
    const index = t.identifier('_rangeIndex');
    const length = t.binaryExpression(
      '+',
      t.binaryExpression('-', end, start),
      t.numericLiteral(1)
    );
    return t.spreadElement(
      t.callExpression(t.memberExpression(t.identifier('Array'), t.identifier('from')), [
        t.objectExpression([t.objectProperty(t.identifier('length'), length)]),
        t.arrowFunctionExpression(
          [t.identifier('_rangeValue'), index],
          t.binaryExpression('+', start, index)
        ),
      ])
    );
  };
  visitRuleEnumLiteralExpCS = (ctx: RuleEnumLiteralExpCSContext) => {
    const enumName = ctx.ruleSimpleNameCS()?.getText();
    const enumLiteralName = ctx.RULE_ID().getText();
    return t.memberExpression(t.identifier(enumName), t.identifier(enumLiteralName));
  };
  visitRulePrimitiveLiteralExpCS = (ctx: RulePrimitiveLiteralExpCSContext) => {
    if (ctx.ruleStringLiteralExpCS()) {
      const text = ctx.ruleStringLiteralExpCS().getText();
      return t.stringLiteral(this.decodeStringLiteral(text));
    }
    if (ctx.ruleNumberLiteralExpCS()) {
      return this.visit(ctx.ruleNumberLiteralExpCS());
    }
    if (ctx.ruleNullLiteralExpCS()) {
      return t.identifier('undefined');
    }
    return t.booleanLiteral(ctx.ruleBooleanLiteralExpCS()?.getText() === 'true' || false);
  };
  private decodeStringLiteral = (text: string) => {
    const escapes: Record<string, string> = {
      b: '\b',
      t: '\t',
      n: '\n',
      f: '\f',
      r: '\r',
      '"': '"',
      "'": "'",
      '\\': '\\',
    };
    const body = text.startsWith("'") ? text.slice(1, -1).replace(/''/g, "'") : text.slice(1, -1);
    return body.replace(/\\u([0-9a-fA-F]{4})|\\([btnfr"'\\])/g, (_match, hex, escaped) =>
      hex ? String.fromCharCode(Number.parseInt(hex, 16)) : escapes[escaped]
    );
  };
  visitRuleNumberLiteralExpCS = (ctx: RuleNumberLiteralExpCSContext) => {
    return t.numericLiteral(parseFloat(ctx.getText()));
  };
  private createStateCall = (method: 'preValue' | 'isNew' | 'findNew', args: t.Expression[]) =>
    t.callExpression(
      t.memberExpression(t.identifier(this.stateIdentifier), t.identifier(method)),
      args
    );
  private createTraceCall = (method: 'call' | 'wasCalled', args: t.Expression[]) =>
    t.callExpression(
      t.memberExpression(t.identifier(this.traceIdentifier), t.identifier(method)),
      args
    );
  private createTemporalLiteral = (name: 'Today' | 'Now') => {
    const now = this.temporalIdentifier
      ? t.identifier(this.temporalIdentifier)
      : t.callExpression(t.identifier('dayjs'), []);
    if (name === 'Today') {
      return t.callExpression(t.memberExpression(now, t.identifier('startOf')), [
        t.stringLiteral('day'),
      ]);
    }
    return now;
  };
  private isEffectContext = () =>
    this.loweringMode === 'execute' &&
    this.ruleContext === 'Postcondition' &&
    this.internalContextArray.at(-1) !== 'ifContext' &&
    this.internalContextArray.at(-1) !== 'someContext' &&
    this.internalContextArray.at(-1) !== 'filterContext' &&
    this.internalContextArray.at(-1) !== 'everyContext' &&
    this.internalContextArray.at(-1) !== 'findContext' &&
    this.internalContextArray.at(-1) !== 'mapContext';
  private isAssignableAtomicLeft = (ctx: RuleLeftSubAtomicExpressionContext) => {
    if (ctx.ruleVariableExpCS()) {
      return true;
    }
    const property = ctx.ruleCallExpCS()?.ruleFeatureCallExpCS()?.rulePropertyCallExpCS();
    return !!property && !property.ruleIsMarkedPreCS();
  };
  private containsPostconditionEffect = (node: unknown): boolean => {
    if (!node) {
      return false;
    }
    if (node instanceof RuleIfExpCSContext) {
      return node
        .ruleOCLExpressionCS_list()
        .slice(1)
        .some((branch) => this.containsPostconditionEffect(branch));
    }
    if (node instanceof RuleIteratorExpCSContext) {
      if (node.ruleIteratorIdentifier().getText() !== 'forAll') {
        return false;
      }
      return this.containsPostconditionEffect(node.ruleLogicFormulaExpCS() || node.ruleIfExpCS());
    }
    if (
      node instanceof RuleAtomicExpressionContext &&
      node.ruleInfixCompareOperatorName()?.getText() === '=' &&
      this.isAssignableAtomicLeft(node.ruleLeftSubAtomicExpression())
    ) {
      return true;
    }
    if (node instanceof RuleStandardNavigationCallExpCSContext) {
      return true;
    }
    if (node instanceof RuleOperationCallExpCSContext) {
      return true;
    }
    if (
      node instanceof RuleStandardOperationExpCSContext &&
      node.rulePredefineOp().getText() === 'oclIsNew()'
    ) {
      return true;
    }
    return (
      (
        node as {
          children?: unknown[];
        }
      ).children || []
    ).some((child) => this.containsPostconditionEffect(child));
  };
  private isAssignableExpression = (
    expression: t.Expression
  ): expression is t.Identifier | t.MemberExpression =>
    t.isIdentifier(expression) || t.isMemberExpression(expression);
  private inferVariableTypeFromMembership = (
    root: unknown,
    variableName: string
  ): string | undefined => {
    let inferredType: string | undefined;
    const visitNode = (node: unknown) => {
      if (!node || inferredType) {
        return;
      }
      if (node instanceof RuleStandardNavigationCallExpCSContext) {
        const classifier = node.ruleClassiferCallExpCS();
        const operation = node.ruleStandardCollectionOperation();
        if (classifier && operation) {
          const operationName = operation.children?.[0]?.getText();
          const argumentName = operation.children?.[2]?.getText();
          if (
            (operationName === 'includes' || operationName === 'excludes') &&
            argumentName === variableName
          ) {
            inferredType = classifier.ruleSimpleNameCS().getText();
            return;
          }
        }
      }
      const children = (
        node as {
          children?: unknown[];
        }
      ).children;
      children?.forEach(visitNode);
    };
    visitNode(root);
    return inferredType;
  };
  private createLogicFomulaItem = (expression: t.Expression, description: string) => {
    const item: Partial<LogicFormulaExpressionItem> = {};
    if (this.isEffectContext()) {
      item.execute = expression;
    } else {
      item.logic = expression;
    }
    item.description = t.stringLiteral(description);
    return item;
  };
  visitRuleLogicFormulaExpCS = (ctx: RuleLogicFormulaExpCSContext) => {
    const [firstElement, ...restElements] = ctx.children!;
    const firstExpression = this.visit(firstElement) as t.Expression;
    const expression = t.arrowFunctionExpression([], firstExpression);
    const firstItem: Partial<LogicFormulaExpressionItem> = this.createLogicFomulaItem(
      expression,
      firstElement.getText()
    );
    const restElementsChunked = chunk(restElements, 2);
    const firstCallArgs = [
      t.objectExpression(
        Object.entries(firstItem).map(([key, value]) => t.objectProperty(t.identifier(key), value))
      ),
    ];
    let currentExpression: t.Expression = t.callExpression(t.identifier('l'), firstCallArgs);
    for (let i = 0; i < restElementsChunked.length; i++) {
      const [terminalNode, parserTree] = restElementsChunked[i];
      let item: Partial<LogicFormulaExpressionItem> = {};
      if (parserTree instanceof RuleAtomicExpressionContext) {
        item = this.createLogicFomulaItem(
          t.arrowFunctionExpression([], this.visit(parserTree) as t.Expression),
          parserTree.getText()
        );
      } else if (parserTree instanceof RuleNestedExpCSContext) {
        item = this.createLogicFomulaItem(
          t.arrowFunctionExpression([], this.visit(parserTree.children![1]) as t.Expression),
          parserTree.getText()
        );
      } else {
        const [, ifContext, , thenContext, , elseContext] = (parserTree as RuleIfExpCSContext)
          .children!;
        this.internalContextArray.push('ifContext');
        item = {
          logic: t.arrowFunctionExpression([], this.visit(ifContext) as t.Expression),
          description: t.stringLiteral(ifContext.getText()),
        };
        this.internalContextArray.pop();
        if (thenContext) {
          this.internalContextArray.push('thenContext');
          item.then = this.visit(thenContext) as t.Expression;
          this.internalContextArray.pop();
        }
        if (elseContext) {
          this.internalContextArray.push('elseContext');
          item.else = this.visit(elseContext) as t.Expression;
          this.internalContextArray.pop();
        }
      }
      const isIfExpression = !!item.then;
      let operator = (terminalNode as TerminalNode).symbol.text;
      if (isIfExpression && operator === 'and') {
        operator = 'if';
      } else if (isIfExpression && operator === 'or') {
        currentExpression = t.callExpression(
          t.memberExpression(currentExpression, t.identifier(operator)),
          [
            t.objectExpression([
              t.objectProperty(
                t.identifier('logic'),
                t.arrowFunctionExpression(
                  [],
                  t.callExpression(t.identifier('l'), [
                    t.objectExpression(
                      Object.entries(item).map(([key, value]) =>
                        t.objectProperty(t.identifier(key), value)
                      )
                    ),
                  ])
                )
              ),
              t.objectProperty(t.identifier('description'), item.description!),
            ]),
          ]
        );
        continue;
      }
      currentExpression = t.callExpression(
        t.memberExpression(currentExpression, t.identifier(operator)),
        [
          t.objectExpression(
            Object.entries(item).map(([key, value]) => t.objectProperty(t.identifier(key), value))
          ),
        ]
      );
    }
    return currentExpression;
  };
  visitRuleAtomicExpression = (ctx: RuleAtomicExpressionContext) => {
    if (
      ctx.ruleLeftSubAtomicExpression() &&
      ctx.ruleInfixCompareOperatorName() &&
      ctx.ruleRightSubAtomicExpression()
    ) {
      const operator = ctx.ruleInfixCompareOperatorName().getText();
      const left = this.visit(ctx.ruleLeftSubAtomicExpression()) as t.Expression;
      let right = this.visit(ctx.ruleRightSubAtomicExpression()) as t.Expression;
      if (ctx.ruleInfixOperatorName()) {
        right = t.binaryExpression(
          ctx.ruleInfixOperatorName().getText() as Parameters<typeof t.binaryExpression>[0],
          right,
          (ctx.rulePrimitiveLiteralExpCS()
            ? this.visit(ctx.rulePrimitiveLiteralExpCS())
            : this.visit(ctx.ruleAtomicExpression())) as t.Expression
        );
      }
      if (this.isEffectContext() && operator === '=' && this.isAssignableExpression(left)) {
        if (ctx.ruleLeftSubAtomicExpression().getText() === 'result' && operator === '=') {
          return right;
        }
        return t.assignmentExpression('=', left, right);
      }
      if (operator === '=' || operator === '<>') {
        const equality = t.callExpression(
          t.memberExpression(t.identifier('StandardOPs'), t.identifier('oclEquals')),
          [left, right]
        );
        return operator === '=' ? equality : t.unaryExpression('!', equality);
      }
      return t.binaryExpression(operator as Parameters<typeof t.binaryExpression>[0], left, right);
    }
    return this.visit(ctx.ruleLeftSubAtomicExpression());
  };
  visitRuleLeftSubAtomicExpression = (ctx: RuleLeftSubAtomicExpressionContext) => {
    if (ctx.ruleVariableExpCS()) {
      return this.visit(ctx.ruleVariableExpCS());
    }
    return this.visit(ctx.ruleCallExpCS());
  };
  visitRuleRightSubAtomicExpression = (ctx: RuleRightSubAtomicExpressionContext) => {
    if (ctx.ruleCallExpCS()) {
      return this.visit(ctx.ruleCallExpCS());
    }
    if (ctx.ruleLiteralExpCS()) {
      return this.visit(ctx.ruleLiteralExpCS());
    }
    return this.visit(ctx.ruleVariableExpCS());
  };
  visitRuleCallExpCS = (ctx: RuleCallExpCSContext) => {
    if (ctx.ruleFeatureCallExpCS()) {
      return this.visit(ctx.ruleFeatureCallExpCS());
    }
    return this.visit(ctx.ruleLoopExpCS());
  };
  visitRuleFeatureCallExpCS = (ctx: RuleFeatureCallExpCSContext) => {
    if (ctx.ruleOperationCallExpCS()) {
      return this.visit(ctx.ruleOperationCallExpCS());
    }
    if (ctx.ruleStandardNavigationCallExpCS()) {
      return this.visit(ctx.ruleStandardNavigationCallExpCS());
    }
    if (ctx.ruleStandardOperationExpCS()) {
      return this.visit(ctx.ruleStandardOperationExpCS());
    }
    if (ctx.ruleClassiferCallExpCS()) {
      return this.visit(ctx.ruleClassiferCallExpCS());
    }
    return this.visit(ctx.rulePropertyCallExpCS());
  };
  visitRuleOperationCallExpCS = (ctx: RuleOperationCallExpCSContext) => {
    const operationName = ctx.ruleSimpleNameCS().getText();
    const args = ctx.ruleOperationParameters_list().map((p) => this.visit(p) as t.Expression);
    const operationCall = t.callExpression(t.identifier(operationName), args);
    if (this.ruleContext !== 'Postcondition') {
      return operationCall;
    }
    const traceArgs = [t.stringLiteral(operationName), t.arrayExpression(args)];
    if (this.loweringMode === 'check') {
      return this.createTraceCall('wasCalled', traceArgs);
    }
    return this.createTraceCall('call', [
      ...traceArgs,
      t.arrowFunctionExpression([], operationCall),
    ]);
  };
  visitRuleOperationParameters = (ctx: RuleOperationParametersContext) => {
    if (ctx.rulePropertyCallExpCS()) {
      return this.visit(ctx.rulePropertyCallExpCS());
    }
    const quoted = ctx.RULE_SINGLE_QUOTED_STRING() || ctx.RULE_DOUBLE_QUOTED_STRING();
    if (quoted) {
      const text = quoted.getText();
      return t.stringLiteral(this.decodeStringLiteral(text));
    }
    return t.identifier(this.useVarName(ctx.ruleSimpleNameCS().getText()));
  };
  visitRuleStandardNavigationCallExpCS = (ctx: RuleStandardNavigationCallExpCSContext) => {
    let caller: t.Expression;
    if (ctx.ruleSimpleNameCS()) {
      caller = t.identifier(ctx.ruleSimpleNameCS().getText());
    } else if (ctx.rulePropertyCallExpCS()) {
      caller = this.visit(ctx.rulePropertyCallExpCS()) as t.MemberExpression;
    } else {
      caller = this.visit(ctx.ruleClassiferCallExpCS()) as t.CallExpression;
    }
    const key = ctx
      .ruleStandardCollectionOperation()
      .children![0].getText() as keyof typeof ruleStandardCollectionOperationMap;
    const argument = t.identifier(
      this.useVarName(ctx.ruleStandardCollectionOperation().children![2].getText())
    );
    if (this.isEffectContext()) {
      this.counter.ruleStandardCollectionPostconditionOperation[key]++;
      const method = this.ruleStandardCollectionPostconditionOperationMap[key];
      return t.callExpression(
        t.memberExpression(t.identifier('StandardOPs'), t.identifier(method)),
        [caller, argument]
      );
    }
    this.counter.ruleStandardCollectionOperation[key]++;
    if (key === 'includesAll' || key === 'excludesAll') {
      const item = t.identifier('_collectionItem');
      const membership = t.callExpression(
        t.memberExpression(t.identifier('StandardOPs'), t.identifier('includes')),
        [caller, item]
      );
      return t.callExpression(t.memberExpression(argument, t.identifier('every')), [
        t.arrowFunctionExpression(
          [item],
          key === 'includesAll' ? membership : t.unaryExpression('!', membership)
        ),
      ]);
    }
    const membership = t.callExpression(
      t.memberExpression(t.identifier('StandardOPs'), t.identifier('includes')),
      [caller, argument]
    );
    return key === 'includes' ? membership : t.unaryExpression('!', membership);
  };
  visitRuleStandardOperationExpCS = (ctx: RuleStandardOperationExpCSContext) => {
    return this.visit(ctx.rulePredefineOp());
  };
  extractTemplateStatementExpression = (
    statement: t.Statement | t.Statement[]
  ): t.Expression | t.Expression[] => {
    if (!Array.isArray(statement)) {
      if (statement.type === 'ExpressionStatement') {
        return statement.expression;
      }
      return (statement as unknown as t.ExpressionStatement).expression;
    } else {
      // temp return
      return statement.map((e) => {
        if (e.type === 'ExpressionStatement') {
          return e.expression;
        } else {
          return (e as unknown as t.ExpressionStatement).expression;
        }
      });
    }
  };
  visitRulePredefineOp = (ctx: RulePredefineOpContext) => {
    const parentCtx = ctx.parentCtx as RuleStandardOperationExpCSContext;
    const originCaller = parentCtx.ruleVariableExpCS(0).getText();
    let caller = this.visit(parentCtx.ruleVariableExpCS(0)) as t.Expression;
    if (parentCtx.ruleVariableExpCS(1)) {
      const propertyName = parentCtx.ruleVariableExpCS(1).getText();
      caller = parentCtx.ruleIsMarkedPreCS()
        ? this.createStateCall('preValue', [caller, t.stringLiteral(propertyName)])
        : t.memberExpression(caller, t.identifier(propertyName));
    }
    if (ctx.ruleStandardDateOperation()) {
      return this.extractTemplateStatementExpression(
        template`dayjs(${generate(caller).code}).${generate(this.visit(ctx.ruleStandardDateOperation()) as t.CallExpression).code}`()
      ) as t.MemberExpression;
    }
    const type = this.useVarType(originCaller);
    if (ctx.ruleStandardParameterOperation()) {
      const operation = ctx.ruleStandardParameterOperation().getText();
      return this.extractTemplateStatementExpression(
        // temp solution, here is just oclIsTypeOf
        template`StandardOPs.${operation.replace('oclIsTypeOf(', `oclIsTypeOf(${generate(caller).code},`)}`()
      )!;
    }
    const standardCall = (method: string) =>
      t.callExpression(t.memberExpression(t.identifier('StandardOPs'), t.identifier(method)), [
        caller,
      ]);
    const predefineOpMap = {
      'oclIsUndefined()': standardCall('oclIsUndefined'),
      'notEmpty()': standardCall('notEmpty'),
      'isEmpty()': standardCall('isEmpty'),
      'size()': t.memberExpression(caller, t.identifier('length')),
      'sum()': standardCall('sum'),
    };
    const fun = ctx.ruleStandardNoneParameterOperation().getText() as
      | keyof typeof predefineOpMap
      | 'oclIsNew()';
    if (fun === 'oclIsNew()') {
      if (this.loweringMode === 'check') {
        if (type === 'any') {
          throw new Error(`Cannot determine the OCL type of ${originCaller} for oclIsNew()`);
        }
        return this.createStateCall('isNew', [caller, t.identifier(type)]);
      }
      if (!this.isEffectContext()) {
        return t.booleanLiteral(false);
      }
      if (type === 'any') {
        throw new Error(`Cannot determine the OCL type of ${originCaller} for oclIsNew()`);
      }
      if (!this.isAssignableExpression(caller)) {
        throw new Error(`Cannot create a new value through ${originCaller}`);
      }
      return t.assignmentExpression('=', caller, t.newExpression(t.identifier(type), []));
    }
    return predefineOpMap[fun as keyof typeof predefineOpMap];
  };
  visitRuleStandardDateOperation = (ctx: RuleStandardDateOperationContext) => {
    const operation = ctx.children![0].getText();
    let arg: t.Expression;
    let text = '';
    if (ctx.ruleSimpleNameCS()) {
      text = ctx.ruleSimpleNameCS().getText();
      if (text === 'Today' || text === 'Now') {
        arg = this.createTemporalLiteral(text as 'Today' | 'Now');
      } else {
        arg = t.identifier(text);
      }
    } else if (ctx.ruleNumberLiteralExpCS()) {
      arg = this.visit(ctx.ruleNumberLiteralExpCS()) as t.NumericLiteral;
    } else {
      arg = this.visit(ctx.rulePropertyCallExpCS()) as t.Expression;
    }
    let callExpression: t.CallExpression;
    if (operation in this.dayjsCompareOperationMap) {
      const args = [arg];
      if (text === 'Today') {
        args.push(t.stringLiteral('d'));
      } else if (text === 'Now') {
        args.push(t.stringLiteral('ms'));
      }
      const op = operation as keyof typeof this.dayjsCompareOperationMap;
      this.counter.dayjsCompareOperation[op]++;
      callExpression = t.callExpression(t.identifier(this.dayjsCompareOperationMap[op]), args);
    } else {
      const op = operation as keyof typeof this.dayjsOperationMap;
      this.counter.dayjsOperation[op]++;
      callExpression = t.callExpression(t.identifier(this.dayjsOperationMap[op]), [
        arg,
        t.stringLiteral('d'),
      ]);
    }
    if (ctx.ruleStandardDateOperation()) {
      return this.extractTemplateStatementExpression(
        template(
          `${generate(callExpression).code}.${generate(this.visit(ctx.ruleStandardDateOperation()) as t.CallExpression).code}`
        )()
      );
    }
    return callExpression;
  };
  visitRulePropertyCallExpCS = (ctx: RulePropertyCallExpCSContext) => {
    let expression = this.visit(ctx.ruleVariableExpCS(0)) as t.Expression;
    if (ctx.ruleVariableExpCS(1)) {
      expression = t.memberExpression(expression, t.identifier(ctx.ruleVariableExpCS(1).getText()));
    }
    const propertyName = ctx.ruleSimpleNameCS().getText();
    if (ctx.ruleIsMarkedPreCS()) {
      return this.createStateCall('preValue', [expression, t.stringLiteral(propertyName)]);
    }
    return t.memberExpression(expression, t.identifier(propertyName)) as t.Expression;
  };
  visitRuleLoopExpCS = (ctx: RuleLoopExpCSContext) => {
    return this.visit(ctx.ruleIteratorExpCS());
  };
  visitRuleIteratorExpCS = (ctx: RuleIteratorExpCSContext) => {
    const classifierType = ctx.ruleClassiferCallExpCS()?.ruleSimpleNameCS().getText();
    if (classifierType) {
      ctx.ruleVariableDeclarationCS_list().forEach((declaration) => {
        if (!declaration.ruleTypeCS()) {
          this.inferredVarTypes.set(declaration, classifierType);
        }
      });
    }
    const vars = ctx.ruleVariableDeclarationCS_list().map((e) => {
      return this.visit(e) as t.Identifier;
    });
    let callExpression: t.Expression;
    if (ctx.ruleClassiferCallExpCS()) {
      callExpression = this.visit(ctx.ruleClassiferCallExpCS()) as t.CallExpression;
    } else if (ctx.rulePropertyCallExpCS()) {
      callExpression = this.visit(ctx.rulePropertyCallExpCS()) as t.CallExpression;
    } else {
      callExpression = t.identifier(ctx.ruleSimpleNameCS().getText());
    }
    const loopKey = ctx.ruleIteratorIdentifier().getText();
    // `isUnique` exists in REMODEL.g4 / prompts but was never mapped — `loopMethod` became undefined and Babel threw.
    const iteratorBody = ctx.ruleLogicFormulaExpCS() || ctx.ruleIfExpCS();
    if (!iteratorBody) {
      throw new Error(`Iterator ${loopKey} has no body expression`);
    }
    if (loopKey === 'isUnique') {
      this.internalContextArray.push('findContext');
      const keyExpr = this.visit(iteratorBody) as t.Expression;
      this.internalContextArray.pop();
      ctx.ruleVariableDeclarationCS_list().forEach(() => {
        this.vars.pop();
      });
      const arrParam = t.identifier('_isUniqueArr');
      const keysParam = t.identifier('_isUniqueKeys');
      const mapArrow = t.arrowFunctionExpression(
        vars,
        t.memberExpression(
          this.buildLogicFormulaBuilderBuildExpression(keyExpr),
          t.identifier('pass')
        )
      );
      return t.callExpression(
        t.arrowFunctionExpression(
          [arrParam],
          t.blockStatement([
            t.variableDeclaration('const', [
              t.variableDeclarator(
                keysParam,
                t.callExpression(t.memberExpression(arrParam, t.identifier('map')), [mapArrow])
              ),
            ]),
            t.returnStatement(
              t.binaryExpression(
                '===',
                t.memberExpression(
                  t.newExpression(t.identifier('Set'), [keysParam]),
                  t.identifier('size')
                ),
                t.memberExpression(keysParam, t.identifier('length'))
              )
            ),
          ])
        ),
        [callExpression]
      );
    }
    if (loopKey === 'one') {
      this.internalContextArray.push('filterContext');
      const predicate = this.visit(iteratorBody) as t.Expression;
      this.internalContextArray.pop();
      ctx.ruleVariableDeclarationCS_list().forEach(() => {
        this.vars.pop();
      });
      this.counter.ruleIteratorIdentifier.one++;
      const matchingItems = t.callExpression(
        t.memberExpression(callExpression, t.identifier('filter')),
        [
          t.arrowFunctionExpression(
            vars,
            t.memberExpression(
              this.buildLogicFormulaBuilderBuildExpression(predicate),
              t.identifier('pass')
            )
          ),
        ]
      );
      return t.binaryExpression(
        '===',
        t.memberExpression(matchingItems, t.identifier('length')),
        t.numericLiteral(1)
      );
    }
    const effectfulForAll =
      loopKey === 'forAll' &&
      this.isEffectContext() &&
      this.containsPostconditionEffect(iteratorBody);
    const loopMethod = effectfulForAll
      ? 'forEach'
      : this.ruleIteratorIdentifierMap[loopKey as keyof typeof this.ruleIteratorIdentifierMap];
    this.counter.ruleIteratorIdentifier[loopKey as keyof typeof this.ruleIteratorIdentifierMap]++;
    this.internalContextArray.push(`${loopMethod}Context` as InternalContext);
    const calleeName = this.isEffectContext() ? 'value' : 'pass';
    const expression = t.callExpression(
      t.memberExpression(callExpression, t.identifier(loopMethod)),
      [
        t.arrowFunctionExpression(
          vars,
          t.memberExpression(
            t.callExpression(
              t.memberExpression(this.visit(iteratorBody) as t.Expression, t.identifier('build')),
              []
            ),
            t.identifier(calleeName)
          )
        ),
      ]
    );
    this.internalContextArray.pop();
    ctx.ruleVariableDeclarationCS_list().forEach(() => {
      this.vars.pop();
    });
    return expression;
  };
  visitRuleClassiferCallExpCS = (ctx: RuleClassiferCallExpCSContext) => {
    return t.callExpression(t.identifier('getRepository'), [
      t.identifier(ctx.ruleSimpleNameCS().getText()),
    ]);
  };
  useVarName = (name: string) => {
    const varNames = this.vars.map((v) => v.name);
    const globalVarNames = this.globalVars.map((v) => v.name);
    if (!varNames.includes(name) && !globalVarNames.includes(name)) {
      throw new Error(`visitRuleVariableExpCS transform error - Cannot find variable: ${name}`);
    }
    if (!varNames.includes(name) && globalVarNames.includes(name)) {
      name = `this.${name}`;
    }
    if (name === 'l') {
      return `_l`;
    }
    return name;
  };
  useVarType = (name: string) => {
    return (
      this.vars.concat(this.globalVars).find((v) => {
        return v.name === name;
      })?.type || 'any'
    );
  };
  visitRuleVariableExpCS = (ctx: RuleVariableExpCSContext) => {
    if (ctx.ruleSimpleNameCS()) {
      const name = ctx.ruleSimpleNameCS().getText();
      if (name === 'Today' || name === 'Now') {
        return this.createTemporalLiteral(name);
      }
      return t.identifier(this.useVarName(name));
    }
    const keyword = (ctx.children![0] as TerminalNode).getText() as 'result' | 'self';
    this.counter.variableKeyword[keyword]++;
    return t.identifier(this.variableKeywordMap[keyword]);
  };
}
