import {BankCard, AutomatedTellerMachineSystem, getRepository} from './entry';
import {expectPreconditionRejected} from '../helpers/contractOracle';

describe('Source-aligned password validation branches', () => {
  beforeEach(() => getRepository(BankCard).splice(0));
  const seed = (password: number, previous = false) => {
    const service = new AutomatedTellerMachineSystem();
    service.InputCard = Object.assign(new BankCard(), {CardID: 4101, Password: password, Balance: 500});
    service.CardIDValidated = true;
    service.PasswordValidated = previous;
    return service;
  };
  it.each([false, true])('accepts a matching password from previous validation %s', previous => {
    const service = seed(4812, previous);
    expect(service.inputPassword(4812)).toBe(true);
    expect(service.PasswordValidated).toBe(true);
  });
  it.each([false, true])('returns false and clears validation for a mismatch from %s', previous => {
    const service = seed(4813, previous);
    expect(service.inputPassword(4814)).toBe(false);
    expect(service.PasswordValidated).toBe(false);
  });
  it.each([0, -4815])('accepts an existing matching password value %s', password => {
    const service = seed(password);
    expect(service.inputPassword(password)).toBe(true);
    expect(service.PasswordValidated).toBe(true);
  });
  it('rejects when card identification has not been validated', () => {
    const service = seed(4816);
    service.CardIDValidated = false;
    expectPreconditionRejected(() => service.inputPassword(4816));
  });
  it('rejects when there is no current card', () => {
    const service = seed(4817);
    service.InputCard = undefined as unknown as BankCard;
    expectPreconditionRejected(() => service.inputPassword(4817));
  });
});
