import systemService from './systemService';
import {Operation} from '../../model/Operation';
import {Parameter} from '../../model/Parameter';
import {ReturnedType} from '../../model/ReturnedType';
import {Service} from '../../model/Service';
import {UseCase} from '../../model/UseCase';
import {Librarian} from './actor';

const actors = [Librarian];

const operations = [
  new Operation({
    name: 'borrowBook',
    description: `Definition: librarian scans a user ID and a book barcode to process a borrowing request.
    Precondition: The system first checks whether the user exists, is not suspended, and still has borrowing quota.
    Postcondition:Then it confirms the selected copy is available (or reserved for this same user), creates a new loan record, sets the due date by user type, updates book status to loaned, and returns true when the checkout succeeds.`,
    parameters: [
      new Parameter({name: 'uid', type: 'String'}),
      new Parameter({name: 'barcode', type: 'String'}),
    ],
    returnType: new ReturnedType('Boolean'),
    // Include the full definition, precondition, and postcondition from the remodel file
    definition: `
    user:User = User.allInstances()->any(u:User | u.UserID = uid),
    stu:Student = Student.allInstances()->any(s:Student | s.UserID = uid),
    fac:Faculty = Faculty.allInstances()->any(f:Faculty | f.UserID = uid),
    copy:BookCopy = BookCopy.allInstances()->any(bc:BookCopy | bc.Barcode = barcode),
    res:Reserve = Reserve.allInstances()->any(r:Reserve | r.ReservedCopy = copy and r.ReservedUser = user and r.IsReserveClosed = false)`,
    precondition: `
    user.oclIsUndefined() = false and
    copy.oclIsUndefined() = false and
    user.BorrowStatus = BorrowStatus::NORMAL and
    user.SuspensionDays = 0 and
    if
      user.oclIsTypeOf(Student)
    then
      if
        stu.Programme = Programme::BACHELOR
      then
        stu.LoanedNumber < 20
      else
        if
          stu.Programme = Programme::MASTER
        then
          stu.LoanedNumber < 40
        else
          stu.LoanedNumber < 60
        endif
      endif
    else
      fac.LoanedNumber < 60
    endif and
    (copy.Status = CopyStatus::AVAILABLE or
      (copy.Status = CopyStatus::ONHOLDSHELF and
        copy.IsReserved = true and
        res.oclIsUndefined() = false and
        res.IsReserveClosed = false
      )
    )`,
    postcondition: `
    let loan:Loan in
    loan.oclIsNew() and
    loan.LoanedUser = user and
    loan.LoanedCopy = copy and
    loan.IsReturned = false and
    loan.LoanDate = Today and
    user.LoanedNumber = user.LoanedNumber@pre + 1 and
    user.LoanedBook->includes(loan) and
    copy.LoanedRecord->includes(loan) and
    if
      user.oclIsTypeOf(Student)
    then
      loan.DueDate = Today.After(30)
    else
      loan.DueDate = Today.After(60)
    endif and
    if
      copy.Status@pre = CopyStatus::ONHOLDSHELF
    then
      copy.IsReserved = false and
      res.IsReserveClosed = true
    endif and
    copy.Status = CopyStatus::LOANED and
    loan.OverDue3Days = false and
    loan.OverDue10Days = false and
    loan.OverDue17Days = false and
    loan.OverDue31Days = false and
    Loan.allInstances()->includes(loan) and
    result = true`,
  }),
];

const service = new Service({
  name: 'LibraryManagementSystemSystem',
  operations,
});

const useCase = new UseCase({
  name: 'borrowBook',
  description:
    'A librarian helps a user check out a book by verifying eligibility, confirming copy availability, and completing the loan record.',
  relatedService: service,
  systemService,
  involvedActors: actors,
});

export default useCase;
