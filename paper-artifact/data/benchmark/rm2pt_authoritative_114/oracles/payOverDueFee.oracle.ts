import dayjs from 'dayjs';
import {LibraryManagementSystemSystem, User, Loan, getRepository} from './entry';
import {expectPreconditionRejected} from '../helpers/contractOracle';

describe('payment of outstanding overdue fees', () => {
  beforeEach(() => { getRepository(User).splice(0); getRepository(Loan).splice(0); });
  function reader(id: string, balance: number) {
    const u = Object.assign(new User(), {UserID:id, OverDueFee:balance});
    getRepository(User).push(u); return u;
  }
  function record(owner:User, amount:number, days:number, returned:boolean) {
    const l = Object.assign(new Loan(), {LoanedUser:owner, OverDueFee:amount, DueDate:dayjs().startOf('day').add(days,'day'), IsReturned:returned});
    getRepository(Loan).push(l); return l;
  }
  const pay = (amount:number) => new LibraryManagementSystemSystem().payOverDueFee('reader',amount);
  test.each([[2.25,2.25],[6,7.5],[0,0]])('accepts balance %s and payment %s', (balance,amount) => {
    reader('neighbor',17); const u = reader('reader',balance);
    const a = record(u,11,-4,true), b = record(u,3.25,-1,true);
    expect(pay(amount)).toBe(true);
    expect([u.OverDueFee,a.OverDueFee,b.OverDueFee]).toEqual([0,0,0]);
  });
  test('rejects absent reader', () => {
    record(reader('another',1),1,-2,true); expectPreconditionRejected(()=>pay(15));
  });
  test('rejects insufficient payment even when it covers every individual loan', () => {
    record(reader('reader',10),1,-1,true); expectPreconditionRejected(()=>pay(9.75));
  });
  test.each(['empty','another reader','still borrowed','due today','future due','zero fee','negative fee'])('rejects when the only evidence is %s', reason => {
    const u = reader('reader',1);
    if (reason!=='empty') record(reason==='another reader'?reader('foreign',2):u,
      reason==='zero fee'?0:reason==='negative fee'?-1:2, reason==='due today'?0:reason==='future due'?1:-1, reason!=='still borrowed');
    expectPreconditionRejected(()=>pay(30));
  });
});
