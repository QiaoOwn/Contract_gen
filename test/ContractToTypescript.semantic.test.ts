import generate from '@babel/generator';
import * as t from '@babel/types';
import {ContractToTypescript, type ContractLoweringMode} from '../src/app/ContractToTypescript';
import {generateTypescriptServiceFile} from '../src/app/service/generateTypescriptCode';
import * as AutomatedTellerMachine from '../src/rm2pt/project/AutomatedTellerMachine';
import * as LibraryManagementSystem from '../src/rm2pt/project/LibraryManagementSystem';

type Var = {name: string; type: string};

const lowerPostcondition = (source: string, mode: ContractLoweringMode, vars: Var[]) => {
  const visitor = new ContractToTypescript({loweringMode: mode});
  const transformed = visitor.transform(`postcondition:\n${source}`, 'Postcondition', {vars});
  const statements = (Array.isArray(transformed) ? transformed : [transformed]).map((node) =>
    t.isStatement(node) ? node : t.expressionStatement(node as t.Expression)
  );
  return generate(t.program(statements)).code;
};

const lowerDefinition = (source: string, vars: Var[]) => {
  const visitor = new ContractToTypescript({loweringMode: 'execute'});
  const transformed = visitor.transform(`definition:\n${source}`, 'Definition', {vars});
  return generate(t.program(transformed as t.Statement[])).code;
};

describe('ContractToTypescript semantic lowering', () => {
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  test('lowers forAll to every in check mode', () => {
    const code = lowerPostcondition('books->forAll(b:Book|b.Status = status)', 'check', [
      {name: 'books', type: 'Set(Book)'},
      {name: 'status', type: 'String'},
    ]);

    expect(code).toContain('books.every');
    expect(code).toContain('StandardOPs.oclEquals(b.Status, status)');
    expect(code).not.toContain('books.forEach');
  });

  test('retains forEach only for the contract-derived effect path', () => {
    const code = lowerPostcondition('books->forAll(b:Book|b.Status = status)', 'execute', [
      {name: 'books', type: 'Set(Book)'},
      {name: 'status', type: 'String'},
    ]);

    expect(code).toContain('books.forEach');
    expect(code).toContain('b.Status = status');
  });

  test('keeps a non-mutating postcondition forAll on the shared every path', () => {
    const code = lowerPostcondition('books->forAll(b:Book|b.Status <> status)', 'execute', [
      {name: 'books', type: 'Set(Book)'},
      {name: 'status', type: 'String'},
    ]);

    expect(code).toContain('books.every');
    expect(code).not.toContain('books.forEach');
  });

  test('keeps includes and excludes as non-mutating predicates in check mode', () => {
    const includes = lowerPostcondition('books->includes(book)', 'check', [
      {name: 'books', type: 'Set(Book)'},
      {name: 'book', type: 'Book'},
    ]);
    const excludes = lowerPostcondition('books->excludes(book)', 'check', [
      {name: 'books', type: 'Set(Book)'},
      {name: 'book', type: 'Book'},
    ]);

    expect(includes).toContain('StandardOPs.includes(books, book)');
    expect(excludes).toContain('!StandardOPs.includes(books, book)');
    expect(`${includes}\n${excludes}`).not.toMatch(/\.push|\.remove/);
  });

  test('uses idempotent collection helpers in the execute branch', () => {
    const includes = lowerPostcondition('books->includes(book)', 'execute', [
      {name: 'books', type: 'Set(Book)'},
      {name: 'book', type: 'Book'},
    ]);
    const excludes = lowerPostcondition('books->excludes(book)', 'execute', [
      {name: 'books', type: 'Set(Book)'},
      {name: 'book', type: 'Book'},
    ]);

    expect(includes).toContain('StandardOPs.includeIfAbsent(books, book)');
    expect(excludes).toContain('StandardOPs.removeIfPresent(books, book)');
  });

  test('reads @pre through the captured pre-state', () => {
    const code = lowerPostcondition('book.Status = book.Status@pre', 'check', [
      {name: 'book', type: 'Book'},
    ]);

    expect(code).toContain('StandardOPs.oclEquals(book.Status, oclState.preValue(book, "Status"))');
  });

  test('checks oclIsNew against repository identity instead of allocating an object', () => {
    const code = lowerPostcondition(
      'let loan:Loan in loan.oclIsNew() and Loan.allInstances()->includes(loan)',
      'check',
      []
    );

    expect(code).toContain('let loan: Loan = oclState.findNew(Loan)');
    expect(code).toContain('oclState.isNew(loan, Loan)');
    expect(code).toContain('StandardOPs.includes(getRepository(Loan), loan)');
    expect(code).not.toContain('new Loan');
    expect(code).not.toContain('.push');
  });

  test('infers an omitted let type from repository membership', () => {
    const execute = lowerPostcondition(
      'let loan in loan.oclIsNew() and Loan.allInstances()->includes(loan)',
      'execute',
      []
    );
    const check = lowerPostcondition(
      'let loan in loan.oclIsNew() and Loan.allInstances()->includes(loan)',
      'check',
      []
    );

    expect(execute).toContain('loan = new Loan()');
    expect(execute).toContain('StandardOPs.includeIfAbsent(getRepository(Loan), loan)');
    expect(check).toContain('let loan: Loan = oclState.findNew(Loan)');
    expect(check).toContain('oclState.isNew(loan, Loan)');
  });

  test('keeps equations over non-assignable expressions as predicates in execute mode', () => {
    const code = lowerPostcondition('Book.allInstances() = Book.allInstances()', 'execute', []);

    expect(code).toContain('StandardOPs.oclEquals(getRepository(Book), getRepository(Book))');
    expect(code).not.toContain('getRepository(Book) = getRepository(Book)');
  });

  test('lowers nested let expressions without leaking statement arrays', () => {
    const code = lowerPostcondition(
      'let loan:Loan = loans->any(l:Loan|l.Id = id) in let account:LoanAccount = loan.Account in loan.Status = status and account.Balance = balance',
      'execute',
      [
        {name: 'loans', type: 'Set(Loan)'},
        {name: 'id', type: 'Integer'},
        {name: 'status', type: 'String'},
        {name: 'balance', type: 'Real'},
      ]
    );

    expect(code).toContain('let loan: Loan');
    expect(code).toContain('let account: LoanAccount');
    expect(code).toContain('loan.Status = status');
    expect(code).toContain('account.Balance = balance');
  });

  test('reads initialized postcondition let values from the correct lowering channel', () => {
    const source =
      'let repair:Repair = repairs->any(r:Repair|r.Id = id) in repair.Process = process';
    const vars = [
      {name: 'repairs', type: 'Set(Repair)'},
      {name: 'id', type: 'Integer'},
      {name: 'process', type: 'Integer'},
    ];

    const execute = lowerPostcondition(source, 'execute', vars);
    const check = lowerPostcondition(source, 'check', vars);

    expect(execute).toMatch(/let repair: Repair = [\s\S]*?\.build\(\)\.value;/);
    expect(check).toMatch(/let repair: Repair = [\s\S]*?\.build\(\)\.pass;/);
  });

  test('supports if expressions as iterator bodies', () => {
    const code = lowerPostcondition(
      'books->forAll(b:Book|if b.Status = oldStatus then b.Status = newStatus else b.Status = b.Status@pre endif)',
      'execute',
      [
        {name: 'books', type: 'Set(Book)'},
        {name: 'oldStatus', type: 'String'},
        {name: 'newStatus', type: 'String'},
      ]
    );

    expect(code).toContain('books.forEach');
    expect(code).toContain('b.Status = newStatus');
    expect(code).toContain('oclState.preValue(b, "Status")');
  });

  test('supports parenthesized expressions and Set literals', () => {
    const nested = lowerDefinition('closeFlag:Boolean = (score >= 4)', [
      {name: 'score', type: 'Integer'},
    ]);
    const collection = lowerDefinition('searchResult:Set(Book) = Set{book}', [
      {name: 'book', type: 'Book'},
    ]);

    expect(nested).toContain('score >= 4');
    expect(collection).toContain('Array.from(new Set([');
    expect(collection).toContain('book');
  });

  test('lowers one to an exact-cardinality predicate', () => {
    const code = lowerPostcondition('books->one(b:Book|b.Status = status)', 'check', [
      {name: 'books', type: 'Set(Book)'},
      {name: 'status', type: 'String'},
    ]);

    expect(code).toContain('books.filter');
    expect(code).toContain('.length === 1');
  });

  test('compares isUnique keys rather than builder identities', () => {
    const code = lowerPostcondition('books->isUnique(b:Book|b.Status)', 'check', [
      {name: 'books', type: 'Set(Book)'},
    ]);

    expect(code).toContain('b.Status');
    expect(code).toContain('.build().pass');
    expect(code).toContain('new Set(_isUniqueKeys).size === _isUniqueKeys.length');
  });

  test('lowers query iterators to their executable collection operations', () => {
    const exists = lowerPostcondition('books->exists(b:Book|b.Status = status)', 'check', [
      {name: 'books', type: 'Set(Book)'},
      {name: 'status', type: 'String'},
    ]);
    const select = lowerDefinition('matches:Set(Book) = books->select(b:Book|b.Status = status)', [
      {name: 'books', type: 'Set(Book)'},
      {name: 'status', type: 'String'},
    ]);
    const collect = lowerDefinition('prices:Set(Real) = books->collect(b:Book|b.Price)', [
      {name: 'books', type: 'Set(Book)'},
    ]);

    expect(exists).toContain('books.some');
    expect(select).toContain('books.filter');
    expect(collect).toContain('books.map');
  });

  test('lowers bulk collection membership in check and execute modes', () => {
    const check = lowerPostcondition('books->includesAll(selected)', 'check', [
      {name: 'books', type: 'Set(Book)'},
      {name: 'selected', type: 'Set(Book)'},
    ]);
    const execute = lowerPostcondition('books->excludesAll(selected)', 'execute', [
      {name: 'books', type: 'Set(Book)'},
      {name: 'selected', type: 'Set(Book)'},
    ]);

    expect(check).toContain('selected.every');
    expect(check).toContain('StandardOPs.includes(books, _collectionItem)');
    expect(execute).toContain('StandardOPs.removeAllIfPresent(books, selected)');
  });

  test('uses executable helpers for numeric aggregation and exact type checks', () => {
    const sum = lowerDefinition('total:Real = prices->sum()', [
      {name: 'prices', type: 'Set(Real)'},
    ]);
    const typeCheck = lowerPostcondition('user.oclIsTypeOf(Student)', 'check', [
      {name: 'user', type: 'User'},
    ]);

    expect(sum).toContain('StandardOPs.sum(prices)');
    expect(sum).not.toContain('prices.sum()');
    expect(typeCheck).toContain('StandardOPs.oclIsTypeOf(user,Student)');
  });

  test('lowers date comparison and offset operations through dayjs', () => {
    const comparison = lowerPostcondition('dueDate.isBefore(today)', 'check', [
      {name: 'dueDate', type: 'Date'},
      {name: 'today', type: 'Date'},
    ]);
    const offset = lowerPostcondition('result = today.After(days)', 'check', [
      {name: 'result', type: 'Date'},
      {name: 'today', type: 'Date'},
      {name: 'days', type: 'Integer'},
    ]);

    expect(comparison).toContain('dayjs(dueDate).isBefore(today)');
    expect(offset).toContain('dayjs(today).add(days, "d")');
  });

  test('records an operation once and checks it through the execution trace', () => {
    const execute = lowerPostcondition('notify(book)', 'execute', [{name: 'book', type: 'Book'}]);
    const check = lowerPostcondition('notify(book)', 'check', [{name: 'book', type: 'Book'}]);

    expect(execute).toContain('oclExecutionTrace.call("notify", [book], () => notify(book))');
    expect(check).toContain('oclExecutionTrace.wasCalled("notify", [book])');
  });

  test('preserves quoted operation arguments as string literals', () => {
    const code = lowerPostcondition("notify('user')", 'execute', []);

    expect(code).toContain('notify("user")');
  });

  test('uses value equality for OCL collections and temporal values', () => {
    const collection = lowerPostcondition('result = books', 'check', [
      {name: 'result', type: 'Set(Book)'},
      {name: 'books', type: 'Set(Book)'},
    ]);
    const today = lowerPostcondition('date = Today', 'check', [{name: 'date', type: 'Date'}]);

    expect(collection).toContain('StandardOPs.oclEquals(result, books)');
    expect(today).toContain('dayjs().startOf("day")');
  });

  test('captures the temporal environment once for effect execution and checking', () => {
    const service = LibraryManagementSystem.useCase.borrowBook.relatedService;
    const operation = service.operations.find(({name}) => name === 'borrowBook')!;
    const {file} = generateTypescriptServiceFile(service, [operation]);
    const code = generate(file).code;

    expect(code.match(/const oclInvocationTime = dayjs\(\)/g)).toHaveLength(1);
    expect(code).toContain('oclInvocationTime.startOf("day")');
    expect(code).not.toContain('dayjs().startOf("day")');
  });

  test('generates effect execution followed by a pure postcondition check', () => {
    const service = AutomatedTellerMachine.useCase.depositFunds.relatedService;
    const operation = service.operations.find(({name}) => name === 'depositFunds')!;
    const {file} = generateTypescriptServiceFile(service, [operation]);
    const code = generate(file).code;

    expect(code).toContain('const oclState = new OCLStateSnapshot(map, [this])');
    expect(code).toContain('const oclExecutionTrace = new OCLExecutionTrace()');
    expect(code).toContain('oclState.preValue(this.InputCard, "Balance") + quantity');
    expect(code).toContain('oclState.capturePost()');
    expect(code).toContain('isPostconditionPass');
    expect(code).toContain('throw new PostconditionError(postconditionErrorMessage)');
    expect(code.indexOf('new OCLStateSnapshot(map, [this])')).toBeLessThan(
      code.indexOf('oclState.preValue(this.InputCard, "Balance")')
    );
    expect(code.indexOf('oclState.capturePost()')).toBeLessThan(
      code.indexOf('isPostconditionPass')
    );
  });
});
