import systemService from './systemService';
import {Operation} from '../../model/Operation';
import {Parameter} from '../../model/Parameter';
import {ReturnedType} from '../../model/ReturnedType';
import {Service} from '../../model/Service';
import {UseCase} from '../../model/UseCase';
import {User} from './actor';

const actors = [User];

const operations = [
  new Operation({
    name: 'cancelReservation',
    description: `Definition: The cancelReservation operation handles its intended business action in this system.
    Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
    Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.`,
    parameters: [
      new Parameter({name: 'uid', type: 'String'}),
      new Parameter({name: 'barcode', type: 'String'}),
    ],
    returnType: new ReturnedType('Boolean'),
    definition: `
    user:User = User.allInstance()->any(u:User | u.UserID = uid),
    copy:BookCopy = BookCopy.allInstance()->any(bc:BookCopy | bc.Barcode = barcode),
    res:Reserve = Reserve.allInstance()->any(r:Reserve | r.ReservedCopy = copy and r.ReservedUser = user)`,
    precondition: `
    user.oclIsUndefined() = false and
    copy.oclIsUndefined() = false and
    copy.Status = CopyStatus::LOANED and
    copy.IsReserved = true and
    res.oclIsUndefined() = false and
    res.IsReserveClosed = false`,
    postcondition: `
    copy.IsReserved = false and
    res.IsReserveClosed = true and
    result = true`,
  }),
];

const service = new Service({
  name: 'LibraryManagementSystemSystem',
  operations,
});

const useCase = new UseCase({
  name: 'cancelReservation',
  description: 'The user cancels reservation',
  relatedService: service,
  systemService,
  involvedActors: actors,
});

export default useCase;
