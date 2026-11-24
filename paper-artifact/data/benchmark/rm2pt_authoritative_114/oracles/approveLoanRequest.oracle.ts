import {LoanRequest,LoanRequestStatus,EvaluateLoanRequestModule,getRepository} from './entry';
import {expectPreconditionRejected} from '../helpers/contractOracle';

describe('approveLoanRequest source boundaries',()=>{
  beforeEach(()=>{getRepository(LoanRequest).splice(0);});
  it('approves the selected request and returns true',()=>{
    const service=new EvaluateLoanRequestModule();
    const other=Object.assign(new LoanRequest(),{RequestID:11,Status:LoanRequestStatus.SUBMITTED});
    const selected=Object.assign(new LoanRequest(),{RequestID:22,Status:LoanRequestStatus.REFERENCESVALIDATED});
    getRepository(LoanRequest).push(other,selected);
    service.CurrentLoanRequest=selected;
    expect(service.approveLoanRequest()).toBe(true);
    expect(selected.Status).toBe(LoanRequestStatus.APPROVED);
  });
  it('rejects without a current request despite other requests existing',()=>{
    const service=new EvaluateLoanRequestModule();
    getRepository(LoanRequest).push(new LoanRequest());
    expectPreconditionRejected(()=>service.approveLoanRequest());
  });
});
