import type {DevelopmentObligation, DevelopmentSource} from './types';

export const ATM_EJECT_CARD_ID = 'AutomatedTellerMachine_checkBalance_ejectCard';
export const ATM_EJECT_CARD_VERSION = 'development-behavior-atm-ejectCard-v1';
export const ATM_EJECT_CARD_CLOCK = '2026-01-15T12:00:00+08:00';

export const atmEjectCardSources: readonly DevelopmentSource[] = [
  {
    id: 'requirement-document',
    path: 'data/operation_revision/upstream_rm2pt/AutomatedTellerMachine/RequirementDocument.md',
    sha256: '2f1e4d3c7607d49ec23cf695db8d4d7776d7d177c306d6ba97b0f0dc7a3cda3c',
    note: 'OP5, requirements at lines 902 and 906. RM2Doc output and its originating model are not independent sources.',
  },
  {
    id: 'upstream-model',
    path: 'data/operation_revision/upstream_rm2pt/AutomatedTellerMachine/atm.remodel',
    sha256: '5d09eba89cd6060319d42449d5b7c2c30a57cc02433456ce423a0101ac3fa019',
    note: 'Original ejectCard specification, lines 369-402; read-only provenance, not a prompt answer.',
  },
];

const obligation = (
  id: string,
  clause: DevelopmentObligation['clause'],
  requirement: string,
  line: number,
  modelFeatures: string[]
): DevelopmentObligation => ({
  id,
  clause,
  requirement,
  documentLine: clause === 'precondition' ? 902 : 906,
  modelLines: [line, line],
  modelFeatures,
});

export const atmEjectCardObligations: DevelopmentObligation[] = [
  obligation('P01', 'precondition', 'The session password must be validated.', 378, [
    'self.PasswordValidated',
  ]),
  obligation('P02', 'precondition', 'The session card identifier must be validated.', 379, [
    'self.CardIDValidated',
  ]),
  obligation('P03', 'precondition', 'A current card must be present.', 380, ['self.InputCard']),
  obligation('Q01', 'postcondition', 'The current card reference must be cleared.', 394, [
    'self.InputCard',
  ]),
  {
    ...obligation('Q02', 'postcondition', 'Password validation must be reset to false.', 395, [
      'self.PasswordValidated',
    ]),
    localizationTargets: ['self.PasswordValidated'],
  },
  obligation('Q03', 'postcondition', 'Card identifier validation must be reset to false.', 396, [
    'self.CardIDValidated',
  ]),
  obligation('Q04', 'postcondition', 'The withdrawal flag must be reset to false.', 397, [
    'self.IsWithdraw',
  ]),
  obligation('Q05', 'postcondition', 'The deposit flag must be reset to false.', 398, [
    'self.IsDeposit',
  ]),
  obligation('Q06', 'postcondition', 'The recorded withdrawal amount must be reset to zero.', 399, [
    'self.WithdrawedNumber',
  ]),
  obligation('Q07', 'postcondition', 'The recorded deposit amount must be reset to zero.', 400, [
    'self.DepositedNumber',
  ]),
  obligation('Q08', 'postcondition', 'The successful operation must return true.', 401, [
    '$result',
  ]),
];

export type AtmEjectCardScenario = {
  id: string;
  passwordValidated: boolean;
  cardIdValidated: boolean;
  hasCard: boolean;
  isWithdraw: boolean;
  isDeposit: boolean;
  withdrawn: number;
  deposited: number;
  rejectObligation?: string;
};
const session = {
  passwordValidated: true,
  cardIdValidated: true,
  hasCard: true,
  isWithdraw: true,
  isDeposit: false,
  withdrawn: 260,
  deposited: 0,
};
export const atmEjectCardScenarios: AtmEjectCardScenario[] = [
  {id: 'dev-eject-after-withdrawal', ...session},
  {
    id: 'dev-eject-after-deposit',
    ...session,
    isWithdraw: false,
    isDeposit: true,
    withdrawn: 0,
    deposited: 730,
  },
  {id: 'dev-eject-idle-session', ...session, isWithdraw: false, withdrawn: 0},
  {
    id: 'dev-eject-password-unvalidated',
    ...session,
    passwordValidated: false,
    rejectObligation: 'P01',
  },
  {
    id: 'dev-eject-card-id-unvalidated',
    ...session,
    cardIdValidated: false,
    rejectObligation: 'P02',
  },
  {id: 'dev-eject-no-card', ...session, hasCard: false, rejectObligation: 'P03'},
];
