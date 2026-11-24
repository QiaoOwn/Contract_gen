import {LoanRequest,LoanRequestStatus,LoanAgreement,GenerateLoanLetterAndAgreementModule,getRepository} from './entry';
import {expectPreconditionRejected} from '../helpers/contractOracle';
describe('generateLoanAgreement source boundaries',()=>{
  beforeEach(()=>{getRepository(LoanRequest).splice(0);getRepository(LoanAgreement).splice(0);});
  it.each(['APPROVED','SUBMITTED'] as const)('creates and links an agreement when current status is %s',status=>{
    const service=new GenerateLoanLetterAndAgreementModule();
    const request=Object.assign(new LoanRequest(),{RequestID:22,Status:LoanRequestStatus[status]});
    service.CurrentLoanRequest=request;
    expect(service.generateLoanAgreement()).toBe(true);
    const agreements=getRepository(LoanAgreement);
    expect(agreements).toHaveLength(1);
    expect(agreements[0].Content).toBe('Loan Agreement');
    expect(request.AttachedLoanAgreement).toBe(agreements[0]);
  });
  it('rejects without a current request and creates nothing',()=>{
    const service=new GenerateLoanLetterAndAgreementModule();
    expectPreconditionRejected(()=>service.generateLoanAgreement());
    expect(getRepository(LoanAgreement)).toHaveLength(0);
  });
});
