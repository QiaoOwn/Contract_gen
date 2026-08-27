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
    name: 'createBook',
    description: `Definition: The createBook operation handles its intended business action in this system.
    Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
    Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.`,
    parameters: [
      new Parameter({name: 'callno', type: 'String'}),
      new Parameter({name: 'title', type: 'String'}),
      new Parameter({name: 'edition', type: 'String'}),
      new Parameter({name: 'author', type: 'String'}),
      new Parameter({name: 'publisher', type: 'String'}),
      new Parameter({name: 'description', type: 'String'}),
      new Parameter({name: 'isbn', type: 'String'}),
      new Parameter({name: 'copynum', type: 'Integer'}),
    ],
    returnType: new ReturnedType('Boolean'),
    definition: `book:Book = Book.allInstances()->any(boo:Book | boo.CallNo = callno)`,
    precondition: `book.oclIsUndefined() = true`,
    postcondition: `
    let boo:Book in
    boo.oclIsNew() and
    boo.CallNo = callno and
    boo.Title = title and
    boo.Edition = edition and
    boo.Author = author and
    boo.Publisher = publisher and
    boo.Description = description and
    boo.ISBn = isbn and
    boo.CopyNum = copynum and
    Book.allInstances()->includes(boo) and
    result = true`,
  }),
  // Similar operations for queryBook, modifyBook, deleteBook
];

const service = new Service({
  name: 'ManageBookCRUDService',
  operations,
});

const useCase = new UseCase({
  name: 'manageBook',
  description:
    'The administrator manages book information, including entering, inquiring, modifying, and deleting book information',
  relatedService: service,
  systemService,
  involvedActors: actors,
});

export default useCase;
