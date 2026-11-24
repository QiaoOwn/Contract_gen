import {BankCard, AutomatedTellerMachineSystem, getRepository} from './entry';
import {expectPreconditionRejected} from '../helpers/contractOracle';

describe('Source-aligned deposit amount, prior balance and session effects', () => {
  beforeEach(() => getRepository(BankCard).splice(0));
  const seed = (balance = 650.5) => {
    const service = new AutomatedTellerMachineSystem();
    const card = Object.assign(new BankCard(), {CardID: 6301, Password: 6311, Balance: balance});
    service.InputCard = card;
    service.CardIDValidated = true;
    service.PasswordValidated = true;
    service.IsDeposit = false;
    service.DepositedNumber = 899;
    return {service, card};
  };
  it.each([{balance: 650.5, amount: 100}, {balance: -35.25, amount: 100.5}, {balance: 0, amount: 412.25}])(
    'adds $amount to the previous balance $balance and records the deposit', ({balance, amount}) => {
      const {service, card} = seed(balance);
      expect(service.depositFunds(amount)).toBe(true);
      expect(card.Balance).toBe(balance + amount);
      expect(service.IsDeposit).toBe(true);
      expect(service.DepositedNumber).toBe(amount);
    });
  it.each([99.75, -100])('rejects a quantity below 100: %s', amount => {
    expectPreconditionRejected(() => seed().service.depositFunds(amount));
  });
  it('rejects when the password is not validated', () => {
    const {service} = seed();
    service.PasswordValidated = false;
    expectPreconditionRejected(() => service.depositFunds(100));
  });
  it('rejects when card identification is not validated', () => {
    const {service} = seed();
    service.CardIDValidated = false;
    expectPreconditionRejected(() => service.depositFunds(100));
  });
  it('rejects an undefined current card', () => {
    const {service} = seed();
    service.InputCard = undefined as unknown as BankCard;
    expectPreconditionRejected(() => service.depositFunds(100));
  });
});
