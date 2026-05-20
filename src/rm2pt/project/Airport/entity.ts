import {Attribute} from '../../model/Attribute';
import {Entity} from '../../model/Entity';
import {Relationship} from '../../model/Relationship';

export default {
  Repair: new Entity({
    name: 'Repair',
    description: 'Represents a repair task with details including status and related staff.',
    attributes: [
      new Attribute({
        name: 'Id',
        type: 'Integer',
        description: 'The unique identifier of the repair task',
      }),
      new Attribute({
        name: 'Repairname',
        type: 'String',
        description: 'The name of the repair task',
      }),
      new Attribute({
        name: 'Price',
        type: 'Integer',
        description: 'Estimated cost of the repair',
      }),
      new Attribute({
        name: 'Description',
        type: 'String',
        description: 'Description of the repair task',
      }),
      new Attribute({
        name: 'Score',
        type: 'Integer',
        description: 'Feedback score for the repair (1-5)',
      }),
      new Attribute({
        name: 'FailTime',
        type: 'Date',
        description: 'Date of the failure that triggered repair',
      }),
      new Attribute({
        name: 'Close',
        type: 'Boolean',
        description: 'Indicates if the repair is closed',
      }),
      new Attribute({
        name: 'Process',
        type: 'Integer',
        description: 'Current status of the repair process',
      }),
      new Attribute({
        name: 'Result',
        type: 'String',
        description: 'Final result or outcome of the repair',
      }),
    ],
    relationships: [
      new Relationship({
        name: 'History',
        relatedEntity: 'Set(ApprovalHistory)',
        associationType: 'Association',
        description: 'List of approval actions for the repair task',
      }),
      new Relationship({
        name: 'RelatedDevice',
        relatedEntity: 'Device',
        associationType: 'Association',
        description: 'The device associated with this repair task',
      }),
      new Relationship({
        name: 'RaiseStaff',
        relatedEntity: 'Staff',
        associationType: 'Association',
        description: 'The staff who raised the repair request',
      }),
    ],
  }),
  Staff: new Entity({
    name: 'Staff',
    description: 'Represents a staff member within the system.',
    attributes: [
      new Attribute({
        name: 'Id',
        type: 'Integer',
        description: 'The unique identifier for a staff member',
      }),
      new Attribute({
        name: 'Name',
        type: 'String',
        description: 'The name of the staff member',
      }),
      new Attribute({
        name: 'Password',
        type: 'String',
        description: "Password for the staff member's login",
      }),
      new Attribute({
        name: 'Phone',
        type: 'String',
        description: 'Contact number of the staff member',
      }),
      new Attribute({
        name: 'Role',
        type: 'Integer',
        description: 'Role ID of the staff member (e.g., Ground Staff, Manager)',
      }),
    ],
    relationships: [
      new Relationship({
        name: 'Boss',
        relatedEntity: 'Staff',
        associationType: 'Association',
        description: 'Reference to the boss of the staff member',
      }),
    ],
  }),
  Device: new Entity({
    name: 'Device',
    description: 'Represents a device in the airport management system.',
    attributes: [
      new Attribute({
        name: 'Id',
        type: 'Integer',
        description: 'The unique identifier for the device',
      }),
      new Attribute({
        name: 'Name',
        type: 'String',
        description: 'Name of the device',
      }),
      new Attribute({
        name: 'Location',
        type: 'String',
        description: 'Location of the device',
      }),
    ],
    relationships: [
      new Relationship({
        name: 'Contacts',
        relatedEntity: 'Staff',
        associationType: 'Association',
        description: 'The staff member responsible for the device',
      }),
    ],
  }),
  ApprovalHistory: new Entity({
    name: 'ApprovalHistory',
    description: 'Tracks approval or rejection history for repair tasks.',
    attributes: [
      new Attribute({
        name: 'Id',
        type: 'Integer',
        description: 'The unique identifier for an approval history record',
      }),
      new Attribute({
        name: 'StaffId',
        type: 'Integer',
        description: 'ID of the staff who made the approval or rejection',
      }),
      new Attribute({
        name: 'Reject',
        type: 'Boolean',
        description: 'Indicates if the action was a rejection',
      }),
      new Attribute({
        name: 'Suggestion',
        type: 'String',
        description: 'Suggestions or comments from the approving staff',
      }),
    ],
  }),
};
