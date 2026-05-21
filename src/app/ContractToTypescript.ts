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
} from '../../antlr4/REMODELParser';
import * as t from '@babel/types';
import REMODELVisitor from '../../antlr4/REMODELVisitor';
import {getTypescriptType} from './util';
import generate from '@babel/generator';
type VisitorReturnType = t.Expression | t.Statement | t.Identifier | t.Pattern | t.RestElement;
type REMODELParserKeys = Extract<
  keyof Omit<InstanceType<typeof REMODELParser>, 'ruleNames'>,
  `rule${string}`
>;
type R<T> = T extends `rule${infer Rule}` ? Rule : string;
type Rule = R<REMODELParserKeys>;
type RuleContext = Extract<Rule, 'Definition' | 'Precondition' | 'Postcondition'>;
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
  forAll: 'forEach',
  exists: 'some',
  select: 'filter',
  any: 'find',
  collect: 'map',
};

const ruleStandardCollectionOperationMap = {
  includes: 'includes',
};

const ruleStandardCollectionPostconditionOperationMap = {
  includes: 'push',
  excludes: 'remove',
  sum: 'sum',
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
  variableKeyword: {
    [key in keyof typeof variableKeywordMap]: number;
  };
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
  dayjsOperation: {
    [key in keyof typeof dayjsOperationMap]: number;
  };
  expressionCount: number;
  expressions: string[];
};
export class ContractToTypescript extends REMODELVisitor<VisitorReturnType | VisitorReturnType[]> {
  counter!: C2TCounter;

  constructor(...args: ConstructorParameters<typeof REMODELVisitor>) {
    super(...args);
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
  ruleContext: RuleContext = 'Precondition';
  internalContextArray: (
    | 'ifContext'
    | 'thenContext'
    | 'elseContext'
    | `${(typeof this.ruleIteratorIdentifierMap)[keyof typeof this.ruleIteratorIdentifierMap]}Context`
  )[] = [];

  ruleIteratorIdentifierMap = ruleIteratorIdentifierMap;

  ruleStandardCollectionOperationMap = ruleStandardCollectionOperationMap;

  ruleStandardCollectionPostconditionOperationMap = ruleStandardCollectionPostconditionOperationMap;

  dayjsCompareOperationMap = dayjsCompareOperationMap;
  dayjsOperationMap = dayjsOperationMap;

  variableKeywordMap = variableKeywordMap;

  transform(
    input: string,
    rule: Rule,
    {
      ruleContext,
      vars,
      globalVars,
    }: {ruleContext?: RuleContext; globalVars?: Var[]; vars?: Var[]} = {}
  ) {
    const {parser} = getRemodelAntlr(input);
    if (ruleContext) {
      this.ruleContext = ruleContext;
    }
    if (globalVars) {
      this.globalVars = globalVars;
    }
    if (vars) {
      this.vars = vars;
    }

    return this.visit(parser[`rule${rule}`]());
  }

  visitRuleDefinition = (ctx: RuleDefinitionContext) => {
    console.log('Definition'.bgYellow);
    console.log(ctx.getText());
    this.ruleContext = 'Definition';
    return ctx.ruleVariableDeclarationCS_list()?.map((e) => this.visit(e)) as t.Statement[];
  };

  visitRulePrecondition = (ctx: RulePreconditionContext) => {
    console.log('Precondition'.bgYellow);
    console.log(ctx.getText());
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
    console.log('Postcondition'.bgYellow);
    console.log(ctx.getText());
    this.ruleContext = 'Postcondition';
    const res = this.visit(ctx.ruleOCLExpressionCS());
    return Array.isArray(res)
      ? res
      : [
          t.returnStatement(
            t.memberExpression(
              this.buildLogicFormulaBuilderBuildExpression(res as t.CallExpression),
              t.identifier('value')
            )
          ),
        ];
  };

  private buildLogicFormulaBuilderBuildExpression = (memberExpression: t.Expression) => {
    return t.callExpression(t.memberExpression(memberExpression, t.identifier('build')), []);
  };

  visitRuleVariableDeclarationCS = (ctx: RuleVariableDeclarationCSContext) => {
    console.log('RuleVariableDeclarationCS'.green);
    console.log(
      ctx.ruleSimpleNameCS().getText(),
      ctx.ruleTypeCS()?.getText(),
      ctx.ruleOCLExpressionCS()?.getText()
    );
    console.log('ParentCtx'.yellow, ctx.parentCtx, ctx.parentCtx?.getText());
    const varName = ctx.ruleSimpleNameCS().getText();
    const varType = ctx.ruleTypeCS()?.getText() || 'any';
    this.vars.push({name: varName, type: varType});
    const varValueContext = ctx.ruleOCLExpressionCS();
    const identifier = t.identifier(this.useVarName(varName));
    identifier.typeAnnotation = getTypescriptType(varType);
    if (
      ctx.parentCtx instanceof RuleDefinitionContext ||
      ctx.parentCtx instanceof RuleLetExpCSContext
    ) {
      const declaration = t.variableDeclarator(identifier);
      if (varValueContext) {
        declaration.init = t.memberExpression(
          this.buildLogicFormulaBuilderBuildExpression(this.visit(varValueContext) as t.Expression),
          t.identifier('pass')
        );
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

    console.log('RuleOCLExpressionCS'.green);
    console.log(
      ruleLiteralExpCSText,
      ruleLetExpCSText,
      ruleIfExpCSText,
      ruleLogicFormulaExpCSText,
      ruleNestedExpCSText
    );
    if (ctx.ruleLetExpCS()) {
      this.countExpression(ruleLetExpCSText);
      return this.visit(ctx.ruleLetExpCS());
    }
    if (ctx.ruleIfExpCS()) {
      this.countExpression(ruleIfExpCSText);
      const [, ifContext, , thenContext, , elseContext] = ctx.ruleIfExpCS().children!;
      this.internalContextArray.push('ifContext');
      const item: LogicFormulaExpressionItem = {
        logic: t.arrowFunctionExpression([], this.visit(ifContext) as t.Expression) as t.Expression,
        description: t.stringLiteral(ifContext.getText()),
      };
      this.internalContextArray.pop();
      if (thenContext) {
        console.log('thenContext'.yellow, thenContext.getText());
        this.internalContextArray.push('thenContext');
        item.then = this.visit(thenContext) as t.Expression;
        this.internalContextArray.pop();
      }
      if (elseContext) {
        console.log('elseContext'.yellow, elseContext.getText());
        this.internalContextArray.push('elseContext');
        item.else = this.visit(elseContext) as t.Expression;
        this.internalContextArray.pop();
      }
      return (
        template`
        l().if(PARAMS)
      `({
          PARAMS: t.objectExpression(
            Object.entries(item).map(([key, value]) => t.objectProperty(t.identifier(key), value))
          ),
        }) as t.ExpressionStatement
      ).expression;
    }
    if (ctx.ruleLogicFormulaExpCS()) {
      this.countExpression(ruleLogicFormulaExpCSText);
      return this.visit(ctx.ruleLogicFormulaExpCS());
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

  visitRuleLetExpCS = (ctx: RuleLetExpCSContext) => {
    console.log('RuleLetExpCS'.green);
    ctx.ruleVariableDeclarationCS_list().forEach((e, i) => {
      console.log('ruleVariableDeclarationCS_list', `index:${i}`.yellow, e.getText());
    });
    console.log(ctx.ruleOCLExpressionCS()?.getText());
    const declareExpressions = ctx.ruleVariableDeclarationCS_list().map((e) => {
      return this.visit(e) as t.Expression;
    });
    const oclExpression = this.visit(ctx.ruleOCLExpressionCS()) as t.Expression;
    if (ctx.parentCtx?.parentCtx instanceof RulePostconditionContext) {
      return [
        ...declareExpressions,
        t.returnStatement(
          t.memberExpression(
            this.buildLogicFormulaBuilderBuildExpression(oclExpression),
            t.identifier('value')
          )
        ),
      ];
    }
    return [...declareExpressions, t.expressionStatement(oclExpression)];
  };
  visitRuleLiteralExpCS = (ctx: RuleLiteralExpCSContext) => {
    console.log('RuleLiteralExpCS'.green);
    console.log(
      ctx.ruleCollectionLiteralExpCS()?.getText(),
      ctx.ruleTupleLiteralExpCS()?.getText(),
      ctx.rulePrimitiveLiteralExpCS()?.getText(),
      ctx.ruleEnumLiteralExpCS()?.getText()
    );
    if (ctx.ruleCollectionLiteralExpCS()) {
      return this.visit(ctx.ruleCollectionLiteralExpCS());
    }
    if (ctx.ruleEnumLiteralExpCS()) {
      return this.visit(ctx.ruleEnumLiteralExpCS());
    }
    return this.visit(ctx.rulePrimitiveLiteralExpCS());
  };

  visitRuleEnumLiteralExpCS = (ctx: RuleEnumLiteralExpCSContext) => {
    console.log('RuleEnumLiteralExpCS'.green);
    console.log(ctx.ruleSimpleNameCS()?.getText(), ctx.RULE_ID().getText());
    const enumName = ctx.ruleSimpleNameCS()?.getText();
    const enumLiteralName = ctx.RULE_ID().getText();
    return t.memberExpression(t.identifier(enumName), t.identifier(enumLiteralName));
  };

  visitRulePrimitiveLiteralExpCS = (ctx: RulePrimitiveLiteralExpCSContext) => {
    console.log('RulePrimitiveLiteralExpCS'.green);
    console.log(
      ctx.ruleNumberLiteralExpCS()?.getText(),
      ctx.ruleStringLiteralExpCS()?.getText(),
      ctx.ruleBooleanLiteralExpCS()?.getText(),
      ctx.ruleInvalidLiteralExpCS()?.getText(),
      ctx.ruleNullLiteralExpCS()?.getText()
    );
    if (ctx.ruleStringLiteralExpCS()) {
      const text = ctx.ruleStringLiteralExpCS().getText();
      return t.stringLiteral(text.slice(1, -1));
    }
    if (ctx.ruleNumberLiteralExpCS()) {
      return this.visit(ctx.ruleNumberLiteralExpCS());
    }
    if (ctx.ruleNullLiteralExpCS()) {
      return t.identifier('undefined');
    }
    return t.booleanLiteral(ctx.ruleBooleanLiteralExpCS()?.getText() === 'true' || false);
  };

  visitRuleNumberLiteralExpCS = (ctx: RuleNumberLiteralExpCSContext) => {
    return t.numericLiteral(parseFloat(ctx.getText()));
  };
  private isAssignContext = () =>
    this.ruleContext === 'Postcondition' &&
    this.internalContextArray.at(-1) !== 'ifContext' &&
    this.internalContextArray.at(-1) !== 'someContext' &&
    this.internalContextArray.at(-1) !== 'filterContext' &&
    this.internalContextArray.at(-1) !== 'everyContext' &&
    this.internalContextArray.at(-1) !== 'findContext';
  private createLogicFomulaItem = (expression: t.Expression, description: string) => {
    const item: Partial<LogicFormulaExpressionItem> = {};
    if (this.isAssignContext()) {
      item.execute = expression;
    } else {
      item.logic = expression;
    }
    item.description = t.stringLiteral(description);
    return item;
  };
  visitRuleLogicFormulaExpCS = (ctx: RuleLogicFormulaExpCSContext) => {
    console.log('RuleLogicFormulaExpCS'.green);
    ctx.ruleAtomicExpression_list().forEach((e, i) => {
      console.log('ruleAtomicExpression_list', `index:${i}`.yellow, e.getText());
    });
    ctx.ruleIfExpCS_list().forEach((e, i) => {
      console.log('ruleIfExpCS_list', `index:${i}`.yellow, e.getText());
    });
    ctx.ruleNestedExpCS_list().forEach((e, i) => {
      console.log('ruleNestedExpCS_list', `index:${i}`.yellow, e.getText());
    });

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
    console.log('RuleAtomicExpression'.green);
    console.log(
      ctx.ruleLeftSubAtomicExpression()?.getText(),
      ctx.ruleInfixCompareOperatorName()?.getText(),
      ctx.ruleRightSubAtomicExpression()?.getText(),
      ctx.ruleInfixOperatorName()?.getText(),
      ctx.rulePrimitiveLiteralExpCS()?.getText(),
      ctx.ruleAtomicExpression()?.getText()
    );
    if (
      ctx.ruleLeftSubAtomicExpression() &&
      ctx.ruleInfixCompareOperatorName() &&
      ctx.ruleRightSubAtomicExpression()
    ) {
      const operatorMap: Record<string, '===' | '!=='> = {'=': '===', '<>': '!=='};
      const operator = ctx.ruleInfixCompareOperatorName().getText() as keyof typeof operatorMap;
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
      if (this.isAssignContext()) {
        if (ctx.ruleLeftSubAtomicExpression().getText() === 'result' && operator === '=') {
          return right;
        }
        return t.assignmentExpression(operator, left as t.LVal, right);
      }
      return t.binaryExpression(operatorMap[operator] || operator, left, right);
    }
    return this.visit(ctx.ruleLeftSubAtomicExpression());
  };

  visitRuleLeftSubAtomicExpression = (ctx: RuleLeftSubAtomicExpressionContext) => {
    console.log('RuleLeftSubAtomicExpression'.green);
    console.log(ctx.ruleVariableExpCS()?.getText(), ctx.ruleCallExpCS()?.getText());
    if (ctx.ruleVariableExpCS()) {
      return this.visit(ctx.ruleVariableExpCS());
    }
    return this.visit(ctx.ruleCallExpCS());
  };

  visitRuleRightSubAtomicExpression = (ctx: RuleRightSubAtomicExpressionContext) => {
    console.log('RuleRightSubAtomicExpression'.green);
    console.log(
      ctx.ruleLiteralExpCS()?.getText(),
      ctx.ruleVariableExpCS()?.getText(),
      ctx.ruleCallExpCS()?.getText()
    );
    if (ctx.ruleCallExpCS()) {
      return this.visit(ctx.ruleCallExpCS());
    }
    if (ctx.ruleLiteralExpCS()) {
      return this.visit(ctx.ruleLiteralExpCS());
    }
    return this.visit(ctx.ruleVariableExpCS());
  };

  visitRuleCallExpCS = (ctx: RuleCallExpCSContext) => {
    console.log('RuleCallExpCS'.green);
    console.log(ctx.ruleFeatureCallExpCS()?.getText(), ctx.ruleLoopExpCS()?.getText());
    if (ctx.ruleFeatureCallExpCS()) {
      return this.visit(ctx.ruleFeatureCallExpCS());
    }
    return this.visit(ctx.ruleLoopExpCS());
  };

  visitRuleFeatureCallExpCS = (ctx: RuleFeatureCallExpCSContext) => {
    console.log('RuleFeatureCallExpCS'.green);
    console.log(
      ctx.rulePropertyCallExpCS()?.getText(),
      ctx.ruleClassiferCallExpCS()?.getText(),
      ctx.ruleStandardOperationExpCS()?.getText(),
      ctx.ruleStandardNavigationCallExpCS()?.getText(),
      ctx.ruleOperationCallExpCS()?.getText()
    );
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
    console.log('RuleOperationCallExpCS'.green);
    console.log(ctx.ruleSimpleNameCS()?.getText());
    ctx.ruleOperationParameters_list().forEach((e, i) => {
      console.log('ruleOperationParameters_list', `index:${i}`.yellow, e.getText());
    });
    return t.callExpression(
      t.identifier(ctx.ruleSimpleNameCS().getText()),
      ctx.ruleOperationParameters_list().map((p) => this.visit(p) as t.Expression)
    );
  };

  visitRuleOperationParameters = (ctx: RuleOperationParametersContext) => {
    console.log('RuleOperationParameters'.green);
    console.log(ctx.ruleSimpleNameCS()?.getText());
    console.log(ctx.rulePropertyCallExpCS()?.getText());
    console.log(ctx.RULE_SINGLE_QUOTED_STRING());
    console.log(ctx.RULE_DOUBLE_QUOTED_STRING());
    if (ctx.rulePropertyCallExpCS()) {
      return this.visit(ctx.rulePropertyCallExpCS());
    }
    return t.identifier(ctx.getText());
  };

  visitRuleStandardNavigationCallExpCS = (ctx: RuleStandardNavigationCallExpCSContext) => {
    console.log('RuleStandardNavigationCallExpCS'.green);
    console.log(
      ctx.ruleClassiferCallExpCS()?.getText(),
      ctx.rulePropertyCallExpCS()?.getText(),
      ctx.ruleSimpleNameCS()?.getText(),
      ctx.ruleStandardCollectionOperation()?.getText()
    );
    let map = this.ruleStandardCollectionOperationMap;
    let counter = this.counter.ruleStandardCollectionOperation;
    if (this.ruleContext === 'Postcondition') {
      map = this.ruleStandardCollectionPostconditionOperationMap;
      counter = this.counter.ruleStandardCollectionPostconditionOperation;
    }
    let caller: t.Expression;
    if (ctx.ruleSimpleNameCS()) {
      caller = t.identifier(ctx.ruleSimpleNameCS().getText());
    } else if (ctx.rulePropertyCallExpCS()) {
      caller = this.visit(ctx.rulePropertyCallExpCS()) as t.MemberExpression;
    } else {
      caller = this.visit(ctx.ruleClassiferCallExpCS()) as t.CallExpression;
    }
    const key = ctx.ruleStandardCollectionOperation().children![0].getText() as keyof typeof map;
    counter[key]++;
    const expression = t.callExpression(t.memberExpression(caller, t.identifier(map[key])), [
      t.identifier(this.useVarName(ctx.ruleStandardCollectionOperation().children![2].getText())),
    ]);
    return expression;
  };

  visitRuleStandardOperationExpCS = (ctx: RuleStandardOperationExpCSContext) => {
    console.log('RuleStandardOperationExpCS'.green);
    ctx.ruleVariableExpCS_list().forEach((e, i) => {
      console.log('ruleVariableExpCS_list', `index:${i}`.yellow, e.getText());
    });
    console.log(ctx.ruleIsMarkedPreCS()?.getText(), ctx.rulePredefineOp()?.getText());
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
    console.log('PredefineOp'.green);
    console.log(ctx.ruleStandardNoneParameterOperation()?.getText());
    console.log(ctx.ruleStandardParameterOperation()?.getText());
    console.log(ctx.ruleStandardDateOperation()?.getText());

    const parentCtx = ctx.parentCtx as RuleStandardOperationExpCSContext;
    let caller = parentCtx.ruleVariableExpCS(0).getText();
    const originCaller = caller;
    if (caller === 'self') {
      caller = 'this';
    } else {
      caller = this.useVarName(caller);
    }
    if (parentCtx.ruleVariableExpCS(1)) {
      caller = `${caller}.${parentCtx.ruleVariableExpCS(1).getText()}`;
    }
    if (ctx.ruleStandardDateOperation()) {
      return this.extractTemplateStatementExpression(
        template`dayjs(${caller}).${generate(this.visit(ctx.ruleStandardDateOperation()) as t.CallExpression).code}`()
      ) as t.MemberExpression;
    }
    const type = this.useVarType(originCaller === 'l' ? 'l' : caller);
    if (ctx.ruleStandardParameterOperation()) {
      return this.extractTemplateStatementExpression(
        // temp solution, here is just oclIsTypeOf
        template`StandardOPs.${ctx.ruleStandardParameterOperation().getText().replace('oclIsTypeOf(', `oclIsTypeOf(${caller},`)}`()
      )!;
    }
    const predefineOpMap = {
      'oclIsUndefined()': this.extractTemplateStatementExpression(
        template`StandardOPs.oclIsUndefined(${caller})`()
      )!,
      'notEmpty()': this.extractTemplateStatementExpression(
        template`StandardOPs.notEmpty(${caller})`()
      )!,
      'isEmpty()': this.extractTemplateStatementExpression(
        template`StandardOPs.isEmpty(${caller})`()
      )!,
      'size()': this.extractTemplateStatementExpression(template`${caller}.length`())!,
      'oclIsNew()': this.extractTemplateStatementExpression(
        template`${caller}=${type === 'any' ? '{}' : `new ${type}`}`()
      )!,
      'sum()': this.extractTemplateStatementExpression(template`${caller}.sum()`())!,
    };
    const fun = ctx.ruleStandardNoneParameterOperation().getText() as keyof typeof predefineOpMap;
    return predefineOpMap[fun];
  };

  visitRuleStandardDateOperation = (ctx: RuleStandardDateOperationContext) => {
    console.log('RuleStandardDateOperation'.green);
    console.log(ctx.children![0]?.getText());
    console.log(ctx.ruleSimpleNameCS()?.getText());
    console.log(ctx.ruleNumberLiteralExpCS()?.getText());
    console.log(ctx.rulePropertyCallExpCS()?.getText());
    console.log(ctx.ruleStandardDateOperation()?.getText());
    const operation = ctx.children![0].getText();
    let arg: t.Expression;
    let text = '';
    if (ctx.ruleSimpleNameCS()) {
      text = ctx.ruleSimpleNameCS().getText();
      if (text === 'Today') {
        arg = t.callExpression(t.identifier('dayjs'), []);
      } else if (text === 'Now') {
        arg = t.callExpression(t.identifier('dayjs'), []);
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
    console.log('RulePropertyCallExpCS'.green);
    ctx.ruleVariableExpCS_list().forEach((e, i) => {
      console.log('ruleVariableExpCS_list', `index:${i}`.yellow, e.getText());
    });
    console.log(ctx.ruleSimpleNameCS()?.getText(), ctx.ruleIsMarkedPreCS()?.getText());
    let expression = this.visit(ctx.ruleVariableExpCS(0)) as t.Expression;
    if (ctx.ruleVariableExpCS(1)) {
      expression = t.memberExpression(expression, t.identifier(ctx.ruleVariableExpCS(1).getText()));
    }

    return t.memberExpression(
      expression,
      t.identifier(ctx.ruleSimpleNameCS().getText())
    ) as t.Expression;
  };

  visitRuleLoopExpCS = (ctx: RuleLoopExpCSContext) => {
    console.log('RuleLoopExpCS'.green);
    console.log(ctx.ruleIteratorExpCS()?.getText());
    return this.visit(ctx.ruleIteratorExpCS());
  };

  visitRuleIteratorExpCS = (ctx: RuleIteratorExpCSContext) => {
    console.log('RuleIteratorExpCS'.green);
    console.log(
      ctx.ruleClassiferCallExpCS()?.getText(),
      ctx.rulePropertyCallExpCS()?.getText(),
      ctx.ruleSimpleNameCS()?.getText(),
      ctx.ruleIteratorIdentifier()?.getText()
    );
    ctx.ruleVariableDeclarationCS_list().forEach((e, i) => {
      console.log('ruleVariableDeclarationCS_list', `index:${i}`.yellow, e.getText());
    });
    console.log(ctx.ruleLogicFormulaExpCS()?.getText(), ctx.ruleIfExpCS()?.getText());
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
    if (loopKey === 'isUnique') {
      this.internalContextArray.push('findContext');
      const keyExpr = this.visit(ctx.ruleLogicFormulaExpCS()) as t.Expression;
      this.internalContextArray.pop();
      ctx.ruleVariableDeclarationCS_list().forEach(() => {
        this.vars.pop();
      });
      const arrParam = t.identifier('_isUniqueArr');
      const keysParam = t.identifier('_isUniqueKeys');
      const mapArrow = t.arrowFunctionExpression(vars, keyExpr);
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
    const loopMethod =
      this.ruleIteratorIdentifierMap[loopKey as keyof typeof this.ruleIteratorIdentifierMap];
    this.counter.ruleIteratorIdentifier[loopKey as keyof typeof this.ruleIteratorIdentifierMap]++;
    this.internalContextArray.push(`${loopMethod}Context`);
    const calleeName = this.isAssignContext() ? 'value' : 'pass';
    const expression = t.callExpression(
      t.memberExpression(callExpression, t.identifier(loopMethod)),
      [
        t.arrowFunctionExpression(
          vars,
          t.memberExpression(
            t.callExpression(
              t.memberExpression(
                this.visit(ctx.ruleLogicFormulaExpCS()) as t.Expression,
                t.identifier('build')
              ),
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
    console.log('RuleClassiferCallExpCS'.green);
    console.log(ctx.ruleSimpleNameCS()?.getText());
    return t.callExpression(t.identifier('getRepository'), [
      t.identifier(ctx.ruleSimpleNameCS().getText()),
    ]);
  };

  useVarName = (name: string) => {
    if (name === 'Today' || name === 'Now') {
      return 'dayjs()';
    }
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
    console.log('RuleVariableExpCS'.green);
    console.log(ctx.ruleSimpleNameCS()?.getText());
    if (ctx.ruleSimpleNameCS()) {
      const name = ctx.ruleSimpleNameCS().getText();
      return t.identifier(this.useVarName(name));
    }
    const keyword = (ctx.children![0] as TerminalNode).getText() as 'result' | 'self';
    this.counter.variableKeyword[keyword]++;
    return t.identifier(this.variableKeywordMap[keyword]);
  };
}
