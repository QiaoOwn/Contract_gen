import dayjs from 'dayjs';
import {l, PreconditionError, StandardOPs} from '../globalEntry';
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
  /*The librarian renews a book for a user, extending the loan period by a predefined amount.*/
  renewBook(uid: string, barcode: string): boolean {
    /*Definition Start*/
    let user: User = l({
      logic: () =>
        getRepository(User).find(
          (u: User) =>
            l({
              logic: () => u.UserID === uid,
              description: 'u.UserID=uid',
            }).build().pass
        ),
      description: 'User.allInstance()->any(u:User|u.UserID=uid)',
    }).build().pass;
    let stu: Student = l({
      logic: () =>
        getRepository(Student).find(
          (s: Student) =>
            l({
              logic: () => s.UserID === uid,
              description: 's.UserID=uid',
            }).build().pass
        ),
      description: 'Student.allInstance()->any(s:Student|s.UserID=uid)',
    }).build().pass;
    let fac: Faculty = l({
      logic: () =>
        getRepository(Faculty).find(
          (f: Faculty) =>
            l({
              logic: () => f.UserID === uid,
              description: 'f.UserID=uid',
            }).build().pass
        ),
      description: 'Faculty.allInstance()->any(f:Faculty|f.UserID=uid)',
    }).build().pass;
    let copy: BookCopy = l({
      logic: () =>
        getRepository(BookCopy).find(
          (bc: BookCopy) =>
            l({
              logic: () => bc.Barcode === barcode,
              description: 'bc.Barcode=barcode',
            })
              .and({
                logic: () => bc.Status === CopyStatus.LOANED,
                description: 'bc.Status=CopyStatus::LOANED',
              })
              .build().pass
        ),
      description:
        'BookCopy.allInstance()->any(bc:BookCopy|bc.Barcode=barcodeandbc.Status=CopyStatus::LOANED)',
    }).build().pass;
    let loan: Loan = l({
      logic: () =>
        getRepository(Loan).find(
          (_l: Loan) =>
            l({
              logic: () => _l.LoanedUser === user,
              description: 'l.LoanedUser=user',
            })
              .and({
                logic: () => _l.LoanedCopy === copy,
                description: 'l.LoanedCopy=copy',
              })
              .build().pass
        ),
      description: 'Loan.allInstance()->any(l:Loan|l.LoanedUser=userandl.LoanedCopy=copy)',
    }).build().pass;
    /*Definition End*/

    /*Precondition Start*/
    const {errorMessage: preconditionErrorMessage, pass: isPreconditionPass} = l({
      logic: () => user.BorrowStatus === BorrowStatus.NORMAL,
      description: 'user.BorrowStatus=BorrowStatus::NORMAL',
    })
      .and({
        logic: () => StandardOPs.oclIsUndefined(user) === false,
        description: 'user.oclIsUndefined()=false',
      })
      .and({
        logic: () => StandardOPs.oclIsUndefined(copy) === false,
        description: 'copy.oclIsUndefined()=false',
      })
      .and({
        logic: () => StandardOPs.oclIsUndefined(loan) === false,
        description: 'loan.oclIsUndefined()=false',
      })
      .and({
        logic: () => copy.IsReserved === false,
        description: 'copy.IsReserved=false',
      })
      .and({
        logic: () => dayjs(loan.DueDate).isAfter(dayjs(), 'd'),
        description: 'loan.DueDate.isAfter(Today)',
      })
      .if({
        logic: () =>
          l({
            logic: () => StandardOPs.oclIsTypeOf(user, Student),
            description: 'user.oclIsTypeOf(Student)',
          }),
        description: 'user.oclIsTypeOf(Student)',
        then: l({
          logic: () => loan.RenewedTimes < 3,
          description: 'loan.RenewedTimes<3',
        }),
        else: l({
          logic: () => loan.RenewedTimes < 6,
          description: 'loan.RenewedTimes<6',
        }),
      })
      .and({
        logic: () => loan.OverDueFee === 0,
        description: 'loan.OverDueFee=0',
      })
      .build();
    if (!isPreconditionPass) {
      throw new PreconditionError(preconditionErrorMessage);
    }
    /*Precondition End*/

    /*Postcondition Start*/
    return l({
      execute: () => (loan.RenewedTimes = loan.RenewedTimes + 1),
      description: 'loan.RenewedTimes=loan.RenewedTimes@pre+1',
    })
      .and({
        execute: () => (loan.RenewDate = dayjs()),
        description: 'loan.RenewDate=Today',
      })
      .if({
        logic: () =>
          l({
            logic: () => StandardOPs.oclIsTypeOf(user, Student),
            description: 'user.oclIsTypeOf(Student)',
          }),
        description: 'user.oclIsTypeOf(Student)',
        then: l().if({
          logic: () =>
            l({
              logic: () => stu.Programme === Programme.BACHELOR,
              description: 'stu.Programme=Programme::BACHELOR',
            }),
          description: 'stu.Programme=Programme::BACHELOR',
          then: l({
            execute: () => (loan.DueDate = dayjs(loan.DueDate).add(20, 'd')),
            description: 'loan.DueDate=loan.DueDate@pre.After(20)',
          }),
          else: l().if({
            logic: () =>
              l({
                logic: () => stu.Programme === Programme.MASTER,
                description: 'stu.Programme=Programme::MASTER',
              }),
            description: 'stu.Programme=Programme::MASTER',
            then: l({
              execute: () => (loan.DueDate = dayjs(loan.DueDate).add(40, 'd')),
              description: 'loan.DueDate=loan.DueDate@pre.After(40)',
            }),
            else: l({
              execute: () => (loan.DueDate = dayjs(loan.DueDate).add(60, 'd')),
              description: 'loan.DueDate=loan.DueDate@pre.After(60)',
            }),
          }),
        }),
        else: l({
          execute: () => (loan.DueDate = dayjs(loan.DueDate).add(60, 'd')),
          description: 'loan.DueDate=loan.DueDate@pre.After(60)',
        }),
      })
      .and({
        execute: () => true,
        description: 'result=true',
      })
      .build().value;
    /*Postcondition End*/
  }
}
export {LibraryManagementSystemSystem};
