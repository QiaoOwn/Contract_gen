import {AutomatedTellerMachineSystem, BankCard, CardStatus, getRepository, User} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

describe('AutomatedTellerMachine/AutomatedTellerMachineSystem/inputCard', () => {
  beforeEach(() => {
    clearRepositories(getRepository(BankCard), getRepository(User));
  });

  it('Happy Path: validates card with owner and returns true', () => {
    const service = new AutomatedTellerMachineSystem();
    const user = new User();
    user.UserID = 1;
    const card = new BankCard();
    card.CardID = 1;
    card.CardStatus = CardStatus.NORMAL;
    card.BelongedUser = user;
    user.OwnedCard = card;
    getRepository(User).push(user);
    getRepository(BankCard).push(card);
    const result = service.inputCard(card.CardID);
    expect(result).toBe(true);
    expect(service.CardIDValidated).toBe(true);
    expect(service.InputCard).toBe(card);
  });

  it('returns false when card has no belonged user', () => {
    const service = new AutomatedTellerMachineSystem();
    const card = new BankCard();
    card.CardID = 1;
    card.CardStatus = CardStatus.NORMAL;
    getRepository(BankCard).push(card);
    const result = service.inputCard(card.CardID);
    expect(result).toBe(false);
    expect(service.CardIDValidated).toBe(false);
  });

  it('rejects when card does not exist', () => {
    const service = new AutomatedTellerMachineSystem();
    expectPreconditionRejected(() => service.inputCard(99));
    expect(service.CardIDValidated).toBeUndefined();
    expect(service.InputCard).toBeUndefined();
  });

  it('rejects when card status is not NORMAL', () => {
    const service = new AutomatedTellerMachineSystem();
    const card = new BankCard();
    card.CardID = 1;
    card.CardStatus = CardStatus.SUSPEND;
    getRepository(BankCard).push(card);
    expectPreconditionRejected(() => service.inputCard(card.CardID));
    expect(service.CardIDValidated).toBeUndefined();
  });
});
