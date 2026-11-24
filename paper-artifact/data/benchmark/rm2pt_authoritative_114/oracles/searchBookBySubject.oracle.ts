import {Book, Subject, SearchBook, getRepository} from './entry';
import {expectSameMembers, expectPreconditionRejected} from '../helpers/contractOracle';

describe('Source-aligned subject search through Book associations', () => {
  beforeEach(() => {getRepository(Book).splice(0); getRepository(Subject).splice(0);});
  const cases = [
    {name: 'empty catalog', value: 'Robotics', subjects: [] as string[][], indices: [] as number[]},
    {name: 'absent subject', value: 'Robotics', subjects: [[], ['History']], indices: []},
    {name: 'nonfirst match', value: 'Robotics', subjects: [['History'], [], ['Robotics']], indices: [2]},
    {name: 'multiple books and matching edges', value: 'Robotics', subjects: [['Robotics', 'Robotics'], ['History'], ['Robotics']], indices: [0, 2]},
    {name: 'distinct equal-valued books', value: 'Robotics', subjects: [['Robotics'], ['Robotics']], indices: [0, 1]},
    {name: 'case-sensitive subject', value: 'Robotics', subjects: [['robotics'], ['Robotics'], ['ROBOTICS']], indices: [1]},
    {name: 'not a substring query', value: 'Robotics', subjects: [['Robotics Lab'], ['Applied Robotics'], ['Robotics']], indices: [2]},
    {name: 'spaces retained', value: ' Robotics ', subjects: [['Robotics'], [' Robotics ']], indices: [1]},
    {name: 'empty String is admissible', value: '', subjects: [['History'], ['']], indices: [1]},
  ];
  it.each(cases)('$name', ({value, subjects, indices}) => {
    const books = subjects.map(names => Object.assign(new Book(), {CallNo: 'same', Title: 'same', Author: 'same', ISBn: 'same',
      Subject: names.map(Name => Object.assign(new Subject(), {Name}))}));
    getRepository(Book).push(...books);
    expectSameMembers(new SearchBook().searchBookBySubject(value), indices.map(index => books[index]));
  });
  it('rejects a non-String subject', () => expectPreconditionRejected(() => new SearchBook().searchBookBySubject(91 as unknown as string)));
});
