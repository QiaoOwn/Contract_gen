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

class AirportSystem {
  /*Definition: When the airport adds a new Staff member, the admin records their basic information so the person can be identified and contacted, and their Role and reporting line are clear.
   *Precondition: The staff ID is unique and not already assigned to an existing employee.
   *Postcondition: A new Staff is created with Id, Name, Password, Phone, and Role. If a Boss is provided and exists, the Staff is linked to that Boss, so the organizational relationship is established.*/
  createStaff(
    id: number,
    name: string,
    pswd: string,
    phone: string,
    role: number,
    bossid: number
  ): boolean {
    /*Definition Start*/
    let sta: Staff = evaluateDefinition(
      () =>
        l({
          logic: () =>
            getRepository(Staff).find(
              (u: Staff) =>
                l({
                  logic: () => StandardOPs.oclEquals(u.Id, id),
                  description: 'u.Id=id',
                }).build().pass
            ),
          description: 'Staff.allInstances()->any(u:Staff|u.Id=id)',
        }).build().pass
    );
    let bo: Staff = evaluateDefinition(
      () =>
        l({
          logic: () =>
            getRepository(Staff).find(
              (uu: Staff) =>
                l({
                  logic: () => StandardOPs.oclEquals(uu.Id, bossid),
                  description: 'uu.Id=bossid',
                }).build().pass
            ),
          description: 'Staff.allInstances()->any(uu:Staff|uu.Id=bossid)',
        }).build().pass
    );
    /*Definition End*/

    /*Precondition Start*/
    const {errorMessage: preconditionErrorMessage, pass: isPreconditionPass} = l({
      logic: () => StandardOPs.oclEquals(StandardOPs.oclIsUndefined(sta), true),
      description: 'sta.oclIsUndefined()=true',
    }).build();
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
      let s: Staff;
      return l({
        execute: () => (s = new Staff()),
        description: 's.oclIsNew()',
      })
        .and({
          execute: () => (s.Id = id),
          description: 's.Id=id',
        })
        .and({
          execute: () => (s.Name = name),
          description: 's.Name=name',
        })
        .and({
          execute: () => (s.Password = pswd),
          description: 's.Password=pswd',
        })
        .and({
          execute: () => (s.Phone = phone),
          description: 's.Phone=phone',
        })
        .and({
          execute: () => (s.Role = role),
          description: 's.Role=role',
        })
        .if({
          logic: () =>
            l({
              logic: () => StandardOPs.oclEquals(StandardOPs.oclIsUndefined(bo), false),
              description: 'bo.oclIsUndefined()=false',
            }),
          description: 'bo.oclIsUndefined()=false',
          then: l({
            execute: () => (s.Boss = bo),
            description: 's.Boss=bo',
          }),
        })
        .and({
          execute: () => StandardOPs.includeIfAbsent(getRepository(Staff), s),
          description: 'Staff.allInstances()->includes(s)',
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
      let s: Staff = oclState.findNew(Staff);
      return l({
        logic: () => oclState.isNew(s, Staff),
        description: 's.oclIsNew()',
      })
        .and({
          logic: () => StandardOPs.oclEquals(s.Id, id),
          description: 's.Id=id',
        })
        .and({
          logic: () => StandardOPs.oclEquals(s.Name, name),
          description: 's.Name=name',
        })
        .and({
          logic: () => StandardOPs.oclEquals(s.Password, pswd),
          description: 's.Password=pswd',
        })
        .and({
          logic: () => StandardOPs.oclEquals(s.Phone, phone),
          description: 's.Phone=phone',
        })
        .and({
          logic: () => StandardOPs.oclEquals(s.Role, role),
          description: 's.Role=role',
        })
        .if({
          logic: () =>
            l({
              logic: () => StandardOPs.oclEquals(StandardOPs.oclIsUndefined(bo), false),
              description: 'bo.oclIsUndefined()=false',
            }),
          description: 'bo.oclIsUndefined()=false',
          then: l({
            logic: () => StandardOPs.oclEquals(s.Boss, bo),
            description: 's.Boss=bo',
          }),
        })
        .and({
          logic: () => StandardOPs.includes(getRepository(Staff), s),
          description: 'Staff.allInstances()->includes(s)',
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
export {AirportSystem};
