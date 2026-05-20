import {Entity} from '../../model/Entity';
import {Attribute} from '../../model/Attribute';
import {Relationship} from '../../model/Relationship';
const User = new Entity({
  name: 'User',
  description: 'The user account',
  attributes: [
    new Attribute({name: 'UserID', type: 'String', description: 'User ID'}),
    new Attribute({name: 'Name', type: 'String', description: 'Name'}),
    new Attribute({name: 'Sex', type: 'Sex[M|F]', description: 'Sex'}),
    new Attribute({
      name: 'Password',
      type: 'String',
      description: 'Password',
    }),
    new Attribute({name: 'Email', type: 'String', description: 'Email'}),
    new Attribute({
      name: 'Faculty',
      type: 'String',
      description: 'Faculty',
    }),
    new Attribute({
      name: 'LoanedNumber',
      type: 'Integer',
      description: 'Number of loaned books',
    }),
    new Attribute({
      name: 'BorrowStatus',
      type: 'BorrowStatus[NORMAL|SUSPEND]',
      description: 'Borrow status',
    }),
    new Attribute({
      name: 'SuspensionDays',
      type: 'Integer',
      description: 'Suspension days',
    }),
    new Attribute({
      name: 'OverDueFee',
      type: 'Real',
      description: 'Overdue fee',
    }),
  ],
  relationships: [
    new Relationship({
      name: 'LoanedBook',
      relatedEntity: 'Set(Loan)',
      associationType: 'Association',
      description: 'Loans made by the user',
    }),
    new Relationship({
      name: 'ReservedBook',
      relatedEntity: 'Set(Reserve)',
      associationType: 'Association',
      description: 'Reservations made by the user',
    }),
    new Relationship({
      name: 'RecommendedBook',
      relatedEntity: 'Set(RecommendBook)',
      associationType: 'Association',
      description: 'Books recommended by the user',
    }),
  ],
});

const Book = new Entity({
  name: 'Book',
  description: 'Books owned by the library',
  attributes: [
    new Attribute({
      name: 'CallNo',
      type: 'String',
      description: 'Call Number',
    }),
    new Attribute({name: 'Title', type: 'String', description: 'Title'}),
    new Attribute({
      name: 'Edition',
      type: 'String',
      description: 'Edition',
    }),
    new Attribute({name: 'Author', type: 'String', description: 'Author'}),
    new Attribute({
      name: 'Publisher',
      type: 'String',
      description: 'Publisher',
    }),
    new Attribute({
      name: 'Description',
      type: 'String',
      description: 'Description',
    }),
    new Attribute({name: 'ISBn', type: 'String', description: 'ISBN'}),
    new Attribute({
      name: 'CopyNum',
      type: 'Integer',
      description: 'Number of copies',
    }),
  ],
  relationships: [
    new Relationship({
      name: 'Copys',
      relatedEntity: 'Set(BookCopy)',
      associationType: 'Association',
      description: 'Copies of the book',
    }),
    new Relationship({
      name: 'Subject',
      relatedEntity: 'Set(Subject)',
      associationType: 'Association',
      description: 'Subjects of the book',
    }),
  ],
});
const entities = {
  User,
  Student: new Entity({
    name: 'Student',
    description: 'The student account',
    extends: User,
    attributes: [
      new Attribute({name: 'Major', type: 'String', description: 'Major'}),
      new Attribute({
        name: 'Programme',
        type: 'Programme[BACHELOR|MASTER|PHD]',
        description: 'Programme',
      }),
      new Attribute({
        name: 'RegistrationStatus',
        type: 'Programme[GRADUATED|PROGRAMMING]',
        description: 'Registration status',
      }),
    ],
  }),

  Faculty: new Entity({
    name: 'Faculty',
    description: 'The faculty account',
    extends: User,
    attributes: [
      new Attribute({
        name: 'Position',
        type: 'Position[ASSISTANTPROFESSORS|ASSOCIATEPROFESSOR|PROFESSOR|CHAIRPROFESSOR]',
        description: 'Position',
      }),
      new Attribute({
        name: 'Status',
        type: 'Status[HASRETIRED|INPOSITION]',
        description: 'Status',
      }),
    ],
  }),

  Book,

  Subject: new Entity({
    name: 'Subject',
    description: 'The subject of books',
    attributes: [
      new Attribute({
        name: 'Name',
        type: 'String',
        description: 'Subject name',
      }),
    ],
    relationships: [
      new Relationship({
        name: 'SuperSubject',
        relatedEntity: 'Subject',
        associationType: 'Association',
        description: 'Super subject',
      }),
      new Relationship({
        name: 'SubSubject',
        relatedEntity: 'Subject',
        associationType: 'Association',
        description: 'Sub subjects',
      }),
    ],
  }),

  BookCopy: new Entity({
    name: 'BookCopy',
    description: 'The copy of a book for borrowing',
    attributes: [
      new Attribute({
        name: 'Barcode',
        type: 'String',
        description: 'Barcode',
      }),
      new Attribute({
        name: 'Status',
        type: 'CopyStatus[AVAILABLE|INPROCESSING|LIBUSEONLY|ONHOLDSHELF|LOANED]',
        description: 'Status',
      }),
      new Attribute({
        name: 'Location',
        type: 'String',
        description: 'Location',
      }),
      new Attribute({
        name: 'IsReserved',
        type: 'Boolean',
        description: 'Is reserved',
      }),
    ],
    relationships: [
      new Relationship({
        name: 'BookBelongs',
        relatedEntity: 'Book',
        associationType: 'Association',
        description: 'The book this copy belongs to',
      }),
      new Relationship({
        name: 'LoanedRecord',
        relatedEntity: 'Set(Loan)',
        associationType: 'Association',
        description: 'Loan records of this copy',
      }),
      new Relationship({
        name: 'ReservationRecord',
        relatedEntity: 'Set(Reserve)',
        associationType: 'Association',
        description: 'Reservation records of this copy',
      }),
    ],
  }),

  Loan: new Entity({
    name: 'Loan',
    description: 'The record of borrowing books',
    attributes: [
      new Attribute({
        name: 'LoanDate',
        type: 'Date',
        description: 'Loan date',
      }),
      new Attribute({
        name: 'RenewDate',
        type: 'Date',
        description: 'Renew date',
      }),
      new Attribute({name: 'DueDate', type: 'Date', description: 'Due date'}),
      new Attribute({
        name: 'ReturnDate',
        type: 'Date',
        description: 'Return date',
      }),
      new Attribute({
        name: 'RenewedTimes',
        type: 'Integer',
        description: 'Number of times renewed',
      }),
      new Attribute({
        name: 'IsReturned',
        type: 'Boolean',
        description: 'Is returned',
      }),
      new Attribute({
        name: 'OverDueFee',
        type: 'Real',
        description: 'Overdue fee',
      }),
      new Attribute({
        name: 'OverDue3Days',
        type: 'Boolean',
        description: 'Overdue for 3 days',
      }),
      new Attribute({
        name: 'OverDue10Days',
        type: 'Boolean',
        description: 'Overdue for 10 days',
      }),
      new Attribute({
        name: 'OverDue17Days',
        type: 'Boolean',
        description: 'Overdue for 17 days',
      }),
      new Attribute({
        name: 'OverDue31Days',
        type: 'Boolean',
        description: 'Overdue for 31 days',
      }),
    ],
    relationships: [
      new Relationship({
        name: 'LoanedUser',
        relatedEntity: 'User',
        associationType: 'Association',
        description: 'User who loaned the book',
      }),
      new Relationship({
        name: 'LoanedCopy',
        relatedEntity: 'BookCopy',
        associationType: 'Association',
        description: 'The copy loaned',
      }),
      new Relationship({
        name: 'LoanLibrarian',
        relatedEntity: 'Librarian',
        associationType: 'Association',
        description: 'Librarian who processed the loan',
      }),
      new Relationship({
        name: 'ReturnLibrarian',
        relatedEntity: 'Librarian',
        associationType: 'Association',
        description: 'Librarian who processed the return',
      }),
    ],
  }),

  Reserve: new Entity({
    name: 'Reserve',
    description: 'The record of book reservation',
    attributes: [
      new Attribute({
        name: 'ReserveDate',
        type: 'Date',
        description: 'Reservation date',
      }),
      new Attribute({
        name: 'IsReserveClosed',
        type: 'Boolean',
        description: 'Is reservation closed',
      }),
    ],
    relationships: [
      new Relationship({
        name: 'ReservedCopy',
        relatedEntity: 'BookCopy',
        associationType: 'Association',
        description: 'Reserved copy',
      }),
      new Relationship({
        name: 'ReservedUser',
        relatedEntity: 'User',
        associationType: 'Association',
        description: 'User who made the reservation',
      }),
    ],
  }),

  RecommendBook: new Entity({
    name: 'RecommendBook',
    extends: Book,
    description: 'The book recommended by users to the library',
    attributes: [
      new Attribute({
        name: 'RecommendDate',
        type: 'Date',
        description: 'Recommendation date',
      }),
    ],
    relationships: [
      new Relationship({
        name: 'RecommendUser',
        relatedEntity: 'User',
        associationType: 'Association',
        description: 'User who recommended the book',
      }),
    ],
  }),

  Administrator: new Entity({
    name: 'Administrator',
    description: 'The administrator account',
    attributes: [
      new Attribute({
        name: 'AdminID',
        type: 'String',
        description: 'Administrator ID',
      }),
      new Attribute({
        name: 'UserName',
        type: 'String',
        description: 'Username',
      }),
      new Attribute({
        name: 'Password',
        type: 'String',
        description: 'Password',
      }),
    ],
  }),

  Librarian: new Entity({
    name: 'Librarian',
    description: 'The librarian account',
    attributes: [
      new Attribute({
        name: 'LibrarianID',
        type: 'String',
        description: 'Librarian ID',
      }),
      new Attribute({name: 'Name', type: 'String', description: 'Name'}),
      new Attribute({
        name: 'Password',
        type: 'String',
        description: 'Password',
      }),
    ],
  }),
};

export default entities;
