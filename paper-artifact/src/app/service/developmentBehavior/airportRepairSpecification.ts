import type {DevelopmentObligation, DevelopmentSource} from './types';
import type {FiniteScenario} from './finiteScenarioReport';

export type AirportRepairOperation = 'createDevice' | 'approve' | 'finishRepair' | 'feedback';
export const AIRPORT_REPAIR_CLOCK = '2026-01-15T12:00:00+08:00';
export const airportCreateDeviceDecisionSource: DevelopmentSource = {
  id: 'adjudication-R01',
  path: 'data/operation_revision/rm2pt_authority_decisions/R01_createDevice.json',
  sha256: 'f07c24ef4faf35c71f161a225fb8167f2cf33aa10862ef65d006d081fb848ae5',
  note: 'R01 approved by the user/laboratory owner on 2026-10-27: store the newly created Device. This is a source correction, not independent expert review.',
};
export const airportV4DecisionSource: DevelopmentSource = {
  id: 'owner-v4-adjudication',
  path: 'data/benchmark/rm2pt_authoritative_114_v4/OWNER_ADJUDICATIONS.md',
  sha256: '0b9b65324c69d6b94651cbdaf682719a961e292447d19bfbeabedd7b4945cda0',
  note: 'Owner-approved laboratory behavior; not an original RM2PT obligation or independent expert approval.',
};
export const airportRepairSources: DevelopmentSource[] = [
  {id: 'requirement-document', path: 'data/operation_revision/upstream_rm2pt/Airport/RequirementDocument.md',
    sha256: '4e88bfe620de3747ff7813c374bc5bd401815af45507ddadd8eda306df31533d',
    note: 'OP2-5 tables; generated from the same RM2PT model, not independent corroboration.'},
  {id: 'upstream-model', path: 'data/operation_revision/upstream_rm2pt/Airport/airms.remodel',
    sha256: 'fdfe96bdea560f9b2490edf97398793e39024da0f647e714df444ef87dc99604',
    note: 'Lines 190-297. Preserve the reject=true transition convention and do not infer res assignment.'},
  {id: 'aligned-input', path: 'data/benchmark/lab_adjudicated_114_v2/operations-lab-adjudicated-114-v2.jsonl',
    sha256: '8206dab27fce4ca0dbbda88c5ed151d19d478af9e3501cdeb5c82a59be7b34c4',
    note: 'The current input requires storing the newly created Device. The upstream inclusion uses dev instead of d; this discrepancy is recorded, not silently repaired upstream.'},
];
const o = (id: string, requirement: string, documentLine: number, modelLines: [number, number], modelFeatures: string[]): DevelopmentObligation =>
  ({id, clause: id.startsWith('P') ? 'precondition' : 'postcondition', requirement, documentLine, modelLines, modelFeatures});
export const airportRepairSpecifications = {
  createDevice: {id: 'Airport_manageDevice_createDevice', schemaVersion: 'development-airport-createDevice-v1', useCase: 'manageDevice',
    obligations: [
      o('P01', 'The device identifier is unused.', 667, [197, 197], ['Device.Id', '$parameter.id']),
      o('P02', 'The selected contact identifies an existing Staff member.', 667, [198, 198], ['Staff.Id', '$parameter.contactsid']),
      o('Q01', 'A new Device stores the supplied identifier, name and location.', 671, [201, 205], ['Device', 'Device.Id', 'Device.Name', 'Device.Location', '$parameter.id', '$parameter.name', '$parameter.location']),
      {...o('Q02', 'The new Device is linked to the selected Staff and stored.', 671, [206, 207], ['Device', 'Device.Contacts', 'Staff', '$parameter.contactsid']),
        localizationTargets: ['Device', 'Device.Contacts'],
        evidenceNote: 'R01 approved source correction: the newly created d, not absent dev, must be stored; see adjudication-R01. Other preconditions and effects are unchanged.'},
      o('Q03', 'The operation returns true.', 671, [208, 208], ['$result']),
    ]},
  approve: {id: 'Airport_raiseRepair_approve', schemaVersion: 'development-airport-approve-v1', useCase: 'raiseRepair',
    obligations: [
      o('P01', 'The referenced Repair exists.', 729, [218, 218], ['Repair.Id', '$parameter.rid']),
      o('P02', 'The referenced Staff exists.', 729, [219, 219], ['Staff.Id', '$parameter.sid']),
      o('Q01', 'Create and store a new ApprovalHistory with the decision and suggestion, linked to the Repair.', 733, [222, 227], ['ApprovalHistory', 'ApprovalHistory.Reject', 'ApprovalHistory.Suggestion', 'Repair.History', '$parameter.reject', '$parameter.suggestion']),
      o('Q02', 'When reject is true, the three matching Process/Role pairs advance to stages 1, 2 and 3 respectively.', 733, [228, 250], ['Repair.Process', 'Staff.Role', '$parameter.reject']),
      o('Q03', 'When reject is false, Process becomes 5.', 733, [251, 252], ['Repair.Process', '$parameter.reject']),
      o('Q04', 'Return the newly created ApprovalHistory object.', 733, [255, 255], ['ApprovalHistory', '$result']),
    ]},
  finishRepair: {id: 'Airport_raiseRepair_finishRepair', schemaVersion: 'development-airport-finishRepair-v1', useCase: 'raiseRepair',
    obligations: [
      o('P01', 'The Device is assigned to the supplied Staff.', 817, [266, 266], ['Device.Contacts', 'Device.Id', 'Staff.Id', '$parameter.did', '$parameter.sid']),
      o('P02', 'The Staff has Worker role 3.', 817, [267, 267], ['Staff.Role']),
      {...o('P03', 'The referenced Repair exists.', 7, [269, 269], ['Repair.Id', '$parameter.id']),
        requirementSourceId: 'owner-v4-adjudication', evidenceNote: 'Laboratory addition; original source has no missing-Repair guard.'},
      o('Q01', 'The referenced Repair reaches finished stage 7.', 821, [269, 269], ['Repair.Id', 'Repair.Process', '$parameter.id']),
      o('Q02', 'The operation returns true.', 821, [270, 270], ['$result']),
    ]},
  feedback: {id: 'Airport_raiseRepair_feedback', schemaVersion: 'development-airport-feedback-v1', useCase: 'raiseRepair',
    obligations: [
      o('P01', 'The supplied Staff raised the Repair.', 874, [281, 281], ['Repair.RaiseStaff', 'Repair.Id', 'Staff.Id', '$parameter.sid', '$parameter.id']),
      o('P02', 'The Staff has GroundStaff role 0.', 874, [282, 282], ['Staff.Role']),
      o('P03', 'The Repair is at finished stage 7.', 874, [283, 283], ['Repair.Process']),
      o('Q01', 'The score is updated to the supplied value.', 878, [285, 285], ['Repair.Score', '$parameter.score']),
      o('Q02', 'A score at least 3 closes the Repair.', 878, [287, 289], ['Repair.Close', '$parameter.score']),
      o('Q03', 'A score below 3 opens the Repair, records des, and resets Process to 0.', 878, [290, 293], ['Repair.Close', 'Repair.Description', 'Repair.Process', '$parameter.score', '$parameter.des']),
      o('Q04', 'The operation returns true.', 878, [296, 296], ['$result']),
    ]},
} satisfies Record<AirportRepairOperation, {id: string; schemaVersion: string; useCase: string; obligations: DevelopmentObligation[]}>;

export type AirportRepairScenario = FiniteScenario & {value?: number; role?: number; stage?: number; decision?: boolean; targetLast?: boolean};
const positive = (operation: AirportRepairOperation, id: string, extra: Omit<AirportRepairScenario, 'id' | 'obligationIds'> = {}): AirportRepairScenario => {
  const omit = operation === 'approve' ? [extra.decision === false ? 'Q02' : 'Q03']
    : operation === 'feedback' ? [(extra.value ?? 3) >= 3 ? 'Q03' : 'Q02'] : [];
  return {id, ...extra, obligationIds: airportRepairSpecifications[operation].obligations.filter(item => !omit.includes(item.id)).map(item => item.id)};
};
const negative = (id: string, rejectObligation: string): AirportRepairScenario => ({id, rejectObligation, obligationIds: [rejectObligation]});
export const airportRepairScenarios: Record<AirportRepairOperation, AirportRepairScenario[]> = {
  createDevice: [positive('createDevice', 'new-device-first'), positive('createDevice', 'new-device-zero', {value: 0, targetLast: true}),
    positive('createDevice', 'new-device-negative', {value: -73117}), negative('duplicate-device', 'P01'), negative('missing-contact', 'P02')],
  approve: [positive('approve', 'master-advance', {role: 1, stage: 0, decision: true}),
    positive('approve', 'manager-advance', {role: 2, stage: 1, decision: true, targetLast: true}),
    positive('approve', 'worker-advance', {role: 3, stage: 2, decision: true}),
    positive('approve', 'reject-stage', {role: 2, stage: 1, decision: false}),
    negative('missing-repair', 'P01'), negative('missing-staff', 'P02')],
  finishRepair: [positive('finishRepair', 'finish-first', {stage: 3}), positive('finishRepair', 'finish-last', {stage: 6, targetLast: true}),
    negative('wrong-contact', 'P01'), negative('wrong-worker-role', 'P02'), negative('missing-repair', 'P03')],
  feedback: [positive('feedback', 'score-at-threshold', {value: 3}), positive('feedback', 'score-above-threshold', {value: 8, targetLast: true}),
    positive('feedback', 'score-below-threshold', {value: 2}), positive('feedback', 'score-zero', {value: 0}),
    positive('feedback', 'score-negative', {value: -4}), negative('different-raiser', 'P01'),
    negative('wrong-ground-role', 'P02'), negative('not-finished', 'P03')],
};
