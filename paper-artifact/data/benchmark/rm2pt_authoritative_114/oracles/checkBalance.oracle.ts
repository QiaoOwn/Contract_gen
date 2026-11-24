import {BankCard, AutomatedTellerMachineSystem, getRepository} from './entry';
import {expectPreconditionRejected} from '../helpers/contractOracle';

describe('Source-aligned authenticated current-card balance', () => {
  beforeEach(() => getRepository(BankCard).splice(0));
  const seed = (balance = 733.25) => {
    const service = new AutomatedTellerMachineSystem();
    service.InputCard = Object.assign(new BankCard(), {CardID: 5201, Password: 5211, Balance: balance});
    service.CardIDValidated = true;
    service.PasswordValidated = true;
    return service;
  };
  it.each([733.25, 0, -105.75])('returns the actual current balance %s', balance => {
    expect(seed(balance).checkBalance()).toBe(balance);
  });
  it('rejects when the password is not validated', () => {
    const service = seed();
    service.PasswordValidated = false;
    expectPreconditionRejected(() => service.checkBalance());
  });
  it('rejects when card identification is not validated', () => {
    const service = seed();
    service.CardIDValidated = false;
    expectPreconditionRejected(() => service.checkBalance());
  });
  it('rejects an undefined current card', () => {
    const service = seed();
    service.InputCard = undefined as unknown as BankCard;
    expectPreconditionRejected(() => service.checkBalance());
  });
});
