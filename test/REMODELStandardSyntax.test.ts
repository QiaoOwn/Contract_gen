import generate from '@babel/generator';
import * as t from '@babel/types';
import {ContractToTypescript} from '../src/app/ContractToTypescript';
import {generateContractCode, parse} from '../src/app/util';

const toCode = (nodes: t.Node | t.Node[]) => {
  const statements = (Array.isArray(nodes) ? nodes : [nodes]).map((node) =>
    t.isStatement(node) ? node : t.expressionStatement(node as t.Expression)
  );
  return generate(t.program(statements)).code;
};

const contractWith = (precondition: string) =>
  generateContractCode({
    serviceName: 'LibraryService',
    operationName: 'borrowBook',
    returnedType: 'Boolean',
    precondition,
    postcondition: 'result = true',
  });

describe('REMODEL executable OCL subset', () => {
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  test('parses the standard syntax used by the borrowBook paper example', () => {
    const contract = generateContractCode({
      serviceName: 'LibraryService',
      operationName: 'borrowBook',
      parameters: [
        {name: 'uid', type: 'String'},
        {name: 'barcode', type: 'String'},
      ],
      returnedType: 'Boolean',
      definition:
        'user:User = User.allInstances()->any(u | u.UserID = uid), ' +
        'bookCopy:BookCopy = BookCopy.allInstances()->any(bc | bc.Barcode = barcode), ' +
        'reserve:Set(Reserve) = user.ReservedBook->select(r | r.ReservedCopy = bookCopy)',
      precondition:
        'user.oclIsUndefined() = false and bookCopy.oclIsUndefined() = false and ' +
        'reserve->notEmpty() = true',
      postcondition:
        'let loan:Loan in loan.oclIsNew() and Loan.allInstances()->includes(loan) and ' +
        'loan.LoanedUser = user and result = true',
    });

    expect(parse(contract).errors).toEqual([]);
  });

  test('lowers standard allInstances and arrow collection operations', () => {
    const definitionVisitor = new ContractToTypescript({loweringMode: 'execute'});
    const definition = definitionVisitor.transform(
      'definition:\nusers:Set(User) = User.allInstances()',
      'Definition'
    );
    expect(toCode(definition as t.Statement[])).toContain('getRepository(User)');

    const preconditionVisitor = new ContractToTypescript({loweringMode: 'execute'});
    const precondition = preconditionVisitor.transform(
      'precondition:\nusers->notEmpty() = true',
      'Precondition',
      {vars: [{name: 'users', type: 'Set(User)'}]}
    );
    expect(toCode(precondition as t.Statement[])).toContain('StandardOPs.notEmpty(users)');
  });

  test('retains the legacy allInstance spelling for existing artifacts', () => {
    const visitor = new ContractToTypescript({loweringMode: 'execute'});
    const definition = visitor.transform(
      'definition:\nusers:Set(User) = User.allInstance()',
      'Definition'
    );

    expect(toCode(definition as t.Statement[])).toContain('getRepository(User)');
  });

  test('accepts Set literals and OCL strings containing punctuation', () => {
    const visitor = new ContractToTypescript({loweringMode: 'execute'});
    const definition = visitor.transform(
      "definition:\nlabels:Set(String) = Set{'Borrower''s copy.', 'Ready.'}",
      'Definition'
    );
    const code = toCode(definition as t.Statement[]);

    expect(code).toContain("Borrower's copy.");
    expect(code).toContain('Ready.');
    expect(code).toContain('new Set');
  });

  test('requires parentheses when and and or are mixed', () => {
    const unparenthesized = contractWith('a = true or b = true and c = true');
    const parenthesized = contractWith('a = true or (b = true and c = true)');

    expect(parse(unparenthesized).errors.length).toBeGreaterThan(0);
    expect(parse(parenthesized).errors).toEqual([]);
  });

  test.each([
    ['invalid literal', 'invalid'],
    ['unsupported invalid operation', 'user.oclIsInvalid() = false'],
    ['Bag collection type', 'items:Bag(User) = User.allInstances()'],
    ['Sequence collection type', 'items:Sequence(User) = User.allInstances()'],
    ['Collection collection type', 'items:Collection(User) = User.allInstances()'],
    ['OrderedSet collection type', 'items:OrderedSet(User) = User.allInstances()'],
    ['UnlimitedNatural type', 'count:UnlimitedNatural = 1'],
    ['OclInvalid type', 'value:OclInvalid = null'],
    ['Tuple literal', 'tupleValue = Tuple{value = true}'],
    ['standalone not', 'not user.oclIsUndefined() = true'],
    ['xor', 'a = true xor b = true'],
    ['implies', 'a = true implies b = true'],
  ])('rejects %s outside the executable subset', (_label, expression) => {
    expect(parse(contractWith(expression)).errors.length).toBeGreaterThan(0);
  });
});
