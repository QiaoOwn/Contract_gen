import generate from '@babel/generator';
import * as typescript from 'typescript';
import {createGlobalEntryCode} from '../src/app/service/createGlobalEntryCode';
import {
  generateTypescriptEntityFile,
  generateTypescriptServiceFile,
} from '../src/app/service/generateTypescriptCode';
import * as AutomatedTellerMachine from '../src/rm2pt/project/AutomatedTellerMachine';

const compileOperation = (operationName: string) => {
  const project = AutomatedTellerMachine;
  const service = project.useCase.depositFunds.relatedService;
  const operation = service.operations.find(({name}) => name === operationName)!;
  const entityCode = generate(generateTypescriptEntityFile(project.entity, service)).code;
  const serviceCode = generate(generateTypescriptServiceFile(service, [operation]).file).code;
  const source = [createGlobalEntryCode(), entityCode, serviceCode].join('\n');
  const javascript = typescript.transpileModule(source, {
    compilerOptions: {
      module: typescript.ModuleKind.CommonJS,
      target: typescript.ScriptTarget.ES2019,
      esModuleInterop: true,
    },
  }).outputText;
  const runtimeModule = {exports: {} as Record<string, any>};
  const evaluate = new Function('require', 'module', 'exports', javascript);
  evaluate(require, runtimeModule, runtimeModule.exports);
  return runtimeModule.exports;
};

describe('OCLTSVM hybrid postcondition validation', () => {
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  test('executes effects once and validates @pre against the captured state', () => {
    const runtime = compileOperation('depositFunds');
    const card = new runtime.BankCard();
    card.Balance = 500;
    runtime.getRepository(runtime.BankCard).push(card);

    const service = new runtime.AutomatedTellerMachineSystem();
    service.PasswordValidated = true;
    service.CardIDValidated = true;
    service.InputCard = card;
    service.IsDeposit = false;
    service.DepositedNumber = 0;

    expect(service.depositFunds(100)).toBe(true);
    expect(card.Balance).toBe(600);
    expect(service.IsDeposit).toBe(true);
    expect(service.DepositedNumber).toBe(100);
  });
});
