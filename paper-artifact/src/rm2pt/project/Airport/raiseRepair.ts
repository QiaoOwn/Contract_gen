import {ReturnedType} from '../../model/ReturnedType';
import {Level, Operation} from '../../model/Operation';
import {Service} from '../../model/Service';
import {UseCase} from '../../model/UseCase';
import {GroundStaff, Manager, Master} from './actor';
import {Parameter} from '../../model/Parameter';
import {TempVariable} from '@/rm2pt/model/TempVariable';
import systemService from './systemService';

const actors = [GroundStaff, Manager, Master];

const tempVariables: TempVariable[] = [];

const operations = [
  new Operation({
    name: 'approve',
    description: `Definition: A Staff member records an approval decision for a Repair by creating an ApprovalHistory entry, including whether it is rejected and any Suggestion.
    Precondition: The Repair and Staff referenced by rid and sid exist.
    Postcondition: A new ApprovalHistory is added to Repair.History with Reject and Suggestion set from the input. The Repair.Process is updated to reflect the next stage when the decision is not rejected; otherwise it moves to the rejected stage.`,
    parameters: [
      new Parameter({name: 'sid', type: 'Integer'}),
      new Parameter({name: 'rid', type: 'Integer'}),
      new Parameter({name: 'reject', type: 'Boolean'}),
      new Parameter({name: 'suggestion', type: 'String'}),
    ],
    returnType: new ReturnedType('ApprovalHistory'),
    definition: `rep:Repair = Repair.allInstances()->any(u:Repair | u.Id = rid),
                 sta:Staff = Staff.allInstances()->any(uu:Staff | uu.Id = sid)`,
    precondition: `rep.oclIsUndefined() = false and sta.oclIsUndefined() = false`,
    postcondition: `let ah:ApprovalHistory in
			ah.oclIsNew() and
			ah.Reject = reject and
			ah.Suggestion = suggestion and
			ApprovalHistory.allInstances()->includes(ah) and
			rep.History->includes(ah) and
			if
				reject <> false
			then
				if
					rep.Process = 0 and // STAFFREQUEST
					sta.Role = 1 // MASTER
				then
					rep.Process = 1 // MASTERAPPROVE
				else
					if
						rep.Process = 1 and // MASTERAPPROVE
						sta.Role = 2 // MANAGER
					then
						rep.Process = 2 // MANAGERAPPROVE
					else
						if
							rep.Process = 2 and // MANAGERAPPROVE
							sta.Role = 3 // WORKER
						then
							rep.Process = 3 // WORKERAPPROVE
						endif
					endif
				endif
			else
				rep.Process = 5 // REJECT
			endif and
			Repair.allInstances()->includes(rep) and
			result = ah`,
    level: Level.Hard,
  }),
  new Operation({
    name: 'finishRepair',
    description: `Definition: A Staff member marks a Repair as finished for a specific Device and records the result text.
    Precondition: The Device.Contacts is the given Staff, and the Staff.Role indicates a Worker.
    Postcondition: The Repair.Process is set to the finished state and the operation returns true.`,
    parameters: [
      new Parameter({name: 'id', type: 'Integer'}),
      new Parameter({name: 'sid', type: 'Integer'}),
      new Parameter({name: 'did', type: 'Integer'}),
      new Parameter({name: 'res', type: 'String'}),
    ],
    returnType: new ReturnedType('Boolean'),
    definition: `rep:Repair = Repair.allInstances()->any(u:Repair | u.Id = id),
                 sta:Staff = Staff.allInstances()->any(uu:Staff | uu.Id = sid),
                 dev:Device = Device.allInstances()->any(uuu:Device | uuu.Id = did)`,
    precondition: `dev.Contacts = sta and sta.Role = 3`,
    postcondition: `rep.Process = 7 and result = true`, // FINISH
  }),
  new Operation({
    name: 'feedback',
    description: `Definition: The Staff who raised a Repair provides a Score and optional Description as feedback.
    Precondition: The Repair.RaiseStaff is the given Staff, the Staff.Role indicates GroundStaff, and the Repair is in the finished state.
    Postcondition: The Repair.Score is updated. If the Score is high enough the Repair.Close becomes true; otherwise the Repair remains open, its Description may be updated, and the Repair.Process returns to the initial stage.`,
    parameters: [
      new Parameter({name: 'id', type: 'Integer'}),
      new Parameter({name: 'sid', type: 'Integer'}),
      new Parameter({name: 'score', type: 'Integer'}),
      new Parameter({name: 'des', type: 'String'}),
    ],
    returnType: new ReturnedType('Boolean'),
    definition: `rep:Repair = Repair.allInstances()->any(u:Repair | u.Id = id),
                 sta:Staff = Staff.allInstances()->any(uu:Staff | uu.Id = sid)`,
    precondition: `rep.RaiseStaff = sta and sta.Role = 0 and rep.Process = 7`, // FINISH
    postcondition: `rep.Score = score and
                    if score >= 3 then rep.Close = true
                    else rep.Close = false and rep.Description = des and rep.Process = 0 endif and
                    Repair.allInstances()->includes(rep) and result = true`,
    level: Level.Hard,
  }),
];

const service = new Service({
  name: 'RepairService',
  operations,
  tempVariables,
});

const useCase = new UseCase({
  name: 'raiseRepair',
  description:
    'GroundStaff raises a repair request, going through multi-level approvals from Manager and Master.',
  relatedService: service,
  systemService,
  involvedActors: actors,
});

export default useCase;
