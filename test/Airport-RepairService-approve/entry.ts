import dayjs from 'dayjs';
import {l, PreconditionError, StandardOPs} from '../globalEntry';
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
  /*find the repair with provided repair id and staff with provided staff id and
   *if the repair and staff are exist then save a new approval history with provided info
   *and if it is not reject if the process status is 0 and the role is 1, set the process to 1
   *if the process status is 1 and the role is 2 then set tht process to 2
   *if the process status is 2 and the role is 3 then set the process to 3
   *if it is rejected, set the process to 5, finally save the repair instance*/
  approve(sid: number, rid: number, reject: boolean, suggestion: string): ApprovalHistory {
    /*Definition Start*/
    let rep: Repair = l({
      logic: () =>
        getRepository(Repair).find(
          (u: Repair) =>
            l({
              logic: () => u.Id === rid,
              description: 'u.Id=rid',
            }).build().pass
        ),
      description: 'Repair.allInstance()->any(u:Repair|u.Id=rid)',
    }).build().pass;
    let sta: Staff = l({
      logic: () =>
        getRepository(Staff).find(
          (uu: Staff) =>
            l({
              logic: () => uu.Id === sid,
              description: 'uu.Id=sid',
            }).build().pass
        ),
      description: 'Staff.allInstance()->any(uu:Staff|uu.Id=sid)',
    }).build().pass;
    /*Definition End*/

    /*Precondition Start*/
    const {errorMessage: preconditionErrorMessage, pass: isPreconditionPass} = l({
      logic: () => StandardOPs.oclIsUndefined(rep) === false,
      description: 'rep.oclIsUndefined()=false',
    })
      .and({
        logic: () => StandardOPs.oclIsUndefined(sta) === false,
        description: 'sta.oclIsUndefined()=false',
      })
      .build();
    if (!isPreconditionPass) {
      throw new PreconditionError(preconditionErrorMessage);
    }
    /*Precondition End*/

    /*Postcondition Start*/
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
        execute: () => getRepository(ApprovalHistory).push(ah),
        description: 'ApprovalHistory.allInstance()->includes(ah)',
      })
      .and({
        execute: () => rep.History.push(ah),
        description: 'rep.History->includes(ah)',
      })
      .if({
        logic: () =>
          l({
            logic: () => reject !== false,
            description: 'reject<>false',
          }),
        description: 'reject<>false',
        then: l().if({
          logic: () =>
            l({
              logic: () => rep.Process === 0,
              description: 'rep.Process=0',
            }).and({
              logic: () => sta.Role === 1,
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
                logic: () => rep.Process === 1,
                description: 'rep.Process=1',
              }).and({
                logic: () => sta.Role === 2,
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
                  logic: () => rep.Process === 2,
                  description: 'rep.Process=2',
                }).and({
                  logic: () => sta.Role === 3,
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
        execute: () => getRepository(Repair).push(rep),
        description: 'Repair.allInstance()->includes(rep)',
      })
      .and({
        execute: () => ah,
        description: 'result=ah',
      })
      .build().value;
    /*Postcondition End*/
  }
}
export {RepairService};
