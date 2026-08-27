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
/*The user account*/
class User {
  /*User ID*/
  UserID: string;
  /*Name*/
  Name: string;
  /*Sex*/
  Sex: Sex;
  /*Password*/
  Password: string;
  /*Email*/
  Email: string;
  /*Faculty*/
  Faculty: string;
  /*Number of loaned books*/
  LoanedNumber: number;
  /*Borrow status*/
  BorrowStatus: BorrowStatus;
  /*Suspension days*/
  SuspensionDays: number;
  /*Overdue fee*/
  OverDueFee: number;
  /*Loans made by the user*/
  LoanedBook: Loan[];
  /*Reservations made by the user*/
  ReservedBook: Reserve[];
  /*Books recommended by the user*/
  RecommendedBook: RecommendBook[];
}
/*The student account*/
class Student extends User {
  /*Major*/
  Major: string;
  /*Programme*/
  Programme: Programme;
  /*Registration status*/
  RegistrationStatus: Programme;
}
/*The faculty account*/
class Faculty extends User {
  /*Position*/
  Position: Position;
  /*Status*/
  Status: Status;
}
/*Books owned by the library*/
class Book {
  /*Call Number*/
  CallNo: string;
  /*Title*/
  Title: string;
  /*Edition*/
  Edition: string;
  /*Author*/
  Author: string;
  /*Publisher*/
  Publisher: string;
  /*Description*/
  Description: string;
  /*ISBN*/
  ISBn: string;
  /*Number of copies*/
  CopyNum: number;
  /*Copies of the book*/
  Copys: BookCopy[];
  /*Subjects of the book*/
  Subject: Subject[];
}
/*The subject of books*/
class Subject {
  /*Subject name*/
  Name: string;
  /*Super subject*/
  SuperSubject: Subject;
  /*Sub subjects*/
  SubSubject: Subject;
}
/*The copy of a book for borrowing*/
class BookCopy {
  /*Barcode*/
  Barcode: string;
  /*Status*/
  Status: CopyStatus;
  /*Location*/
  Location: string;
  /*Is reserved*/
  IsReserved: boolean;
  /*The book this copy belongs to*/
  BookBelongs: Book;
  /*Loan records of this copy*/
  LoanedRecord: Loan[];
  /*Reservation records of this copy*/
  ReservationRecord: Reserve[];
}
/*The record of borrowing books*/
class Loan {
  /*Loan date*/
  LoanDate: dayjs.Dayjs;
  /*Renew date*/
  RenewDate: dayjs.Dayjs;
  /*Due date*/
  DueDate: dayjs.Dayjs;
  /*Return date*/
  ReturnDate: dayjs.Dayjs;
  /*Number of times renewed*/
  RenewedTimes: number;
  /*Is returned*/
  IsReturned: boolean;
  /*Overdue fee*/
  OverDueFee: number;
  /*Overdue for 3 days*/
  OverDue3Days: boolean;
  /*Overdue for 10 days*/
  OverDue10Days: boolean;
  /*Overdue for 17 days*/
  OverDue17Days: boolean;
  /*Overdue for 31 days*/
  OverDue31Days: boolean;
  /*User who loaned the book*/
  LoanedUser: User;
  /*The copy loaned*/
  LoanedCopy: BookCopy;
  /*Librarian who processed the loan*/
  LoanLibrarian: Librarian;
  /*Librarian who processed the return*/
  ReturnLibrarian: Librarian;
}
/*The record of book reservation*/
class Reserve {
  /*Reservation date*/
  ReserveDate: dayjs.Dayjs;
  /*Is reservation closed*/
  IsReserveClosed: boolean;
  /*Reserved copy*/
  ReservedCopy: BookCopy;
  /*User who made the reservation*/
  ReservedUser: User;
}
/*The book recommended by users to the library*/
class RecommendBook extends Book {
  /*Recommendation date*/
  RecommendDate: dayjs.Dayjs;
  /*User who recommended the book*/
  RecommendUser: User;
}
/*The administrator account*/
class Administrator {
  /*Administrator ID*/
  AdminID: string;
  /*Username*/
  UserName: string;
  /*Password*/
  Password: string;
}
/*The librarian account*/
class Librarian {
  /*Librarian ID*/
  LibrarianID: string;
  /*Name*/
  Name: string;
  /*Password*/
  Password: string;
}
enum Sex {
  M = 'M',
  F = 'F',
}
enum BorrowStatus {
  NORMAL = 'NORMAL',
  SUSPEND = 'SUSPEND',
}
enum Programme {
  BACHELOR = 'BACHELOR',
  MASTER = 'MASTER',
  PHD = 'PHD',
}
enum Position {
  ASSISTANTPROFESSORS = 'ASSISTANTPROFESSORS',
  ASSOCIATEPROFESSOR = 'ASSOCIATEPROFESSOR',
  PROFESSOR = 'PROFESSOR',
  CHAIRPROFESSOR = 'CHAIRPROFESSOR',
}
enum Status {
  HASRETIRED = 'HASRETIRED',
  INPOSITION = 'INPOSITION',
}
enum CopyStatus {
  AVAILABLE = 'AVAILABLE',
  INPROCESSING = 'INPROCESSING',
  LIBUSEONLY = 'LIBUSEONLY',
  ONHOLDSHELF = 'ONHOLDSHELF',
  LOANED = 'LOANED',
}
const map = new Map();
map.set(User, []);
map.set(Student, []);
map.set(Faculty, []);
map.set(Book, []);
map.set(Subject, []);
map.set(BookCopy, []);
map.set(Loan, []);
map.set(Reserve, []);
map.set(RecommendBook, []);
map.set(Administrator, []);
map.set(Librarian, []);
const getRepository = <T>(clazz: new (...args: any[]) => T) => {
  return map.get(clazz) as T[];
};
export {
  Sex,
  BorrowStatus,
  Programme,
  Position,
  Status,
  CopyStatus,
  User,
  Student,
  Faculty,
  Book,
  Subject,
  BookCopy,
  Loan,
  Reserve,
  RecommendBook,
  Administrator,
  Librarian,
  getRepository,
};

class LibraryManagementSystemSystem {
  /*Definition: The makeReservation operation handles its intended business action in this system.
   *Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
   *Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.*/
  makeReservation(uid: string, barcode: string): boolean {
    /*OCL Invocation Environment*/
    const oclInvocationTime = dayjs();
    /*Definition Start*/
    let user: User = evaluateDefinition(
      () =>
        l({
          logic: () =>
            getRepository(User).find(
              (u: User) =>
                l({
                  logic: () => StandardOPs.oclEquals(u.UserID, uid),
                  description: 'u.UserID=uid',
                }).build().pass
            ),
          description: 'User.allInstances()->any(u:User|u.UserID=uid)',
        }).build().pass
    );
    let copy: BookCopy = evaluateDefinition(
      () =>
        l({
          logic: () =>
            getRepository(BookCopy).find(
              (bc: BookCopy) =>
                l({
                  logic: () => StandardOPs.oclEquals(bc.Barcode, barcode),
                  description: 'bc.Barcode=barcode',
                }).build().pass
            ),
          description: 'BookCopy.allInstances()->any(bc:BookCopy|bc.Barcode=barcode)',
        }).build().pass
    );
    /*Definition End*/

    /*Precondition Start*/
    const {errorMessage: preconditionErrorMessage, pass: isPreconditionPass} = l({
      logic: () => StandardOPs.oclEquals(StandardOPs.oclIsUndefined(user), false),
      description: 'user.oclIsUndefined()=false',
    })
      .and({
        logic: () => StandardOPs.oclEquals(StandardOPs.oclIsUndefined(copy), false),
        description: 'copy.oclIsUndefined()=false',
      })
      .and({
        logic: () => StandardOPs.oclEquals(copy.Status, CopyStatus.LOANED),
        description: 'copy.Status=CopyStatus::LOANED',
      })
      .and({
        logic: () => StandardOPs.oclEquals(copy.IsReserved, false),
        description: 'copy.IsReserved=false',
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
      let res: Reserve;
      return l({
        execute: () => (res = new Reserve()),
        description: 'res.oclIsNew()',
      })
        .and({
          execute: () => (copy.IsReserved = true),
          description: 'copy.IsReserved=true',
        })
        .and({
          execute: () => (res.IsReserveClosed = false),
          description: 'res.IsReserveClosed=false',
        })
        .and({
          execute: () => (res.ReserveDate = oclInvocationTime.startOf('day')),
          description: 'res.ReserveDate=Today',
        })
        .and({
          execute: () => (res.ReservedUser = user),
          description: 'res.ReservedUser=user',
        })
        .and({
          execute: () => (res.ReservedCopy = copy),
          description: 'res.ReservedCopy=copy',
        })
        .and({
          execute: () => StandardOPs.includeIfAbsent(user.ReservedBook, res),
          description: 'user.ReservedBook->includes(res)',
        })
        .and({
          execute: () => StandardOPs.includeIfAbsent(copy.ReservationRecord, res),
          description: 'copy.ReservationRecord->includes(res)',
        })
        .and({
          execute: () => StandardOPs.includeIfAbsent(getRepository(Reserve), res),
          description: 'Reserve.allInstances()->includes(res)',
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
      let res: Reserve = oclState.findNew(Reserve);
      return l({
        logic: () => oclState.isNew(res, Reserve),
        description: 'res.oclIsNew()',
      })
        .and({
          logic: () => StandardOPs.oclEquals(copy.IsReserved, true),
          description: 'copy.IsReserved=true',
        })
        .and({
          logic: () => StandardOPs.oclEquals(res.IsReserveClosed, false),
          description: 'res.IsReserveClosed=false',
        })
        .and({
          logic: () => StandardOPs.oclEquals(res.ReserveDate, oclInvocationTime.startOf('day')),
          description: 'res.ReserveDate=Today',
        })
        .and({
          logic: () => StandardOPs.oclEquals(res.ReservedUser, user),
          description: 'res.ReservedUser=user',
        })
        .and({
          logic: () => StandardOPs.oclEquals(res.ReservedCopy, copy),
          description: 'res.ReservedCopy=copy',
        })
        .and({
          logic: () => StandardOPs.includes(user.ReservedBook, res),
          description: 'user.ReservedBook->includes(res)',
        })
        .and({
          logic: () => StandardOPs.includes(copy.ReservationRecord, res),
          description: 'copy.ReservationRecord->includes(res)',
        })
        .and({
          logic: () => StandardOPs.includes(getRepository(Reserve), res),
          description: 'Reserve.allInstances()->includes(res)',
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
export {LibraryManagementSystemSystem};
