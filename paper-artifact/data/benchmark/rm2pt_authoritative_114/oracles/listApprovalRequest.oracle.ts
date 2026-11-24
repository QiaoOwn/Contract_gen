import {LoanRequest,LoanRequestStatus,GenerateLoanLetterAndAgreementModule,getRepository} from './entry';
import {expectSameMembers} from '../helpers/contractOracle';

describe('listApprovalRequest source boundaries',()=>{
  beforeEach(()=>{getRepository(LoanRequest).splice(0);});
  it('returns and stores all and only approved requests',()=>{
    const service=new GenerateLoanLetterAndAgreementModule();
    const approved=Array.from({length:13},(_,i)=>Object.assign(new LoanRequest(),
      {RequestID:i+1,Status:LoanRequestStatus.APPROVED}));
    const submitted=Object.assign(new LoanRequest(),{RequestID:99,Status:LoanRequestStatus.SUBMITTED});
    getRepository(LoanRequest).push(submitted,...approved);
    service.CurrentLoanRequests=[submitted];
    expectSameMembers(service.listApprovalRequest(),approved);
    expectSameMembers(service.CurrentLoanRequests,approved);
  });
  it('returns a defined empty selection and clears a stale current list',()=>{
    const service=new GenerateLoanLetterAndAgreementModule();
    const submitted=Object.assign(new LoanRequest(),{RequestID:99,Status:LoanRequestStatus.SUBMITTED});
    getRepository(LoanRequest).push(submitted);
    service.CurrentLoanRequests=[submitted];
    expectSameMembers(service.listApprovalRequest(),[]);
    expectSameMembers(service.CurrentLoanRequests,[]);
  });
});
