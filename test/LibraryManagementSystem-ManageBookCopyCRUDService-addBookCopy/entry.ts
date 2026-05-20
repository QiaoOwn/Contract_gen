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

class ManageBookCopyCRUDService {
  /*Adds a new copy of a book.*/
  addBookCopy(callNo: string, barcode: string, location: string): boolean {
    /*Definition Start*/
    let book: Book = l({
      logic: () =>
        getRepository(Book).find(
          (b: Book) =>
            l({
              logic: () => b.CallNo === callNo,
              description: 'b.CallNo=callNo',
            }).build().pass
        ),
      description: 'Book.allInstance()->any(b:Book|b.CallNo=callNo)',
    }).build().pass;
    let bc: BookCopy = l({
      logic: () =>
        book.Copys.find(
          (c: BookCopy) =>
            l({
              logic: () => c.Barcode === barcode,
              description: 'c.Barcode=barcode',
            }).build().pass
        ),
      description: 'book.Copys->any(c:BookCopy|c.Barcode=barcode)',
    }).build().pass;
    /*Definition End*/

    /*Precondition Start*/
    const {errorMessage: preconditionErrorMessage, pass: isPreconditionPass} = l({
      logic: () => StandardOPs.oclIsUndefined(book) === false,
      description: 'book.oclIsUndefined()=false',
    })
      .and({
        logic: () => StandardOPs.oclIsUndefined(bc) === true,
        description: 'bc.oclIsUndefined()=true',
      })
      .build();
    if (!isPreconditionPass) {
      throw new PreconditionError(preconditionErrorMessage);
    }
    /*Precondition End*/

    /*Postcondition Start*/
    let copy: BookCopy;
    return l({
      execute: () => (copy = new BookCopy()),
      description: 'copy.oclIsNew()',
    })
      .and({
        execute: () => (copy.Barcode = barcode),
        description: 'copy.Barcode=barcode',
      })
      .and({
        execute: () => (copy.Status = CopyStatus.AVAILABLE),
        description: 'copy.Status=CopyStatus::AVAILABLE',
      })
      .and({
        execute: () => (copy.Location = location),
        description: 'copy.Location=location',
      })
      .and({
        execute: () => (copy.IsReserved = false),
        description: 'copy.IsReserved=false',
      })
      .and({
        execute: () => book.Copys.push(copy),
        description: 'book.Copys->includes(copy)',
      })
      .and({
        execute: () => (copy.BookBelongs = book),
        description: 'copy.BookBelongs=book',
      })
      .and({
        execute: () => (book.CopyNum = book.CopyNum + 1),
        description: 'book.CopyNum=book.CopyNum@pre+1',
      })
      .and({
        execute: () => getRepository(BookCopy).push(copy),
        description: 'BookCopy.allInstance()->includes(copy)',
      })
      .and({
        execute: () => true,
        description: 'result=true',
      })
      .build().value;
    /*Postcondition End*/
  }
}
export {ManageBookCopyCRUDService};
