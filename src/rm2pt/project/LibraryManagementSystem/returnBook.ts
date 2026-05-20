import systemService from './systemService';
import {Operation} from '../../model/Operation';
import {Service} from '../../model/Service';
import {UseCase} from '../../model/UseCase';
import {Librarian} from './actor';

const actors = [Librarian];

const operations: Operation[] = [
  // new Operation({
  //   name: 'returnBook',
  //   description:
  //     "The librarian records the return of a book, updating the status of the book copy and user's loan record.",
  //   parameters: [new Parameter({name: 'barcode', type: 'String'})],
  //   returnType: new ReturnedType('Boolean'),
  //   definition: `copy:BookCopy = BookCopy.allInstance()->any(bc:BookCopy | bc.Barcode = barcode and bc.Status = CopyStatus::LOANED),
  // 		loan:Loan = Loan.allInstance()->any(l:Loan | l.LoanedCopy = copy and l.IsReturned = false),
  // 		loans:Set(Loan) = Loan.allInstance()->select(l:Loan | l.LoanedUser = loan.LoanedUser and l.IsReturned = false and l.DueDate.isAfter(Today)),
  // 		res:Reserve = copy.ReservationRecord->any(r:Reserve | r.ReservedCopy = copy)`,
  //   precondition: `copy.oclIsUndefined() = false and
  // 		loan.oclIsUndefined() = false`,
  //   postcondition: `loan.LoanedUser.LoanedNumber = loan.LoanedUser.LoanedNumber@pre - 1 and
  // 		loan.IsReturned = true and
  // 		loan.ReturnDate = Today and
  // 		if
  // 			copy.IsReserved = true
  // 		then
  // 			copy.Status = CopyStatus::ONHOLDSHELF and
  // 			sendNotificationEmail(res.ReservedUser.Email)
  // 		else
  // 			copy.Status = CopyStatus::AVAILABLE
  // 		endif and
  // 		result = true`,
  // }),
];

const service = new Service({
  name: 'LibraryManagementSystemSystem',
  operations,
});

const useCase = new UseCase({
  name: 'returnBook',
  description:
    "The librarian registers the return of a book, updating both the loan record and the book's availability status.",
  relatedService: service,
  systemService,
  involvedActors: actors,
});

export default useCase;
