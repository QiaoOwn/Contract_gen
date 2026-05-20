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
  /*Allows a user to borrow a book.*/
  borrowBook(uid: string, barcode: string): boolean {
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
            }).build().pass
        ),
      description: 'BookCopy.allInstance()->any(bc:BookCopy|bc.Barcode=barcode)',
    }).build().pass;
    let res: Reserve = l({
      logic: () =>
        getRepository(Reserve).find(
          (r: Reserve) =>
            l({
              logic: () => r.ReservedCopy === copy,
              description: 'r.ReservedCopy=copy',
            })
              .and({
                logic: () => r.ReservedUser === user,
                description: 'r.ReservedUser=user',
              })
              .and({
                logic: () => r.IsReserveClosed === false,
                description: 'r.IsReserveClosed=false',
              })
              .build().pass
        ),
      description:
        'Reserve.allInstance()->any(r:Reserve|r.ReservedCopy=copyandr.ReservedUser=userandr.IsReserveClosed=false)',
    }).build().pass;
    /*Definition End*/

    /*Precondition Start*/
    const {errorMessage: preconditionErrorMessage, pass: isPreconditionPass} = l({
      logic: () => StandardOPs.oclIsUndefined(user) === false,
      description: 'user.oclIsUndefined()=false',
    })
      .and({
        logic: () => StandardOPs.oclIsUndefined(copy) === false,
        description: 'copy.oclIsUndefined()=false',
      })
      .and({
        logic: () => user.BorrowStatus === BorrowStatus.NORMAL,
        description: 'user.BorrowStatus=BorrowStatus::NORMAL',
      })
      .and({
        logic: () => user.SuspensionDays === 0,
        description: 'user.SuspensionDays=0',
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
            logic: () => stu.LoanedNumber < 20,
            description: 'stu.LoanedNumber<20',
          }),
          else: l().if({
            logic: () =>
              l({
                logic: () => stu.Programme === Programme.MASTER,
                description: 'stu.Programme=Programme::MASTER',
              }),
            description: 'stu.Programme=Programme::MASTER',
            then: l({
              logic: () => stu.LoanedNumber < 40,
              description: 'stu.LoanedNumber<40',
            }),
            else: l({
              logic: () => stu.LoanedNumber < 60,
              description: 'stu.LoanedNumber<60',
            }),
          }),
        }),
        else: l({
          logic: () => fac.LoanedNumber < 60,
          description: 'fac.LoanedNumber<60',
        }),
      })
      .and({
        logic: () =>
          l({
            logic: () => copy.Status === CopyStatus.AVAILABLE,
            description: 'copy.Status=CopyStatus::AVAILABLE',
          }).or({
            logic: () =>
              l({
                logic: () => copy.Status === CopyStatus.ONHOLDSHELF,
                description: 'copy.Status=CopyStatus::ONHOLDSHELF',
              })
                .and({
                  logic: () => copy.IsReserved === true,
                  description: 'copy.IsReserved=true',
                })
                .and({
                  logic: () => StandardOPs.oclIsUndefined(res) === false,
                  description: 'res.oclIsUndefined()=false',
                })
                .and({
                  logic: () => res.IsReserveClosed === false,
                  description: 'res.IsReserveClosed=false',
                }),
            description:
              '(copy.Status=CopyStatus::ONHOLDSHELFandcopy.IsReserved=trueandres.oclIsUndefined()=falseandres.IsReserveClosed=false)',
          }),
        description:
          '(copy.Status=CopyStatus::AVAILABLEor(copy.Status=CopyStatus::ONHOLDSHELFandcopy.IsReserved=trueandres.oclIsUndefined()=falseandres.IsReserveClosed=false))',
      })
      .build();
    if (!isPreconditionPass) {
      throw new PreconditionError(preconditionErrorMessage);
    }
    /*Precondition End*/

    /*Postcondition Start*/
    let loan: Loan;
    return l({
      execute: () => (loan = new Loan()),
      description: 'loan.oclIsNew()',
    })
      .and({
        execute: () => (loan.LoanedUser = user),
        description: 'loan.LoanedUser=user',
      })
      .and({
        execute: () => (loan.LoanedCopy = copy),
        description: 'loan.LoanedCopy=copy',
      })
      .and({
        execute: () => (loan.IsReturned = false),
        description: 'loan.IsReturned=false',
      })
      .and({
        execute: () => (loan.LoanDate = dayjs()),
        description: 'loan.LoanDate=Today',
      })
      .and({
        execute: () => (user.LoanedNumber = user.LoanedNumber + 1),
        description: 'user.LoanedNumber=user.LoanedNumber@pre+1',
      })
      .and({
        execute: () => user.LoanedBook.push(loan),
        description: 'user.LoanedBook->includes(loan)',
      })
      .and({
        execute: () => copy.LoanedRecord.push(loan),
        description: 'copy.LoanedRecord->includes(loan)',
      })
      .if({
        logic: () =>
          l({
            logic: () => StandardOPs.oclIsTypeOf(user, Student),
            description: 'user.oclIsTypeOf(Student)',
          }),
        description: 'user.oclIsTypeOf(Student)',
        then: l({
          execute: () => (loan.DueDate = dayjs(dayjs()).add(30, 'd')),
          description: 'loan.DueDate=Today.After(30)',
        }),
        else: l({
          execute: () => (loan.DueDate = dayjs(dayjs()).add(60, 'd')),
          description: 'loan.DueDate=Today.After(60)',
        }),
      })
      .if({
        logic: () =>
          l({
            logic: () => copy.Status === CopyStatus.ONHOLDSHELF,
            description: 'copy.Status@pre=CopyStatus::ONHOLDSHELF',
          }),
        description: 'copy.Status@pre=CopyStatus::ONHOLDSHELF',
        then: l({
          execute: () => (copy.IsReserved = false),
          description: 'copy.IsReserved=false',
        }).and({
          execute: () => (res.IsReserveClosed = true),
          description: 'res.IsReserveClosed=true',
        }),
      })
      .and({
        execute: () => (copy.Status = CopyStatus.LOANED),
        description: 'copy.Status=CopyStatus::LOANED',
      })
      .and({
        execute: () => (loan.OverDue3Days = false),
        description: 'loan.OverDue3Days=false',
      })
      .and({
        execute: () => (loan.OverDue10Days = false),
        description: 'loan.OverDue10Days=false',
      })
      .and({
        execute: () => (loan.OverDue17Days = false),
        description: 'loan.OverDue17Days=false',
      })
      .and({
        execute: () => (loan.OverDue31Days = false),
        description: 'loan.OverDue31Days=false',
      })
      .and({
        execute: () => getRepository(Loan).push(loan),
        description: 'Loan.allInstance()->includes(loan)',
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
