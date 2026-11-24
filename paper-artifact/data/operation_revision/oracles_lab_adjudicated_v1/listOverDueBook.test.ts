import {
  BookCopy,
  ListBookHistory,
  Loan,
  User,
  getRepository,
} from './listOverDueBook.reference';
import {clearRepositories, expectSameMembers} from '../../../test/helpers/contractOracle';

describe('lab adjudication: listOverDueBook', () => {
  beforeEach(() =>
    clearRepositories(getRepository(BookCopy), getRepository(Loan), getRepository(User))
  );

  it('returns distinct qualifying copies for the selected user only', () => {
    const service = new ListBookHistory();
    const user = new User();
    user.UserID = 'selected';
    const shared = new BookCopy();
    const unrelated = new BookCopy();
    const first = new Loan();
    first.LoanedCopy = shared;
    first.IsReturned = false;
    first.OverDueFee = 5;
    const second = new Loan();
    second.LoanedCopy = shared;
    second.IsReturned = false;
    second.OverDueFee = 7;
    const returned = new Loan();
    returned.LoanedCopy = unrelated;
    returned.IsReturned = true;
    returned.OverDueFee = 9;
    user.LoanedBook = [first, second, returned];
    const other = new User();
    other.UserID = 'other';
    const foreignLoan = new Loan();
    foreignLoan.LoanedCopy = unrelated;
    foreignLoan.IsReturned = false;
    foreignLoan.OverDueFee = 9;
    other.LoanedBook = [foreignLoan];
    getRepository(User).push(user, other);

    expectSameMembers(service.listOverDueBook('selected'), [shared]);
    expect(user.LoanedBook).toEqual([first, second, returned]);
    expect(other.LoanedBook).toEqual([foreignLoan]);
  });
});
