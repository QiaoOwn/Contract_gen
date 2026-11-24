import systemService from './systemService';
import {Operation} from '../../model/Operation';
import {Parameter} from '../../model/Parameter';
import {ReturnedType} from '../../model/ReturnedType';
import {Service} from '../../model/Service';
import {UseCase} from '../../model/UseCase';
import {Admin} from './actor';
import {TempVariable} from '@/rm2pt/model/TempVariable';

const actors = [Admin];

const tempVariables: TempVariable[] = [];

const operations = [
  new Operation({
    name: 'createDevice',
    description: `Definition: In daily airport operations, when a new device is installed (for example in a terminal area or support zone), the admin adds it to the system and assigns a responsible staff contact.
    Precondition: This device ID has not been used before, and the selected contact is already a registered staff member in the airport organization.
    Postcondition: A new Device is created with Id, Name, and Location, and its Contacts points to the chosen Staff. The device can then be searched and referenced consistently by its Id and location.`,
    parameters: [
      new Parameter({name: 'id', type: 'Integer'}),
      new Parameter({name: 'name', type: 'String'}),
      new Parameter({name: 'location', type: 'String'}),
      new Parameter({name: 'contactsid', type: 'Integer'}),
    ],
    returnType: new ReturnedType('Boolean'),
    definition: `dev:Device = Device.allInstances()->any(u:Device | u.Id = id),
                 sta:Staff = Staff.allInstances()->any(uu:Staff | uu.Id = contactsid)`,
    precondition: `dev.oclIsUndefined() = true and sta.oclIsUndefined() = false`,
    postcondition: `let d:Device in
                     d.oclIsNew() and
                     d.Id = id and
                     d.Name = name and
                     d.Location = location and
                     d.Contacts = sta and
                     Device.allInstances()->includes(d) and result = true`,
  }),
];

const service = new Service({
  name: 'AirportSystem',
  operations,
  tempVariables,
});

const useCase = new UseCase({
  name: 'manageDevice',
  description: 'Admin manages devices by creating, updating, or deleting device information.',
  relatedService: service,
  systemService,
  involvedActors: actors,
});

export default useCase;
