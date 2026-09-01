const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const [project, useCase] = process.argv.slice(2);
if (!project || !useCase || !/^[A-Za-z0-9]+$/.test(project + useCase)) {
  throw new Error('Usage: node scripts/inspect_operation_sources.cjs PROJECT USE_CASE');
}
const relative = `src/rm2pt/project/${project}/${useCase}.ts`;
const text = fs.readFileSync(path.join(root, relative), 'utf8');
const source = ts.createSourceFile(relative, text, ts.ScriptTarget.Latest, true);
const properties = (node) =>
  Object.fromEntries(
    node.properties
      .filter(ts.isPropertyAssignment)
      .map((item) => [item.name.getText(source), item.initializer])
  );
const scalar = (node) =>
  node && (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) ? node.text : null;
const location = (node) => ({
  path: relative,
  start_line: source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1,
  end_line: source.getLineAndCharacterOfPosition(node.end).line + 1,
});
const operations = [];
let service;
function visit(node) {
  if (
    ts.isNewExpression(node) &&
    node.arguments?.[0] &&
    ts.isObjectLiteralExpression(node.arguments[0])
  ) {
    const fields = properties(node.arguments[0]);
    if (node.expression.getText(source) === 'Service') service = scalar(fields.name);
    if (node.expression.getText(source) === 'Operation') {
      const operation = {name: scalar(fields.name), source: location(node), fields: {}};
      operation.parameters = [];
      if (fields.parameters) {
        if (!ts.isArrayLiteralExpression(fields.parameters))
          throw new Error('Nonliteral parameters');
        for (const param of fields.parameters.elements) {
          if (!ts.isNewExpression(param) || !ts.isObjectLiteralExpression(param.arguments?.[0]))
            throw new Error('Nonliteral Parameter');
          const value = properties(param.arguments[0]);
          const name = scalar(value.name),
            type = scalar(value.type);
          if (name === null || type === null) throw new Error('Nonliteral parameter field');
          operation.parameters.push({name, type});
        }
      }
      operation.return_type =
        fields.returnType && ts.isNewExpression(fields.returnType)
          ? scalar(fields.returnType.arguments?.[0])
          : 'void';
      for (const key of ['description', 'definition', 'precondition', 'postcondition']) {
        if (fields[key]) {
          const value = scalar(fields[key]);
          if (value === null) throw new Error(`Nonliteral ${operation.name}.${key}`);
          operation.fields[key] = {value, ...location(fields[key])};
        }
      }
      operations.push(operation);
    }
  }
  ts.forEachChild(node, visit);
}
visit(source);
const testDirectories = fs
  .readdirSync(path.join(root, 'test'), {withFileTypes: true})
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);
for (const operation of operations) {
  operation.service = service;
  // Retain the physical spelling: Windows existsSync alone hides Linux path errors.
  const expectedDirectory = `${project}-${service}-${operation.name}`;
  const matches = testDirectories.filter(
    (name) => name.toLowerCase() === expectedDirectory.toLowerCase()
  );
  if (matches.length > 1) throw new Error(`Ambiguous test directory: ${expectedDirectory}`);
  let testPath = matches.length ? `test/${matches[0]}/index.test.ts` : null;
  if (testPath && process.argv.includes('--oracle-v2')) {
    const revised = `data/operation_revision/oracles_v2/${matches[0]}/index.test.ts`;
    if (fs.existsSync(path.join(root, revised))) testPath = revised;
  }
  operation.test_path = testPath && fs.existsSync(path.join(root, testPath)) ? testPath : null;
  operation.scenarios = [];
  if (operation.test_path) {
    const testText = fs.readFileSync(path.join(root, testPath), 'utf8');
    const test = ts.createSourceFile(testPath, testText, ts.ScriptTarget.Latest, true);
    function visitTest(node) {
      if (
        ts.isCallExpression(node) &&
        /^(?:it|test)(?:$|\.|\()/.test(node.expression.getText(test)) &&
        scalar(node.arguments[0]) !== null &&
        node.arguments.length >= 2
      ) {
        const parameterized =
          ts.isCallExpression(node.expression) &&
          /\.each$/.test(node.expression.expression.getText(test));
        const cases = parameterized ? node.expression.arguments[0] : null;
        operation.scenarios.push({
          title: scalar(node.arguments[0]),
          case_count: parameterized
            ? cases && ts.isArrayLiteralExpression(cases)
              ? cases.elements.length
              : null
            : 1,
          start_line: test.getLineAndCharacterOfPosition(node.getStart(test)).line + 1,
          end_line: test.getLineAndCharacterOfPosition(node.end).line + 1,
          body: node.getText(test),
        });
      }
      ts.forEachChild(node, visitTest);
    }
    visitTest(test);
  }
}
if (process.argv.includes('--compact')) {
  for (const operation of operations) {
    console.log(`\nOPERATION ${operation.name} | ${operation.test_path}`);
    for (const [key, field] of Object.entries(operation.fields))
      console.log(`${key}: ${field.value}`);
    for (const [index, scenario] of operation.scenarios.entries())
      console.log(`SCENARIO ${index}: ${scenario.body}`);
  }
} else {
  console.log(JSON.stringify({project, useCase, source_path: relative, operations}, null, 2));
}
