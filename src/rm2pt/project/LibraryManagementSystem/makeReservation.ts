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
    name: 'makeReservation',
    description: `Definition: The makeReservation operation handles its intended business action in this system.
    Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
    Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.`,
    parameters: [
      new Parameter({name: 'uid', type: 'String'}),
      new Parameter({name: 'barcode', type: 'String'}),
    ],
    returnType: new ReturnedType('Boolean'),
    definition: `
    user:User = User.allInstance()->any(u:User | u.UserID = uid),
    copy:BookCopy = BookCopy.allInstance()->any(bc:BookCopy | bc.Barcode = barcode)`,
    precondition: `
    user.oclIsUndefined() = false and
    copy.oclIsUndefined() = false and
    copy.Status = CopyStatus::LOANED and
    copy.IsReserved = false`,
    postcondition: `
    let res:Reserve in
    res.oclIsNew() and
    copy.IsReserved = true and
    res.IsReserveClosed = false and
    res.ReserveDate.isEqual(Today) and
    res.ReservedUser = user and
    res.ReservedCopy = copy and
    user.ReservedBook->includes(res) and
    copy.ReservationRecord->includes(res) and
    Reserve.allInstance()->includes(res) and
    result = true`,
  }),
];

const service = new Service({
  name: 'LibraryManagementSystemSystem',
  operations,
});

const useCase = new UseCase({
  name: 'makeReservation',
  description: 'The user makes a book reservation',
  relatedService: service,
  systemService,
  involvedActors: actors,
});

export default useCase;
