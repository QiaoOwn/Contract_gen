import {
  ApprovalLetter,
  CheckingAccount,
  CreditHistory,
  Loan,
  LoanAccount,
  LoanAgreement,
  LoanRequest,
  LoanTerm,
  SubmitLoanRequestModule,
  getRepository,
} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

describe('LoanProcessingSystem/SubmitLoanRequestModule/enterLoanInformation', () => {
  beforeEach(() => {
    clearRepositories(
      getRepository(ApprovalLetter),
      getRepository(CheckingAccount),
      getRepository(CreditHistory),
      getRepository(Loan),
      getRepository(LoanAccount),
      getRepository(LoanAgreement),
      getRepository(LoanRequest),
      getRepository(LoanTerm)
    );
  });

  it('Happy Path', () => {
    const service = new SubmitLoanRequestModule();
    const result = service.enterLoanInformation(
      1,
      '2',
      3,
      '4',
      5,
      6,
      '7',
      8,
      '9',
      '10',
      '11',
      12,
      13
    );
    expect(result).toBe(true);
    const loanRequest = getRepository(LoanRequest)[0];
    expect(loanRequest.RequestID).toBe(1);
    expect(loanRequest.Name).toBe('2');
    expect(loanRequest.LoanAmount).toBe(3);
    expect(loanRequest.LoanPurpose).toBe('4');
    expect(loanRequest.Income).toBe(5);
    expect(loanRequest.PhoneNumber).toBe(6);
    expect(loanRequest.PostalAddress).toBe('7');
    expect(loanRequest.ZipCode).toBe(8);
    expect(loanRequest.Email).toBe('9');
    expect(loanRequest.WorkReferences).toBe('10');
    expect(loanRequest.CreditReferences).toBe('11');
    expect(loanRequest.CheckingAccountNumber).toBe(12);
    expect(loanRequest.SecurityNumber).toBe(13);
    expect(service.CurrentLoanRequest).toBe(loanRequest);
  });

  it('rejects when request id already exists', () => {
    const service = new SubmitLoanRequestModule();
    const existing = new LoanRequest();
    existing.RequestID = 1;
    getRepository(LoanRequest).push(existing);
    expectPreconditionRejected(() =>
      service.enterLoanInformation(1, '2', 3, '4', 5, 6, '7', 8, '9', '10', '11', 12, 13)
    );
    expect(getRepository(LoanRequest)).toHaveLength(1);
    expect(getRepository(LoanRequest)[0]).toBe(existing);
  });
});
