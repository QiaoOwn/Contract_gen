import type {DevelopmentObligation, DevelopmentSource} from './types';

export const ATM_INPUT_CARD_USE_CASES = ['checkBalance', 'depositFunds', 'withdrawCash'] as const;
export type AtmInputCardUseCase = typeof ATM_INPUT_CARD_USE_CASES[number];
export const atmInputCardId = (useCase: AtmInputCardUseCase) => `AutomatedTellerMachine_${useCase}_inputCard`;
export const ATM_INPUT_CARD_VERSION = 'development-atm-inputCard-rm2pt-v1';
export const atmInputCardSources: readonly DevelopmentSource[] = [
  {id: 'requirement-document', path: 'data/operation_revision/upstream_rm2pt/AutomatedTellerMachine/RequirementDocument.md',
    sha256: '2f1e4d3c7607d49ec23cf695db8d4d7776d7d177c306d6ba97b0f0dc7a3cda3c',
    note: 'OP1, lines 619/623. RM2Doc and remodel have the same origin, not independent sources.'},
  {id: 'upstream-model', path: 'data/operation_revision/upstream_rm2pt/AutomatedTellerMachine/atm.remodel',
    sha256: '5d09eba89cd6060319d42449d5b7c2c30a57cc02433456ce423a0101ac3fa019',
    note: 'Active inputCard contract, lines 233-271. Card absence is a false-result branch, not rejection.'},
];
const obligation = (id: string, requirement: string, lines: [number, number], features: string[]): DevelopmentObligation => ({
  id, clause: id.startsWith('P') ? 'precondition' : 'postcondition', requirement,
  documentLine: id.startsWith('P') ? 619 : 623, modelLines: lines, modelFeatures: features,
});
export const atmInputCardObligations: DevelopmentObligation[] = [
  obligation('P01', 'No additional business precondition is required, including when the card is absent.', [247, 248], ['BankCard', '$parameter.cardid']),
  obligation('Q01', 'When the referenced card exists, set card-identifier validation to true.', [262, 264], ['BankCard.CardID', '$parameter.cardid', 'self.CardIDValidated']),
  obligation('Q02', 'When the referenced card exists, select that exact BankCard as the current card.', [262, 265], ['BankCard.CardID', '$parameter.cardid', 'self.InputCard']),
  obligation('Q03', 'When the referenced card exists, return true.', [262, 266], ['BankCard.CardID', '$parameter.cardid', '$result']),
  obligation('Q04', 'When the referenced card does not exist, set card-identifier validation to false.', [267, 268], ['BankCard.CardID', '$parameter.cardid', 'self.CardIDValidated']),
  obligation('Q05', 'When the referenced card does not exist, return false.', [267, 269], ['BankCard.CardID', '$parameter.cardid', '$result']),
];
export type AtmInputCardScenario = {id: string; obligationIds: string[]; hasTarget: boolean;
  owner: boolean; suspended: boolean; key: number; initialValidated: boolean; emptyRepository?: boolean};
const present = ['P01', 'Q01', 'Q02', 'Q03'];
const absent = ['P01', 'Q04', 'Q05'];
export const atmInputCardScenarios: AtmInputCardScenario[] = [
  {id: 'dev-card-with-owner', obligationIds: present, hasTarget: true, owner: true, suspended: false, key: 951207, initialValidated: false},
  {id: 'dev-card-without-owner', obligationIds: present, hasTarget: true, owner: false, suspended: false, key: 951311, initialValidated: false},
  {id: 'dev-suspended-card', obligationIds: present, hasTarget: true, owner: false, suspended: true, key: 951419, initialValidated: false},
  {id: 'dev-zero-card-key', obligationIds: present, hasTarget: true, owner: true, suspended: false, key: 0, initialValidated: false},
  {id: 'dev-negative-card-key', obligationIds: present, hasTarget: true, owner: true, suspended: false, key: -951503, initialValidated: false},
  {id: 'dev-missing-card-with-neighbor', obligationIds: absent, hasTarget: false, owner: false, suspended: false, key: 951617, initialValidated: true},
  {id: 'dev-empty-card-repository', obligationIds: absent, hasTarget: false, owner: false, suspended: false, key: 951719, initialValidated: true, emptyRepository: true},
];
