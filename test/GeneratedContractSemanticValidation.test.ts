import {generateContractCode, parse} from '@/app/util';
import {validateGeneratedContractSemantics} from '@/app/service/validateGeneratedContractSemantics';

const validate = ({
  definition,
  precondition = 'true',
  postcondition = 'true',
  returnType = 'Boolean',
}: {
  definition?: string;
  precondition?: string;
  postcondition?: string;
  returnType?: string | null;
}) => {
  const contract = generateContractCode({
    serviceName: 'LibraryService',
    operationName: 'borrowBook',
    parameters: [],
    returnedType: returnType || undefined,
    definition,
    precondition,
    postcondition,
  });
  const parsed = parse(contract);
  expect(parsed.errors).toEqual([]);
  expect(parsed.tree).toBeDefined();
  return validateGeneratedContractSemantics({
    tree: parsed.tree!,
    hasReturnValue: Boolean(returnType),
  });
};

describe('generated-contract semantic validation', () => {
  test('accepts typed query bindings and post-state-only constructs', () => {
    expect(
      validate({
        definition: 'user:User = User.allInstances()->any(candidate:User | candidate.Id = uid)',
        precondition: 'user.oclIsUndefined() = false',
        postcondition:
          'let loan:Loan in loan.oclIsNew() and user.LoanedNumber = user.LoanedNumber@pre + 1 and result = true',
      })
    ).toEqual([]);
  });

  test.each([
    ['result outside the postcondition', {precondition: 'result = true'}, 'result is permitted'],
    ['@pre outside the postcondition', {precondition: 'user.Count@pre = 1'}, '@pre is permitted'],
    [
      'oclIsNew outside the postcondition',
      {precondition: 'user.oclIsNew() = true'},
      'oclIsNew() is permitted',
    ],
    [
      'a user-defined operation call',
      {precondition: 'notify(user)'},
      'User-defined operation calls are outside',
    ],
    [
      'the parser-only allInstance alias',
      {precondition: 'User.allInstance()->includes(user)'},
      'standard allInstances() spelling',
    ],
    [
      'an untyped definition binding',
      {definition: 'user = User.allInstances()->any(candidate:User | candidate.Id = uid)'},
      'definition binding requires',
    ],
    [
      'an untyped iterator binding',
      {precondition: 'User.allInstances()->exists(candidate | candidate.Id = uid)'},
      'iterator binding requires',
    ],
    [
      'an untyped let binding',
      {postcondition: 'let loan in loan.oclIsNew()'},
      'let binding requires',
    ],
  ])('rejects %s', (_label, clauses, message) => {
    expect(validate(clauses)).toEqual(
      expect.arrayContaining([expect.objectContaining({msg: expect.stringContaining(message)})])
    );
  });

  test('rejects result for an operation without a return type', () => {
    expect(validate({postcondition: 'result = true', returnType: null})).toEqual(
      expect.arrayContaining([
        expect.objectContaining({msg: expect.stringContaining('no declared return type')}),
      ])
    );
  });
});
