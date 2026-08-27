import systemService from './systemService';
import {Operation} from '../../model/Operation';
import {Parameter} from '../../model/Parameter';
import {ReturnedType} from '../../model/ReturnedType';
import {Service} from '../../model/Service';
import {UseCase} from '../../model/UseCase';
import {Administrator} from './actor';

const actors = [Administrator];

const operations = [
  new Operation({
    name: 'addBookCopy',
    description: `Definition: The addBookCopy operation handles its intended business action in this system.
    Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
    Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.`,
    parameters: [
      new Parameter({name: 'callNo', type: 'String'}),
      new Parameter({name: 'barcode', type: 'String'}),
      new Parameter({name: 'location', type: 'String'}),
    ],
    returnType: new ReturnedType('Boolean'),
    definition: `
    book:Book = Book.allInstances()->any(b:Book | b.CallNo = callNo),
    bc:BookCopy = book.Copys->any(c:BookCopy | c.Barcode = barcode)`,
    precondition: `
    book.oclIsUndefined() = false and
    bc.oclIsUndefined() = true`,
    postcondition: `
    let copy:BookCopy in
    copy.oclIsNew() and
    copy.Barcode = barcode and
    copy.Status = CopyStatus::AVAILABLE and
    copy.Location = location and
    copy.IsReserved = false and
    book.Copys->includes(copy) and
    copy.BookBelongs = book and
    book.CopyNum = book.CopyNum@pre + 1 and
    BookCopy.allInstances()->includes(copy) and
    result = true`,
  }),
  // Similar operations for queryBookCopy, modifyBookCopy, deleteBookCopy
];

const service = new Service({
  name: 'ManageBookCopyCRUDService',
  operations,
});

const useCase = new UseCase({
  name: 'manageBookCopy',
  description:
    'The administrator manages book copy information, including entering, inquiring, modifying, and deleting book copy information',
  relatedService: service,
  systemService,
  involvedActors: actors,
});

export default useCase;
