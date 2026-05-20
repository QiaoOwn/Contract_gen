import systemService from './systemService';
import {Operation} from '../../model/Operation';
import {Parameter} from '../../model/Parameter';
import {ReturnedType} from '../../model/ReturnedType';
import {Service} from '../../model/Service';
import {UseCase} from '../../model/UseCase';
import {User} from './actor';

const actors = [User];

const operations = [
  new Operation({
    name: 'recommendBook',
    description: `Definition: The recommendBook operation handles its intended business action in this system.
    Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
    Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.`,
    parameters: [
      new Parameter({name: 'uid', type: 'String'}),
      new Parameter({name: 'callNo', type: 'String'}),
      new Parameter({name: 'title', type: 'String'}),
      new Parameter({name: 'edition', type: 'String'}),
      new Parameter({name: 'author', type: 'String'}),
      new Parameter({name: 'publisher', type: 'String'}),
      new Parameter({name: 'description', type: 'String'}),
      new Parameter({name: 'isbn', type: 'String'}),
    ],
    returnType: new ReturnedType('Boolean'),
    definition: `
    user:User = User.allInstance()->any(u:User | u.UserID = uid),
    rb:RecommendBook = RecommendBook.allInstance()->any(r:RecommendBook | r.CallNo = callNo)`,
    precondition: `
    user.oclIsUndefined() = false and
    rb.oclIsUndefined() = true`,
    postcondition: `
    let r:RecommendBook in
    r.oclIsNew() and
    r.CallNo = callNo and
    r.Title = title and
    r.Edition = edition and
    r.Author = author and
    r.Publisher = publisher and
    r.Description = description and
    r.ISBn = isbn and
    r.RecommendDate = Today and
    r.RecommendUser = user and
    user.RecommendedBook->includes(r) and
    RecommendBook.allInstance()->includes(r) and
    result = true`,
  }),
];

const service = new Service({
  name: 'LibraryManagementSystemSystem',
  operations,
});

const useCase = new UseCase({
  name: 'recommendBook',
  description: 'The user recommends books to the library',
  relatedService: service,
  systemService,
  involvedActors: actors,
});

export default useCase;
