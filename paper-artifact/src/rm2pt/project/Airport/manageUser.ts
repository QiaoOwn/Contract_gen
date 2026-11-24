import {TempVariable} from '@/rm2pt/model/TempVariable';
import systemService from './systemService';
import {Operation} from '../../model/Operation';
import {Parameter} from '../../model/Parameter';
import {ReturnedType} from '../../model/ReturnedType';
import {Service} from '../../model/Service';
import {UseCase} from '../../model/UseCase';
import {Admin} from './actor';

const actors = [Admin];

const tempVariables: TempVariable[] = [];

const operations = [
  new Operation({
    name: 'createStaff',
    description: `Definition: When the airport adds a new Staff member, the admin records their basic information so the person can be identified and contacted, and their Role and reporting line are clear.
    Precondition: The staff ID is unique and not already assigned to an existing employee.
    Postcondition: A new Staff is created with Id, Name, Password, Phone, and Role. If a Boss is provided and exists, the Staff is linked to that Boss, so the organizational relationship is established.`,
    parameters: [
      new Parameter({name: 'id', type: 'Integer'}),
      new Parameter({name: 'name', type: 'String'}),
      new Parameter({name: 'pswd', type: 'String'}),
      new Parameter({name: 'phone', type: 'String'}),
      new Parameter({name: 'role', type: 'Integer'}),
      new Parameter({name: 'bossid', type: 'Integer'}),
    ],
    returnType: new ReturnedType('Boolean'),
    definition: `sta:Staff = Staff.allInstances()->any(u:Staff | u.Id = id),
                 bo:Staff = Staff.allInstances()->any(uu:Staff | uu.Id = bossid)`,
    precondition: `sta.oclIsUndefined() = true`,
    postcondition: `let s:Staff in
                     s.oclIsNew() and
                     s.Id = id and
                     s.Name = name and
                     s.Password = pswd and
                     s.Phone = phone and
                     s.Role = role and
                     if bo.oclIsUndefined() = false then s.Boss = bo endif and
                     Staff.allInstances()->includes(s) and result = true`,
  }),
];

const service = new Service({
  name: 'AirportSystem',
  operations,
  tempVariables,
});

const useCase = new UseCase({
  name: 'manageUser',
  description: 'Admin manages users by creating, updating, or deleting staff information.',
  relatedService: service,
  systemService,
  involvedActors: actors,
});

export default useCase;
