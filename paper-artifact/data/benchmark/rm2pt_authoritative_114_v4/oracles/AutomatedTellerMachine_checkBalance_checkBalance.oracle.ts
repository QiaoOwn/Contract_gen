import {BankCard, AutomatedTellerMachineSystem, getRepository} from './entry';
import {expectPreconditionRejected} from '../helpers/contractOracle';

describe('Source-aligned authenticated current-card balance', () => {
  beforeEach(() => getRepository(BankCard).splice(0));
  const seed = (balance = 733.25, neighborBalance = 12.5) => {
    const service = new AutomatedTellerMachineSystem();
    const current = Object.assign(new BankCard(), {CardID: 5201, Password: 5211, Balance: balance});
    const neighbor = Object.assign(new BankCard(), {CardID: 5202, Password: 5212, Balance: neighborBalance});
    getRepository(BankCard).push(neighbor, current);
    service.InputCard = current;
    service.CardIDValidated = true;
    service.PasswordValidated = true;
    return {service, current, neighbor};
  };
  it.each([733.25, 0, -105.75])('returns the actual current-card balance %s, not a neighbor', balance => {
    const {service, current, neighbor} = seed(balance, balance === 0 ? 88.5 : 12.5);
    expect(service.checkBalance()).toBe(balance);
    expect(service.checkBalance()).toBe(current.Balance);
    expect(service.checkBalance()).not.toBe(neighbor.Balance);
    expect(current.Balance).toBe(balance);
    expect(neighbor.Balance).not.toBe(balance);
  });
  it('rejects when the password is not validated', () => {
    const {service, current, neighbor} = seed();
    service.PasswordValidated = false;
    expectPreconditionRejected(() => service.checkBalance());
    expect(current.Balance).toBe(733.25);
    expect(neighbor.Balance).toBe(12.5);
  });
  it('rejects when card identification is not validated', () => {
    const {service, current, neighbor} = seed();
    service.CardIDValidated = false;
    expectPreconditionRejected(() => service.checkBalance());
    expect(current.Balance).toBe(733.25);
    expect(neighbor.Balance).toBe(12.5);
  });
  it('rejects an undefined current card', () => {
    const {service, current, neighbor} = seed();
    service.InputCard = undefined as unknown as BankCard;
    expectPreconditionRejected(() => service.checkBalance());
    expect(current.Balance).toBe(733.25);
    expect(neighbor.Balance).toBe(12.5);
  });
});
