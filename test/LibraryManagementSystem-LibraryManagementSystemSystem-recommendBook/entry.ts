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
  /*The user recommends books to the library.*/
  recommendBook(
    uid: string,
    callNo: string,
    title: string,
    edition: string,
    author: string,
    publisher: string,
    description: string,
    isbn: string
  ): boolean {
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
    let rb: RecommendBook = l({
      logic: () =>
        getRepository(RecommendBook).find(
          (r: RecommendBook) =>
            l({
              logic: () => r.CallNo === callNo,
              description: 'r.CallNo=callNo',
            }).build().pass
        ),
      description: 'RecommendBook.allInstance()->any(r:RecommendBook|r.CallNo=callNo)',
    }).build().pass;
    /*Definition End*/

    /*Precondition Start*/
    const {errorMessage: preconditionErrorMessage, pass: isPreconditionPass} = l({
      logic: () => StandardOPs.oclIsUndefined(user) === false,
      description: 'user.oclIsUndefined()=false',
    })
      .and({
        logic: () => StandardOPs.oclIsUndefined(rb) === true,
        description: 'rb.oclIsUndefined()=true',
      })
      .build();
    if (!isPreconditionPass) {
      throw new PreconditionError(preconditionErrorMessage);
    }
    /*Precondition End*/

    /*Postcondition Start*/
    let r: RecommendBook;
    return l({
      execute: () => (r = new RecommendBook()),
      description: 'r.oclIsNew()',
    })
      .and({
        execute: () => (r.CallNo = callNo),
        description: 'r.CallNo=callNo',
      })
      .and({
        execute: () => (r.Title = title),
        description: 'r.Title=title',
      })
      .and({
        execute: () => (r.Edition = edition),
        description: 'r.Edition=edition',
      })
      .and({
        execute: () => (r.Author = author),
        description: 'r.Author=author',
      })
      .and({
        execute: () => (r.Publisher = publisher),
        description: 'r.Publisher=publisher',
      })
      .and({
        execute: () => (r.Description = description),
        description: 'r.Description=description',
      })
      .and({
        execute: () => (r.ISBn = isbn),
        description: 'r.ISBn=isbn',
      })
      .and({
        execute: () => (r.RecommendDate = dayjs()),
        description: 'r.RecommendDate=Today',
      })
      .and({
        execute: () => (r.RecommendUser = user),
        description: 'r.RecommendUser=user',
      })
      .and({
        execute: () => user.RecommendedBook.push(r),
        description: 'user.RecommendedBook->includes(r)',
      })
      .and({
        execute: () => getRepository(RecommendBook).push(r),
        description: 'RecommendBook.allInstance()->includes(r)',
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
