import type {DevelopmentObligation, DevelopmentSource} from './types';

export const AIRPORT_CREATE_STAFF_ID = 'Airport_manageUser_createStaff';
export const AIRPORT_CREATE_STAFF_VERSION = 'development-behavior-airport-createStaff-v1';
export const AIRPORT_CREATE_STAFF_CLOCK = '2026-01-15T12:00:00+08:00';

export const airportCreateStaffSources: readonly DevelopmentSource[] = [
  {
    id: 'requirement-document',
    path: 'data/operation_revision/upstream_rm2pt/Airport/RequirementDocument.md',
    sha256: '4e88bfe620de3747ff7813c374bc5bd401815af45507ddadd8eda306df31533d',
    note: 'OP1, precondition at line 600 and postconditions at line 604. RM2Doc and its model are not independent evidence.',
  },
  {
    id: 'upstream-model',
    path: 'data/operation_revision/upstream_rm2pt/Airport/airms.remodel',
    sha256: 'fdfe96bdea560f9b2490edf97398793e39024da0f647e714df444ef87dc99604',
    note: 'Original createStaff specification, lines 164-188; the optional Boss branch has no explicit else.',
  },
  {
    id: 'current-benchmark',
    path: 'data/benchmark/rm2pt_authoritative_114_v4/operations.jsonl',
    sha256: 'c4d427804abb4a76b5c40b8669b2238e7cf2cda3555a788e156f93c4bd677633',
    note: 'The source-aligned v4 input excludes an absent-Boss outcome because the upstream conditional has no else obligation.',
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
  documentLine: clause === 'precondition' ? 600 : 604,
  modelLines: [line, line],
  modelFeatures,
});

export const airportCreateStaffObligations: DevelopmentObligation[] = [
  obligation('P01', 'precondition', 'The supplied staff identifier must be unused.', 171, [
    'Staff.Id',
    '$parameter.id',
  ]),
  obligation('Q01', 'postcondition', 'A new Staff object must be created.', 175, ['Staff']),
  obligation('Q02', 'postcondition', 'The new staff identifier must equal the supplied id.', 176, [
    'Staff.Id',
    '$parameter.id',
  ]),
  obligation('Q03', 'postcondition', 'The new staff name must equal the supplied name.', 177, [
    'Staff.Name',
    '$parameter.name',
  ]),
  obligation('Q04', 'postcondition', 'The new staff password must equal the supplied pswd.', 178, [
    'Staff.Password',
    '$parameter.pswd',
  ]),
  obligation('Q05', 'postcondition', 'The new staff phone must equal the supplied phone.', 179, [
    'Staff.Phone',
    '$parameter.phone',
  ]),
  obligation('Q06', 'postcondition', 'The new staff role must equal the supplied role.', 180, [
    'Staff.Role',
    '$parameter.role',
  ]),
  obligation(
    'Q07',
    'postcondition',
    'When bossid identifies an existing Staff member, link the new Staff member to that object as Boss.',
    184,
    ['Staff.Boss', 'Staff.Id', '$parameter.bossid']
  ),
  obligation(
    'Q09',
    'postcondition',
    'The new Staff object must be present in the Staff instance repository.',
    186,
    ['Staff']
  ),
  obligation('Q10', 'postcondition', 'The successful operation must return true.', 187, [
    '$result',
  ]),
];

export type AirportCreateStaffScenario = {
  id: string;
  staffId: number;
  name: string;
  password: string;
  phone: string;
  role: number;
  bossId: number;
  existingBoss: boolean;
  duplicate: boolean;
};
const base = {
  staffId: 963011,
  name: 'Development staff',
  password: 'dev-password-A',
  phone: 'dev-phone-A',
  role: 3,
  bossId: 963001,
  existingBoss: true,
  duplicate: false,
};
// Values vary to expose hard-coded effects; they do not impose extra input restrictions.
export const airportCreateStaffScenarios: AirportCreateStaffScenario[] = [
  {id: 'dev-staff-existing-boss', ...base},
  {
    id: 'dev-staff-existing-boss-other-values',
    ...base,
    staffId: 963012,
    name: 'Other staff',
    password: 'dev-password-B',
    phone: 'dev-phone-B',
    role: 0,
  },
  {id: 'dev-staff-missing-boss', ...base, existingBoss: false, role: -3},
  {id: 'dev-staff-new-id-as-bossid', ...base, existingBoss: false, bossId: base.staffId},
  {id: 'dev-staff-duplicate-existing-boss', ...base, duplicate: true},
  {id: 'dev-staff-duplicate-missing-boss', ...base, duplicate: true, existingBoss: false},
];

export const airportCreateStaffScenarioObligations = (scenario: AirportCreateStaffScenario) =>
  scenario.duplicate
    ? ['P01']
    : [
        'P01',
        'Q01',
        'Q02',
        'Q03',
        'Q04',
        'Q05',
        'Q06',
        ...(scenario.existingBoss ? ['Q07'] : []),
        'Q09',
        'Q10',
      ];
