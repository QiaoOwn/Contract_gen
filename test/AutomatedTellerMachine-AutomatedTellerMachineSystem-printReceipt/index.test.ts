import {AutomatedTellerMachineSystem, BankCard} from './entry';
describe('AutomatedTellerMachine/AutomatedTellerMachineSystem/printReceipt', () => {
  it('Happy Path', () => {
    const service = new AutomatedTellerMachineSystem();
    const card = new BankCard();
    card.Balance = 9999;
    service.PasswordValidated = true;
    service.CardIDValidated = true;
    service.InputCard = card;
    service.IsWithdraw = true;
    service.WithdrawedNumber = 100;
    const result = service.printReceipt();
    expect(result).toBe(100);
    expect(service.InputCard).toBe(card);
    expect(service.IsWithdraw).toBe(true);
    expect(service.WithdrawedNumber).toBe(100);
  });
});
