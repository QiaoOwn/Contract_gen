import dayjs from 'dayjs';
import {User,Student,Faculty,BookCopy,Loan,CopyStatus,BorrowStatus,Programme,LibraryManagementSystemSystem,getRepository} from './entry';
import {expectPreconditionRejected} from '../helpers/contractOracle';
describe('source renewal boundaries',()=>{
  beforeEach(()=>{getRepository(User).splice(0);getRepository(Student).splice(0);getRepository(Faculty).splice(0);getRepository(BookCopy).splice(0);getRepository(Loan).splice(0);});
  function setup(kind='bachelor',issue='') {
    const student=!['faculty','plain'].includes(kind);
    const u=student?new Student():kind==='faculty'?new Faculty():new User();
    u.UserID='acceptance-renew';u.BorrowStatus=issue==='suspended'?BorrowStatus.SUSPEND:BorrowStatus.NORMAL;
    if(u instanceof Student)u.Programme=kind==='master'?Programme.MASTER:kind==='phd'?Programme.PHD:Programme.BACHELOR;
    if(issue!=='no-user'){getRepository(User).push(u);if(u instanceof Student)getRepository(Student).push(u);if(u instanceof Faculty)getRepository(Faculty).push(u);}
    const c=Object.assign(new BookCopy(),{Barcode:'copy-29',Status:issue==='available'?CopyStatus.AVAILABLE:CopyStatus.LOANED,IsReserved:issue==='reserved'});
    if(issue!=='no-copy')getRepository(BookCopy).push(c);
    const due=dayjs().startOf('day').add(issue==='today'?0:issue==='past'?-2:13,'day');
    const count=issue==='limit'?(student?3:6):(student?2:5);
    const l=Object.assign(new Loan(),{LoanedUser:u,LoanedCopy:c,DueDate:due,RenewedTimes:count,IsReturned:kind==='returned',OverDueFee:issue==='fee'?2.75:0});
    getRepository(Loan).push(Object.assign(new Loan(),{...l,LoanedUser:new User()}),Object.assign(new Loan(),{...l,LoanedCopy:new BookCopy()}));
    if(issue!=='no-loan')getRepository(Loan).push(l);
    return {l,due,count,call:()=>new LibraryManagementSystemSystem().renewBook(u.UserID,c.Barcode)};
  }
  test.each([['bachelor',20],['master',40],['phd',60],['faculty',60],['plain',60],['returned',20]] as const)('renews %s by %s days',(kind,days)=>{
    const {l,due,count,call}=setup(kind),today=dayjs();
    expect(call()).toBe(true);expect(l.RenewedTimes).toBe(count+1);
    expect(l.RenewDate.isSame(today,'day')).toBe(true);
    expect(l.DueDate.isSame(due.add(days,'day'),'day')).toBe(true);
  });
  test.each(['no-user','suspended','no-copy','available','no-loan','reserved','today','past','fee'])('rejects %s',issue=>{
    expectPreconditionRejected(setup('bachelor',issue).call);
  });
  test.each(['bachelor','faculty'])('rejects %s at renewal limit',kind=>{
    expectPreconditionRejected(setup(kind,'limit').call);
  });
});
