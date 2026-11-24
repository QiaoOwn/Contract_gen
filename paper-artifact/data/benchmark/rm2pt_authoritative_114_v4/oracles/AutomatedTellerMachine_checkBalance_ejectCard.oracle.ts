import {AutomatedTellerMachineSystem, BankCard, CardStatus, getRepository} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

describe('AutomatedTellerMachine/AutomatedTellerMachineSystem/ejectCard', () => {
  beforeEach(() => {
    clearRepositories(getRepository(BankCard));
  });

  const seed = () => {
    const service = new AutomatedTellerMachineSystem();
    const card = Object.assign(new BankCard(), {
      CardID: 1, CardStatus: CardStatus.NORMAL, Password: 123, Balance: 9999,
    });
    const neighbor = Object.assign(new BankCard(), {
      CardID: 2, CardStatus: CardStatus.SUSPEND, Password: 456, Balance: 40.5,
    });
    getRepository(BankCard).push(neighbor, card);
    service.InputCard = card;
    service.CardIDValidated = true;
    service.PasswordValidated = true;
    service.IsWithdraw = true;
    service.IsDeposit = true;
    service.WithdrawedNumber = 50;
    service.DepositedNumber = 100;
    return {service, card, neighbor};
  };

  it('clears session and transaction state without deleting or mutating BankCards', () => {
    const {service, card, neighbor} = seed();
    expect(service.ejectCard()).toBe(true);
    expect(service.InputCard == null).toBe(true);
    expect(service.CardIDValidated).toBe(false);
    expect(service.PasswordValidated).toBe(false);
    expect(service.IsWithdraw).toBe(false);
    expect(service.IsDeposit).toBe(false);
    expect(service.WithdrawedNumber).toBe(0);
    expect(service.DepositedNumber).toBe(0);
    expect(getRepository(BankCard)).toEqual([neighbor, card]);
    expect(card.CardID).toBe(1);
    expect(card.CardStatus).toBe(CardStatus.NORMAL);
    expect(card.Password).toBe(123);
    expect(card.Balance).toBe(9999);
    expect(neighbor.CardID).toBe(2);
    expect(neighbor.CardStatus).toBe(CardStatus.SUSPEND);
    expect(neighbor.Password).toBe(456);
    expect(neighbor.Balance).toBe(40.5);
  });

  it('rejects an unvalidated password without clearing the session card', () => {
    const {service, card, neighbor} = seed();
    service.PasswordValidated = false;
    expectPreconditionRejected(() => service.ejectCard());
    expect(service.InputCard).toBe(card);
    expect(service.CardIDValidated).toBe(true);
    expect(getRepository(BankCard)).toEqual([neighbor, card]);
  });

  it('rejects an unvalidated card identifier without clearing the session card', () => {
    const {service, card, neighbor} = seed();
    service.CardIDValidated = false;
    expectPreconditionRejected(() => service.ejectCard());
    expect(service.InputCard).toBe(card);
    expect(service.PasswordValidated).toBe(true);
    expect(getRepository(BankCard)).toEqual([neighbor, card]);
  });

  it('rejects an absent current card', () => {
    const {service, card, neighbor} = seed();
    service.InputCard = undefined as unknown as BankCard;
    expectPreconditionRejected(() => service.ejectCard());
    expect(service.CardIDValidated).toBe(true);
    expect(service.PasswordValidated).toBe(true);
    expect(getRepository(BankCard)).toEqual([neighbor, card]);
  });
});
