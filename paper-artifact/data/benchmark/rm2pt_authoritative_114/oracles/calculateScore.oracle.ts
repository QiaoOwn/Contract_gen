import {LoanRequest,LoanRequestStatus,CheckingAccount,CreditHistory,SubmitLoanRequestModule,
  getRepository} from './entry';
import {expectPreconditionRejected} from '../helpers/contractOracle';
describe('calculateScore source boundaries',()=>{
  beforeEach(()=>{getRepository(LoanRequest).splice(0);});
  it('sets the current request score and status and returns that score',()=>{
    const service=new SubmitLoanRequestModule();
    const other=Object.assign(new LoanRequest(),{RequestID:11,CreditScore:5});
    const selected=Object.assign(new LoanRequest(),{RequestID:22,CreditScore:7,
      Status:LoanRequestStatus.APPROVED,RequestedCAHistory:new CheckingAccount(),
      RequestedCreditHistory:new CreditHistory()});
    getRepository(LoanRequest).push(other,selected);
    service.CurrentLoanRequest=selected;
    expect(service.calculateScore()).toBe(100);
    expect(selected.CreditScore).toBe(100);
    expect(selected.Status).toBe(LoanRequestStatus.SUBMITTED);
  });
  it('rejects without the current request',()=>{
    expectPreconditionRejected(()=>new SubmitLoanRequestModule().calculateScore());
  });
  it.each(['RequestedCAHistory','RequestedCreditHistory'] as const)
  ('rejects without %s',missing=>{
    const service=new SubmitLoanRequestModule();
    const request=new LoanRequest();
    request.RequestedCAHistory=new CheckingAccount();
    request.RequestedCreditHistory=new CreditHistory();
    request[missing]=undefined;
    service.CurrentLoanRequest=request;
    expectPreconditionRejected(()=>service.calculateScore());
  });
});
