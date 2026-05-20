import {AutomatedTellerMachineSystem, BankCard} from './entry';
describe('AutomatedTellerMachine/AutomatedTellerMachineSystem/withdrawCash', () => {
  it('Happy Path', () => {
    const service = new AutomatedTellerMachineSystem();
    const card = new BankCard();
    card.Balance = 9999;
    service.PasswordValidated = true;
    service.CardIDValidated = true;
    service.InputCard = card;
    const result = service.withdrawCash(100);
    expect(result).toBe(true);
    expect(card.Balance).toBe(9899);
    expect(service.WithdrawedNumber).toBe(100);
    expect(service.IsWithdraw).toBe(true);
  });
});
