import {getRepository, LoanRequest, SubmitLoanRequestModule} from './entry';
describe('LoanProcessingSystem/SubmitLoanRequestModule/enterLoanInformation', () => {
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
  });
});
