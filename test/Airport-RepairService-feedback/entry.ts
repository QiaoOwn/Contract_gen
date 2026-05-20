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
  /*find the repair and  staff with provided id, sid,
   *if the repair raised staff is the staff and the role is 0, and the repair process is 7
   *the repair score is provided score and if the score greater or equal to 3 then close the repair,
   *or the repair shouldn't be closed and the repair descirption should be the des and the repair process is set to 0, and save the repair*/
  feedback(id: number, sid: number, score: number, des: string): boolean {
    /*Definition Start*/
    let rep: Repair = l({
      logic: () =>
        getRepository(Repair).find(
          (u: Repair) =>
            l({
              logic: () => u.Id === id,
              description: 'u.Id=id',
            }).build().pass
        ),
      description: 'Repair.allInstance()->any(u:Repair|u.Id=id)',
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
      logic: () => rep.RaiseStaff === sta,
      description: 'rep.RaiseStaff=sta',
    })
      .and({
        logic: () => sta.Role === 0,
        description: 'sta.Role=0',
      })
      .and({
        logic: () => rep.Process === 7,
        description: 'rep.Process=7',
      })
      .build();
    if (!isPreconditionPass) {
      throw new PreconditionError(preconditionErrorMessage);
    }
    /*Precondition End*/

    /*Postcondition Start*/
    return l({
      execute: () => (rep.Score = score),
      description: 'rep.Score=score',
    })
      .if({
        logic: () =>
          l({
            logic: () => score >= 3,
            description: 'score>=3',
          }),
        description: 'score>=3',
        then: l({
          execute: () => (rep.Close = true),
          description: 'rep.Close=true',
        }),
        else: l({
          execute: () => (rep.Close = false),
          description: 'rep.Close=false',
        })
          .and({
            execute: () => (rep.Description = des),
            description: 'rep.Description=des',
          })
          .and({
            execute: () => (rep.Process = 0),
            description: 'rep.Process=0',
          }),
      })
      .and({
        execute: () => getRepository(Repair).push(rep),
        description: 'Repair.allInstance()->includes(rep)',
      })
      .and({
        execute: () => true,
        description: 'result=true',
      })
      .build().value;
    /*Postcondition End*/
  }
}
export {RepairService};
