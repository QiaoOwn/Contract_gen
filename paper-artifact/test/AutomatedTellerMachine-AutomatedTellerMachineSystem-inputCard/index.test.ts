import {AutomatedTellerMachineSystem, BankCard, CardStatus, getRepository, User} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

/**
 * Authority: src/rm2pt AutomatedTellerMachine depositFunds/checkBalance/withdrawCash inputCard.
 * TOSEM adjudication (INT-FID-021): project contract wins over upstream OP1.
 * Project: exists ∧ NORMAL; post branches on BelongedUser; missing card is pre-failure.
 * Upstream OP1: precondition true; missing card returns false. Frozen v6 input matches project.
 * Do not rewrite evaluation toward the older RM2Doc without a new input/oracle version.
 */
describe('AutomatedTellerMachine/AutomatedTellerMachineSystem/inputCard', () => {
  beforeEach(() => {
    clearRepositories(getRepository(BankCard), getRepository(User));
  });

  it('validates a NORMAL card with owner and returns true', () => {
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
    expect(service.inputCard(card.CardID)).toBe(true);
    expect(service.CardIDValidated).toBe(true);
    expect(service.InputCard).toBe(card);
  });

  it('selects the card by CardID among multiple cards', () => {
    const service = new AutomatedTellerMachineSystem();
    const user = new User();
    user.UserID = 1;
    const other = new BankCard();
    other.CardID = 7;
    other.CardStatus = CardStatus.NORMAL;
    other.BelongedUser = user;
    const target = new BankCard();
    target.CardID = 41;
    target.CardStatus = CardStatus.NORMAL;
    target.BelongedUser = user;
    getRepository(User).push(user);
    getRepository(BankCard).push(other, target);
    expect(service.inputCard(41)).toBe(true);
    expect(service.InputCard).toBe(target);
  });

  it('returns false when a NORMAL card has no belonged user', () => {
    const service = new AutomatedTellerMachineSystem();
    const card = new BankCard();
    card.CardID = 1;
    card.CardStatus = CardStatus.NORMAL;
    getRepository(BankCard).push(card);
    expect(service.inputCard(card.CardID)).toBe(false);
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
    const user = new User();
    user.UserID = 1;
    const card = new BankCard();
    card.CardID = 1;
    card.CardStatus = CardStatus.SUSPEND;
    card.BelongedUser = user;
    getRepository(User).push(user);
    getRepository(BankCard).push(card);
    expectPreconditionRejected(() => service.inputCard(card.CardID));
    expect(service.CardIDValidated).toBeUndefined();
  });
});
