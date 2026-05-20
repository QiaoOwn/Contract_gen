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
  /*find the repair, staff and device with provided id, sid, did,
   *if the device's contact is the staff and the staff role is 3, the repair process should be 7*/
  finishRepair(id: number, sid: number, did: number, res: string): boolean {
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
    let dev: Device = l({
      logic: () =>
        getRepository(Device).find(
          (uuu: Device) =>
            l({
              logic: () => uuu.Id === did,
              description: 'uuu.Id=did',
            }).build().pass
        ),
      description: 'Device.allInstance()->any(uuu:Device|uuu.Id=did)',
    }).build().pass;
    /*Definition End*/

    /*Precondition Start*/
    const {errorMessage: preconditionErrorMessage, pass: isPreconditionPass} = l({
      logic: () => dev.Contacts === sta,
      description: 'dev.Contacts=sta',
    })
      .and({
        logic: () => sta.Role === 3,
        description: 'sta.Role=3',
      })
      .build();
    if (!isPreconditionPass) {
      throw new PreconditionError(preconditionErrorMessage);
    }
    /*Precondition End*/

    /*Postcondition Start*/
    return l({
      execute: () => (rep.Process = 7),
      description: 'rep.Process=7',
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
