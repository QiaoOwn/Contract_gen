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
  /*Definition: A Staff member marks a Repair as finished for a specific Device and records the result text.
   *Precondition: The Device.Contacts is the given Staff, and the Staff.Role indicates a Worker.
   *Postcondition: The Repair.Process is set to the finished state and the operation returns true.*/
  finishRepair(id: number, sid: number, did: number, res: string): boolean {
    /*Definition Start*/
    let rep: Repair = evaluateDefinition(
      () =>
        l({
          logic: () =>
            getRepository(Repair).find(
              (u: Repair) =>
                l({
                  logic: () => StandardOPs.oclEquals(u.Id, id),
                  description: 'u.Id=id',
                }).build().pass
            ),
          description: 'Repair.allInstances()->any(u:Repair|u.Id=id)',
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
    let dev: Device = evaluateDefinition(
      () =>
        l({
          logic: () =>
            getRepository(Device).find(
              (uuu: Device) =>
                l({
                  logic: () => StandardOPs.oclEquals(uuu.Id, did),
                  description: 'uuu.Id=did',
                }).build().pass
            ),
          description: 'Device.allInstances()->any(uuu:Device|uuu.Id=did)',
        }).build().pass
    );
    /*Definition End*/

    /*Precondition Start*/
    const {errorMessage: preconditionErrorMessage, pass: isPreconditionPass} = l({
      logic: () => StandardOPs.oclEquals(dev.Contacts, sta),
      description: 'dev.Contacts=sta',
    })
      .and({
        logic: () => StandardOPs.oclEquals(sta.Role, 3),
        description: 'sta.Role=3',
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
      return l({
        execute: () => (rep.Process = 7),
        description: 'rep.Process=7',
      })
        .and({
          execute: () => true,
          description: 'result=true',
        })
        .build().value;
      /*Postcondition Effects End*/
    })();
    /*OCL Post-state Snapshot*/
    oclState.capturePost();
    const {errorMessage: postconditionErrorMessage, pass: isPostconditionPass} = (() => {
      /*Postcondition Check Start*/
      return l({
        logic: () => StandardOPs.oclEquals(rep.Process, 7),
        description: 'rep.Process=7',
      })
        .and({
          logic: () => StandardOPs.oclEquals(result, true),
          description: 'result=true',
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
