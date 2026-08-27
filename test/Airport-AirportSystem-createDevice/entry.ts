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
  /*Definition: In daily airport operations, when a new device is installed (for example in a terminal area or support zone), the admin adds it to the system and assigns a responsible staff contact.
   *Precondition: This device ID has not been used before, and the selected contact is already a registered staff member in the airport organization.
   *Postcondition: A new Device is created with Id, Name, and Location, and its Contacts points to the chosen Staff. The device can then be searched and referenced consistently by its Id and location.*/
  createDevice(id: number, name: string, location: string, contactsid: number): boolean {
    /*Definition Start*/
    let dev: Device = evaluateDefinition(
      () =>
        l({
          logic: () =>
            getRepository(Device).find(
              (u: Device) =>
                l({
                  logic: () => StandardOPs.oclEquals(u.Id, id),
                  description: 'u.Id=id',
                }).build().pass
            ),
          description: 'Device.allInstances()->any(u:Device|u.Id=id)',
        }).build().pass
    );
    let sta: Staff = evaluateDefinition(
      () =>
        l({
          logic: () =>
            getRepository(Staff).find(
              (uu: Staff) =>
                l({
                  logic: () => StandardOPs.oclEquals(uu.Id, contactsid),
                  description: 'uu.Id=contactsid',
                }).build().pass
            ),
          description: 'Staff.allInstances()->any(uu:Staff|uu.Id=contactsid)',
        }).build().pass
    );
    /*Definition End*/

    /*Precondition Start*/
    const {errorMessage: preconditionErrorMessage, pass: isPreconditionPass} = l({
      logic: () => StandardOPs.oclEquals(StandardOPs.oclIsUndefined(dev), true),
      description: 'dev.oclIsUndefined()=true',
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
      let d: Device;
      return l({
        execute: () => (d = new Device()),
        description: 'd.oclIsNew()',
      })
        .and({
          execute: () => (d.Id = id),
          description: 'd.Id=id',
        })
        .and({
          execute: () => (d.Name = name),
          description: 'd.Name=name',
        })
        .and({
          execute: () => (d.Location = location),
          description: 'd.Location=location',
        })
        .and({
          execute: () => (d.Contacts = sta),
          description: 'd.Contacts=sta',
        })
        .and({
          execute: () => StandardOPs.includeIfAbsent(getRepository(Device), d),
          description: 'Device.allInstances()->includes(d)',
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
      let d: Device = oclState.findNew(Device);
      return l({
        logic: () => oclState.isNew(d, Device),
        description: 'd.oclIsNew()',
      })
        .and({
          logic: () => StandardOPs.oclEquals(d.Id, id),
          description: 'd.Id=id',
        })
        .and({
          logic: () => StandardOPs.oclEquals(d.Name, name),
          description: 'd.Name=name',
        })
        .and({
          logic: () => StandardOPs.oclEquals(d.Location, location),
          description: 'd.Location=location',
        })
        .and({
          logic: () => StandardOPs.oclEquals(d.Contacts, sta),
          description: 'd.Contacts=sta',
        })
        .and({
          logic: () => StandardOPs.includes(getRepository(Device), d),
          description: 'Device.allInstances()->includes(d)',
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
