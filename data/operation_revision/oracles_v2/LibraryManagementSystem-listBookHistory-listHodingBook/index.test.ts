import {expectSameMembers} from '../helpers/setOracle';
import {
  Administrator,
  Book,
  BookCopy,
  Faculty,
  Librarian,
  ListBookHistory,
  Loan,
  RecommendBook,
  Reserve,
  Student,
  Subject,
  User,
  getRepository,
} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

describe('LibraryManagementSystem/ListBookHistory/listHodingBook', () => {
  beforeEach(() => {
    clearRepositories(
      getRepository(Administrator),
      getRepository(Book),
      getRepository(BookCopy),
      getRepository(Faculty),
      getRepository(Librarian),
      getRepository(Loan),
      getRepository(RecommendBook),
      getRepository(Reserve),
      getRepository(Student),
      getRepository(Subject),
      getRepository(User)
    );
  });

  it('Happy Path', () => {
    const service = new ListBookHistory();
    const user = new User();
    user.UserID = '1';
    const loan = new Loan();
    const loan1 = new Loan();
    loan.IsReturned = false;
    loan1.IsReturned = true;
    user.LoanedBook = [loan, loan1];
    getRepository(User).push(user);
    const result = service.listHodingBook(user.UserID);
    expectSameMembers(result, [loan]);
  });

  it('rejects when precondition is violated', () => {
    const service = new ListBookHistory();
    expectPreconditionRejected(() => service.listHodingBook('99'));
  });
});
