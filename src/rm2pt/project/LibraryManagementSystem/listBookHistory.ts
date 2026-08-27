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
    name: 'listBorrowHistory',
    description: `Definition: The listBorrowHistory operation handles its intended business action in this system.
    Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
    Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.`,
    parameters: [new Parameter({name: 'uid', type: 'String'})],
    returnType: new ReturnedType('Set(Loan)'),
    definition: `user:User = User.allInstances()->any(u:User | u.UserID = uid)`,
    precondition: `user.oclIsUndefined() = false`,
    postcondition: `result = user.LoanedBook`,
  }),
  new Operation({
    name: 'listHodingBook',
    description: `Definition: The listHodingBook operation handles its intended business action in this system.
    Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
    Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.`,
    parameters: [new Parameter({name: 'uid', type: 'String'})],
    returnType: new ReturnedType('Set(Loan)'),
    definition: `user:User = User.allInstances()->any(u:User | u.UserID = uid)`,
    precondition: `user.oclIsUndefined() = false`,
    postcondition: `result = user.LoanedBook->select(l:Loan | l.IsReturned = false)`,
  }),
  new Operation({
    name: 'listOverDueBook',
    description: `Definition: The listOverDueBook operation handles its intended business action in this system.
    Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
    Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.`,
    parameters: [new Parameter({name: 'uid', type: 'String'})],
    returnType: new ReturnedType('Set(BookCopy)'),
    definition: `user:User = User.allInstances()->any(u:User | u.UserID = uid),
    loans:Set(Loan) = user.LoanedBook->select(l:Loan | l.IsReturned = false and l.OverDueFee > 0)`,
    precondition: `user.oclIsUndefined() = false and loans.oclIsUndefined() = false`,
    postcondition: `result = loans->collect(l:Loan | l.LoanedCopy)`,
  }),
  new Operation({
    name: 'listReservationBook',
    description: `Definition: The listReservationBook operation handles its intended business action in this system.
    Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
    Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.`,
    parameters: [new Parameter({name: 'uid', type: 'String'})],
    returnType: new ReturnedType('Set(BookCopy)'),
    definition: `user:User = User.allInstances()->any(u:User | u.UserID = uid),
    res:Set(Reserve) = user.ReservedBook`,
    precondition: `user.oclIsUndefined() = false and res.oclIsUndefined() = false`,
    postcondition: `result = res->collect(r:Reserve | r.ReservedCopy)`,
  }),
  new Operation({
    name: 'listRecommendBook',
    description: `Definition: The listRecommendBook operation handles its intended business action in this system.
    Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
    Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.`,
    parameters: [new Parameter({name: 'uid', type: 'String'})],
    returnType: new ReturnedType('Set(RecommendBook)'),
    definition: `user:User = User.allInstances()->any(u:User | u.UserID = uid),
    rBooks:Set(RecommendBook) = user.RecommendedBook`,
    precondition: `user.oclIsUndefined() = false and rBooks.oclIsUndefined() = false`,
    postcondition: `result = rBooks`,
  }),
];

const service = new Service({
  name: 'ListBookHistory',
  operations,
});

const useCase = new UseCase({
  name: 'listBookHistory',
  description: 'The user views book history',
  relatedService: service,
  systemService,
  involvedActors: actors,
});

export default useCase;
