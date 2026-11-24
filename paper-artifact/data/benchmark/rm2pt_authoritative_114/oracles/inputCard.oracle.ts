import {AutomatedTellerMachineSystem, BankCard, CardStatus, User, getRepository} from './entry';

// Evaluation-only assertions derived from original RM2PT OP1, not from a candidate.
// No development fixtures or development-check functions are imported here.
describe('source-aligned inputCard acceptance', () => {
  beforeEach(() => {
    getRepository(BankCard).splice(0);
    getRepository(User).splice(0);
  });
  it.each([
    {key: 47, status: CardStatus.NORMAL, owner: true},
    {key: 102, status: CardStatus.NORMAL, owner: false},
    {key: 893, status: CardStatus.SUSPEND, owner: true},
    {key: 0, status: CardStatus.SUSPEND, owner: false},
    {key: -19, status: CardStatus.NORMAL, owner: false},
  ])('accepts an existing card without adding a status, owner or key-range requirement: %j', scenario => {
    const service = new AutomatedTellerMachineSystem();
    const target = Object.assign(new BankCard(), {CardID: scenario.key, CardStatus: scenario.status});
    const other = Object.assign(new BankCard(), {CardID: scenario.key + 17, CardStatus: CardStatus.NORMAL});
    if (scenario.owner) {
      const owner = new User();
      target.BelongedUser = owner;
      getRepository(User).push(owner);
    }
    getRepository(BankCard).push(other, target);
    service.InputCard = other;
    service.CardIDValidated = false;
    expect(service.inputCard(scenario.key)).toBe(true);
    expect(service.CardIDValidated).toBe(true);
    expect(service.InputCard).toBe(target);
  });
  it.each([true, false])('returns false normally when the card is absent, initially validated=%s', initiallyValidated => {
    const service = new AutomatedTellerMachineSystem();
    const other = Object.assign(new BankCard(), {CardID: 61, CardStatus: CardStatus.NORMAL});
    getRepository(BankCard).push(other);
    service.InputCard = other;
    service.CardIDValidated = initiallyValidated;
    expect(service.inputCard(907)).toBe(false);
    expect(service.CardIDValidated).toBe(false);
    // OP1 leaves InputCard unspecified in this branch.
  });
  it('returns false for an empty card repository', () => {
    const service = new AutomatedTellerMachineSystem();
    service.CardIDValidated = true;
    expect(service.inputCard(204)).toBe(false);
    expect(service.CardIDValidated).toBe(false);
  });
});
