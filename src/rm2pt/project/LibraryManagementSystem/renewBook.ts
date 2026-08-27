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
    name: 'renewBook',
    description: `Definition: The renewBook operation handles its intended business action in this system.
    Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
    Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.`,
    parameters: [
      new Parameter({name: 'uid', type: 'String'}),
      new Parameter({name: 'barcode', type: 'String'}),
    ],
    returnType: new ReturnedType('Boolean'),
    definition: `user:User = User.allInstances()->any(u:User | u.UserID = uid),
			stu:Student = Student.allInstances()->any(s:Student | s.UserID = uid),
			fac:Faculty = Faculty.allInstances()->any(f:Faculty | f.UserID = uid),
			copy:BookCopy = BookCopy.allInstances()->any(bc:BookCopy | bc.Barcode = barcode and bc.Status = CopyStatus::LOANED),
			loan:Loan = Loan.allInstances()->any(l:Loan | l.LoanedUser = user and l.LoanedCopy = copy and l.IsReturned = false)`,
    precondition: `user.BorrowStatus = BorrowStatus::NORMAL and
			user.oclIsUndefined() = false and
			copy.oclIsUndefined() = false and
			loan.oclIsUndefined() = false and
			copy.IsReserved = false and
			loan.DueDate.isAfter(Today) and
			if
				user.oclIsTypeOf(Student)
			then
				loan.RenewedTimes < 3
			else
				loan.RenewedTimes < 6
			endif and
			loan.OverDueFee = 0`,
    postcondition: `loan.RenewedTimes = loan.RenewedTimes@pre + 1 and
			loan.RenewDate = Today and
			if
				user.oclIsTypeOf(Student)
			then
				if
					stu.Programme = Programme::BACHELOR
				then
					loan.DueDate = loan.DueDate@pre.After(20)
				else
					if
						stu.Programme = Programme::MASTER
					then
						loan.DueDate = loan.DueDate@pre.After(40)
					else
						loan.DueDate = loan.DueDate@pre.After(60)
					endif
				endif
			else
				loan.DueDate = loan.DueDate@pre.After(60)
			endif and
			result = true`,
  }),
];

const service = new Service({
  name: 'LibraryManagementSystemSystem',
  operations,
});

const useCase = new UseCase({
  name: 'renewBook',
  description:
    'The librarian renews a book for the user, extending the due date for an additional borrowing period.',
  relatedService: service,
  systemService,
  involvedActors: actors,
});

export default useCase;
