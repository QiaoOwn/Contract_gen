import {AutomatedTellerMachineSystem, BankCard, CardStatus, getRepository} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

describe('AutomatedTellerMachine/withdrawCash/ejectCard', () => {
  beforeEach(() => {
    clearRepositories(getRepository(BankCard));
  });

  const seed = (withdraw = false, deposit = false, withdrawn = 0, deposited = 0) => {
    const service = new AutomatedTellerMachineSystem();
    const card = Object.assign(new BankCard(), {
      CardID: 5501, CardStatus: CardStatus.NORMAL, Password: 5511, Balance: 900,
    });
    const neighbor = Object.assign(new BankCard(), {
      CardID: 5502, CardStatus: CardStatus.SUSPEND, Password: 5522, Balance: 44.25,
    });
    getRepository(BankCard).push(neighbor, card);
    Object.assign(service, {
      InputCard: card,
      CardIDValidated: true,
      PasswordValidated: true,
      IsWithdraw: withdraw,
      IsDeposit: deposit,
      WithdrawedNumber: withdrawn,
      DepositedNumber: deposited,
    });
    return {service, card, neighbor};
  };

  it.each([
    {withdraw: true, deposit: false, withdrawn: 311, deposited: 0},
    {withdraw: false, deposit: true, withdrawn: 0, deposited: 821.25},
    {withdraw: false, deposit: false, withdrawn: 0, deposited: 0},
    {withdraw: true, deposit: true, withdrawn: 233, deposited: 711.5},
  ])('clears every required session field for $withdraw/$deposit without mutating BankCards', values => {
    const {service, card, neighbor} = seed(
      values.withdraw, values.deposit, values.withdrawn, values.deposited);
    expect(service.ejectCard()).toBe(true);
    expect(service.InputCard == null).toBe(true);
    expect(service.PasswordValidated).toBe(false);
    expect(service.CardIDValidated).toBe(false);
    expect(service.IsWithdraw).toBe(false);
    expect(service.IsDeposit).toBe(false);
    expect(service.WithdrawedNumber).toBe(0);
    expect(service.DepositedNumber).toBe(0);
    expect(getRepository(BankCard)).toEqual([neighbor, card]);
    expect(card.CardID).toBe(5501);
    expect(card.CardStatus).toBe(CardStatus.NORMAL);
    expect(card.Password).toBe(5511);
    expect(card.Balance).toBe(900);
    expect(neighbor.CardID).toBe(5502);
    expect(neighbor.CardStatus).toBe(CardStatus.SUSPEND);
    expect(neighbor.Password).toBe(5522);
    expect(neighbor.Balance).toBe(44.25);
  });

  it('rejects an unvalidated password without clearing the session card', () => {
    const {service, card, neighbor} = seed(true, false, 311, 0);
    service.PasswordValidated = false;
    expectPreconditionRejected(() => service.ejectCard());
    expect(service.InputCard).toBe(card);
    expect(service.CardIDValidated).toBe(true);
    expect(service.IsWithdraw).toBe(true);
    expect(service.WithdrawedNumber).toBe(311);
    expect(getRepository(BankCard)).toEqual([neighbor, card]);
  });

  it('rejects an unvalidated card identifier without clearing the session card', () => {
    const {service, card, neighbor} = seed(true, false, 311, 0);
    service.CardIDValidated = false;
    expectPreconditionRejected(() => service.ejectCard());
    expect(service.InputCard).toBe(card);
    expect(service.PasswordValidated).toBe(true);
    expect(service.IsWithdraw).toBe(true);
    expect(service.WithdrawedNumber).toBe(311);
    expect(getRepository(BankCard)).toEqual([neighbor, card]);
  });

  it('rejects an absent current card', () => {
    const {service, card, neighbor} = seed(true, false, 311, 0);
    service.InputCard = undefined as unknown as BankCard;
    expectPreconditionRejected(() => service.ejectCard());
    expect(service.CardIDValidated).toBe(true);
    expect(service.PasswordValidated).toBe(true);
    expect(getRepository(BankCard)).toEqual([neighbor, card]);
  });
});
