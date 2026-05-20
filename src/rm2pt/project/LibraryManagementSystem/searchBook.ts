// searchBook.js

import {UseCase} from '../../model/UseCase';
import {Service} from '../../model/Service';
import systemService from './systemService';
import {Operation} from '../../model/Operation';
import {Parameter} from '../../model/Parameter';
import {ReturnedType} from '../../model/ReturnedType';

const operations = [
  new Operation({
    name: 'searchBookByBarCode',
    description: `Definition: The searchBookByBarCode operation handles its intended business action in this system.
    Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
    Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.`,
    parameters: [new Parameter({name: 'barcode', type: 'String'})],
    returnType: new ReturnedType('Set(Book)'),
    precondition: `barcode.oclIsTypeOf(String)`,
    postcondition: `result = Book.allInstance()->select(book:Book | book.Copys->exists(c:BookCopy | c.Barcode = barcode))`,
  }),

  new Operation({
    name: 'searchBookByTitle',
    description: `Definition: The searchBookByTitle operation handles its intended business action in this system.
    Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
    Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.`,
    parameters: [new Parameter({name: 'title', type: 'String'})],
    returnType: new ReturnedType('Set(Book)'),
    precondition: `title <> ""`,
    postcondition: `result = Book.allInstance()->select(book:Book | book.Title = title)`,
  }),

  new Operation({
    name: 'searchBookByAuthor',
    description: `Definition: The searchBookByAuthor operation handles its intended business action in this system.
    Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
    Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.`,
    parameters: [new Parameter({name: 'authorname', type: 'String'})],
    returnType: new ReturnedType('Set(Book)'),
    precondition: `authorname <> ""`,
    postcondition: `result = Book.allInstance()->select(book:Book | book.Author = authorname)`,
  }),

  new Operation({
    name: 'searchBookByISBN',
    description: `Definition: The searchBookByISBN operation handles its intended business action in this system.
    Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
    Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.`,
    parameters: [new Parameter({name: 'iSBNnumber', type: 'String'})],
    returnType: new ReturnedType('Set(Book)'),
    precondition: `iSBNnumber.oclIsTypeOf(String)`,
    postcondition: `result = Book.allInstance()->select(book:Book | book.ISBn = iSBNnumber)`,
  }),

  new Operation({
    name: 'searchBookBySubject',
    description: `Definition: The searchBookBySubject operation handles its intended business action in this system.
    Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
    Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.`,
    parameters: [new Parameter({name: 'subject', type: 'String'})],
    returnType: new ReturnedType('Set(Book)'),
    precondition: `subject.oclIsTypeOf(String)`,
    postcondition: `result = Book.allInstance()->select(book:Book | book.Subject->exists(s:Subject | s.Name = subject))`,
  }),
];

const service = new Service({
  name: 'SearchBook',
  operations,
});

const useCase = new UseCase({
  name: 'searchBook',
  description: 'The user searches books',
  relatedService: service,
  systemService,
  involvedActors: [],
});

export default useCase;
