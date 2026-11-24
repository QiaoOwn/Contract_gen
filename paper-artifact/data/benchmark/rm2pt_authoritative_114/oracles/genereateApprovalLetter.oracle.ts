import {LoanRequest,ApprovalLetter,GenerateLoanLetterAndAgreementModule,getRepository} from './entry';
import {expectPreconditionRejected} from '../helpers/contractOracle';
describe('genereateApprovalLetter source boundaries',()=>{
  beforeEach(()=>{getRepository(LoanRequest).splice(0);getRepository(ApprovalLetter).splice(0);});
  it('creates, stores and links a letter to the request selected by ID',()=>{
    const service=new GenerateLoanLetterAndAgreementModule();
    const first=Object.assign(new LoanRequest(),{RequestID:11});
    const second=Object.assign(new LoanRequest(),{RequestID:22});
    getRepository(LoanRequest).push(first,second);
    service.CurrentLoanRequest=first;
    expect(service.genereateApprovalLetter(22)).toBe(true);
    const letters=getRepository(ApprovalLetter);
    expect(letters).toHaveLength(1);
    expect(letters[0].Content).toBe('ApprovalLetterContent');
    expect(second.AttachedApprovalLetter).toBe(letters[0]);
    expect(service.CurrentLoanRequest).toBe(second);
  });
  it('rejects an unknown ID despite another request existing',()=>{
    const service=new GenerateLoanLetterAndAgreementModule();
    getRepository(LoanRequest).push(Object.assign(new LoanRequest(),{RequestID:11}));
    expectPreconditionRejected(()=>service.genereateApprovalLetter(99));
    expect(getRepository(ApprovalLetter)).toHaveLength(0);
  });
});
