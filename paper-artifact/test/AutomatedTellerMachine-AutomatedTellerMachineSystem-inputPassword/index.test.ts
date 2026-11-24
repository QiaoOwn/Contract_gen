import {AutomatedTellerMachineSystem, BankCard, CardStatus, getRepository} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

describe('AutomatedTellerMachine/AutomatedTellerMachineSystem/inputPassword', () => {
  beforeEach(() => {
    clearRepositories(getRepository(BankCard));
  });

  const seedService = (password = 123) => {
    const service = new AutomatedTellerMachineSystem();
    const card = new BankCard();
    card.CardID = 1;
    card.CardStatus = CardStatus.NORMAL;
    card.Password = password;
    getRepository(BankCard).push(card);
    service.InputCard = card;
    service.CardIDValidated = true;
    return {service, card};
  };

  it('Happy Path: matching password validates session', () => {
    const {service} = seedService(123);
    const result = service.inputPassword(123);
    expect(result).toBe(true);
    expect(service.PasswordValidated).toBe(true);
  });

  it('returns false when password does not match', () => {
    const {service} = seedService(123);
    const result = service.inputPassword(999);
    expect(result).toBe(false);
    expect(service.PasswordValidated).toBe(false);
  });

  it('rejects when card id is not validated', () => {
    const service = new AutomatedTellerMachineSystem();
    const card = new BankCard();
    card.Password = 123;
    service.InputCard = card;
    service.CardIDValidated = false;
    expectPreconditionRejected(() => service.inputPassword(123));
    expect(service.PasswordValidated).toBeUndefined();
  });

  it('rejects when current card is missing', () => {
    const service = new AutomatedTellerMachineSystem();
    service.CardIDValidated = true;
    expectPreconditionRejected(() => service.inputPassword(123));
  });
});
