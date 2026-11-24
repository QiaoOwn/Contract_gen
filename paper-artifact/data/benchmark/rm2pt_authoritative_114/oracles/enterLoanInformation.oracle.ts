import {LoanRequest,SubmitLoanRequestModule,getRepository} from './entry';
import {expectPreconditionRejected} from '../helpers/contractOracle';
const fields=['RequestID','Name','LoanAmount','LoanPurpose','Income','PhoneNumber','PostalAddress',
  'ZipCode','Email','WorkReferences','CreditReferences','CheckingAccountNumber','SecurityNumber'] as const;
const values=[173,'Alice',5100.75,'Equipment',8400.25,15400001,'Main Street',50311,
  'alice@example.org','Employer One','Bank Two',20731,87019] as const;
describe('enterLoanInformation source boundaries',()=>{
  beforeEach(()=>{getRepository(LoanRequest).splice(0);});
  it('stores all thirteen supplied fields and selects the new request',()=>{
    const service=new SubmitLoanRequestModule();
    const existing=Object.assign(new LoanRequest(),{RequestID:999});
    getRepository(LoanRequest).push(existing);
    expect(service.enterLoanInformation(...values)).toBe(true);
    expect(getRepository(LoanRequest)).toHaveLength(2);
    const created=getRepository(LoanRequest).find(request=>request!==existing)!;
    fields.forEach((field,i)=>expect(created[field]).toBe(values[i]));
    expect(service.CurrentLoanRequest).toBe(created);
  });
  it('rejects an already used identifier without creating another request',()=>{
    const service=new SubmitLoanRequestModule();
    const existing=Object.assign(new LoanRequest(),{RequestID:173});
    getRepository(LoanRequest).push(existing);
    expectPreconditionRejected(()=>service.enterLoanInformation(...values));
    expect(getRepository(LoanRequest)).toEqual([existing]);
  });
});
