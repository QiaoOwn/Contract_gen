import dayjs from 'dayjs';
import {
  evaluateDefinition,
  l,
  OCLExecutionTrace,
  OCLStateSnapshot,
  PostconditionError,
  PreconditionError,
  StandardOPs,
} from '../globalEntry';
/*Represents a repair task with details including status and related staff.*/
class Repair {
  /*The unique identifier of the repair task*/
  Id: number;
  /*The name of the repair task*/
  Repairname: string;
  /*Estimated cost of the repair*/
  Price: number;
  /*Description of the repair task*/
  Description: string;
  /*Feedback score for the repair (1-5)*/
  Score: number;
  /*Date of the failure that triggered repair*/
  FailTime: dayjs.Dayjs;
  /*Indicates if the repair is closed*/
  Close: boolean;
  /*Current status of the repair process*/
  Process: number;
  /*Final result or outcome of the repair*/
  Result: string;
  /*List of approval actions for the repair task*/
  History: ApprovalHistory[];
  /*The device associated with this repair task*/
  RelatedDevice: Device;
  /*The staff who raised the repair request*/
  RaiseStaff: Staff;
}
/*Represents a staff member within the system.*/
class Staff {
  /*The unique identifier for a staff member*/
  Id: number;
  /*The name of the staff member*/
  Name: string;
  /*Password for the staff member's login*/
  Password: string;
  /*Contact number of the staff member*/
  Phone: string;
  /*Role ID of the staff member (e.g., Ground Staff, Manager)*/
  Role: number;
  /*Reference to the boss of the staff member*/
  Boss: Staff;
}
/*Represents a device in the airport management system.*/
class Device {
  /*The unique identifier for the device*/
  Id: number;
  /*Name of the device*/
  Name: string;
  /*Location of the device*/
  Location: string;
  /*The staff member responsible for the device*/
  Contacts: Staff;
}
/*Tracks approval or rejection history for repair tasks.*/
class ApprovalHistory {
  /*The unique identifier for an approval history record*/
  Id: number;
  /*ID of the staff who made the approval or rejection*/
  StaffId: number;
  /*Indicates if the action was a rejection*/
  Reject: boolean;
  /*Suggestions or comments from the approving staff*/
  Suggestion: string;
}
const map = new Map();
map.set(Repair, []);
map.set(Staff, []);
map.set(Device, []);
map.set(ApprovalHistory, []);
const getRepository = <T>(clazz: new (...args: any[]) => T) => {
  return map.get(clazz) as T[];
};
export {Repair, Staff, Device, ApprovalHistory, getRepository};

class RepairService {
  /*Definition: A Staff member records an approval decision for a Repair by creating an ApprovalHistory entry, including whether it is rejected and any Suggestion.
   *Precondition: The Repair and Staff referenced by rid and sid exist.
   *Postcondition: A new ApprovalHistory is added to Repair.History with Reject and Suggestion set from the input. The Repair.Process is updated to reflect the next stage when the decision is not rejected; otherwise it moves to the rejected stage.*/
  approve(sid: number, rid: number, reject: boolean, suggestion: string): ApprovalHistory {
    /*Definition Start*/
    let rep: Repair = evaluateDefinition(
      () =>
        l({
          logic: () =>
            getRepository(Repair).find(
              (u: Repair) =>
                l({
                  logic: () => StandardOPs.oclEquals(u.Id, rid),
                  description: 'u.Id=rid',
                }).build().pass
            ),
          description: 'Repair.allInstances()->any(u:Repair|u.Id=rid)',
        }).build().pass
    );
    let sta: Staff = evaluateDefinition(
      () =>
        l({
          logic: () =>
            getRepository(Staff).find(
              (uu: Staff) =>
                l({
                  logic: () => StandardOPs.oclEquals(uu.Id, sid),
                  description: 'uu.Id=sid',
                }).build().pass
            ),
          description: 'Staff.allInstances()->any(uu:Staff|uu.Id=sid)',
        }).build().pass
    );
    /*Definition End*/

    /*Precondition Start*/
    const {errorMessage: preconditionErrorMessage, pass: isPreconditionPass} = l({
      logic: () => StandardOPs.oclEquals(StandardOPs.oclIsUndefined(rep), false),
      description: 'rep.oclIsUndefined()=false',
    })
      .and({
        logic: () => StandardOPs.oclEquals(StandardOPs.oclIsUndefined(sta), false),
        description: 'sta.oclIsUndefined()=false',
      })
      .build();
    if (!isPreconditionPass) {
      throw new PreconditionError(preconditionErrorMessage);
    }
    /*Precondition End*/

    /*OCL Pre-state Snapshot*/
    const oclState = new OCLStateSnapshot(map, [this]);
    /*OCL Effect Trace*/
    const oclExecutionTrace = new OCLExecutionTrace();
    const result = (() => {
      /*Postcondition Effects Start*/
      let ah: ApprovalHistory;
      return l({
        execute: () => (ah = new ApprovalHistory()),
        description: 'ah.oclIsNew()',
      })
        .and({
          execute: () => (ah.Reject = reject),
          description: 'ah.Reject=reject',
        })
        .and({
          execute: () => (ah.Suggestion = suggestion),
          description: 'ah.Suggestion=suggestion',
        })
        .and({
          execute: () => StandardOPs.includeIfAbsent(getRepository(ApprovalHistory), ah),
          description: 'ApprovalHistory.allInstances()->includes(ah)',
        })
        .and({
          execute: () => StandardOPs.includeIfAbsent(rep.History, ah),
          description: 'rep.History->includes(ah)',
        })
        .if({
          logic: () =>
            l({
              logic: () => !StandardOPs.oclEquals(reject, false),
              description: 'reject<>false',
            }),
          description: 'reject<>false',
          then: l().if({
            logic: () =>
              l({
                logic: () => StandardOPs.oclEquals(rep.Process, 0),
                description: 'rep.Process=0',
              }).and({
                logic: () => StandardOPs.oclEquals(sta.Role, 1),
                description: 'sta.Role=1',
              }),
            description: 'rep.Process=0andsta.Role=1',
            then: l({
              execute: () => (rep.Process = 1),
              description: 'rep.Process=1',
            }),
            else: l().if({
              logic: () =>
                l({
                  logic: () => StandardOPs.oclEquals(rep.Process, 1),
                  description: 'rep.Process=1',
                }).and({
                  logic: () => StandardOPs.oclEquals(sta.Role, 2),
                  description: 'sta.Role=2',
                }),
              description: 'rep.Process=1andsta.Role=2',
              then: l({
                execute: () => (rep.Process = 2),
                description: 'rep.Process=2',
              }),
              else: l().if({
                logic: () =>
                  l({
                    logic: () => StandardOPs.oclEquals(rep.Process, 2),
                    description: 'rep.Process=2',
                  }).and({
                    logic: () => StandardOPs.oclEquals(sta.Role, 3),
                    description: 'sta.Role=3',
                  }),
                description: 'rep.Process=2andsta.Role=3',
                then: l({
                  execute: () => (rep.Process = 3),
                  description: 'rep.Process=3',
                }),
              }),
            }),
          }),
          else: l({
            execute: () => (rep.Process = 5),
            description: 'rep.Process=5',
          }),
        })
        .and({
          execute: () => StandardOPs.includeIfAbsent(getRepository(Repair), rep),
          description: 'Repair.allInstances()->includes(rep)',
        })
        .and({
          execute: () => ah,
          description: 'result=ah',
        })
        .build().value;
      /*Postcondition Effects End*/
    })();
    /*OCL Post-state Snapshot*/
    oclState.capturePost();
    const {errorMessage: postconditionErrorMessage, pass: isPostconditionPass} = (() => {
      /*Postcondition Check Start*/
      let ah: ApprovalHistory = oclState.findNew(ApprovalHistory);
      return l({
        logic: () => oclState.isNew(ah, ApprovalHistory),
        description: 'ah.oclIsNew()',
      })
        .and({
          logic: () => StandardOPs.oclEquals(ah.Reject, reject),
          description: 'ah.Reject=reject',
        })
        .and({
          logic: () => StandardOPs.oclEquals(ah.Suggestion, suggestion),
          description: 'ah.Suggestion=suggestion',
        })
        .and({
          logic: () => StandardOPs.includes(getRepository(ApprovalHistory), ah),
          description: 'ApprovalHistory.allInstances()->includes(ah)',
        })
        .and({
          logic: () => StandardOPs.includes(rep.History, ah),
          description: 'rep.History->includes(ah)',
        })
        .if({
          logic: () =>
            l({
              logic: () => !StandardOPs.oclEquals(reject, false),
              description: 'reject<>false',
            }),
          description: 'reject<>false',
          then: l().if({
            logic: () =>
              l({
                logic: () => StandardOPs.oclEquals(rep.Process, 0),
                description: 'rep.Process=0',
              }).and({
                logic: () => StandardOPs.oclEquals(sta.Role, 1),
                description: 'sta.Role=1',
              }),
            description: 'rep.Process=0andsta.Role=1',
            then: l({
              logic: () => StandardOPs.oclEquals(rep.Process, 1),
              description: 'rep.Process=1',
            }),
            else: l().if({
              logic: () =>
                l({
                  logic: () => StandardOPs.oclEquals(rep.Process, 1),
                  description: 'rep.Process=1',
                }).and({
                  logic: () => StandardOPs.oclEquals(sta.Role, 2),
                  description: 'sta.Role=2',
                }),
              description: 'rep.Process=1andsta.Role=2',
              then: l({
                logic: () => StandardOPs.oclEquals(rep.Process, 2),
                description: 'rep.Process=2',
              }),
              else: l().if({
                logic: () =>
                  l({
                    logic: () => StandardOPs.oclEquals(rep.Process, 2),
                    description: 'rep.Process=2',
                  }).and({
                    logic: () => StandardOPs.oclEquals(sta.Role, 3),
                    description: 'sta.Role=3',
                  }),
                description: 'rep.Process=2andsta.Role=3',
                then: l({
                  logic: () => StandardOPs.oclEquals(rep.Process, 3),
                  description: 'rep.Process=3',
                }),
              }),
            }),
          }),
          else: l({
            logic: () => StandardOPs.oclEquals(rep.Process, 5),
            description: 'rep.Process=5',
          }),
        })
        .and({
          logic: () => StandardOPs.includes(getRepository(Repair), rep),
          description: 'Repair.allInstances()->includes(rep)',
        })
        .and({
          logic: () => StandardOPs.oclEquals(result, ah),
          description: 'result=ah',
        })
        .build();
      /*Postcondition Check End*/
    })();
    if (!isPostconditionPass) {
      throw new PostconditionError(postconditionErrorMessage);
    }
    return result;
  }
}
export {RepairService};
