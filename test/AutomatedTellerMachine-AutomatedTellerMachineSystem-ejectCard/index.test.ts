import {AutomatedTellerMachineSystem, BankCard, CardStatus, getRepository} from './entry';
describe('AutomatedTellerMachine/AutomatedTellerMachineSystem/ejectCard', () => {
  it('Happy Path', () => {
    const service = new AutomatedTellerMachineSystem();
    const card = new BankCard();
    card.CardID = 1;
    card.CardStatus = CardStatus.NORMAL;
    card.Password = 123;
    card.Balance = 9999;
    getRepository(BankCard).push(card);
    service.InputCard = card;
    service.CardIDValidated = true;
    service.PasswordValidated = true;
    const result = service.ejectCard();
    expect(result).toBe(true);
    expect(service.InputCard).toBeUndefined();
    expect(service.CardIDValidated).toBe(false);
    expect(service.PasswordValidated).toBe(false);
    expect(service.IsWithdraw).toBe(false);
    expect(service.IsDeposit).toBe(false);
    expect(service.WithdrawedNumber).toBe(0);
    expect(service.DepositedNumber).toBe(0);
  });
});
