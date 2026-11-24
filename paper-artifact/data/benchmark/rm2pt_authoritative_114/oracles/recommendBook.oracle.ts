import dayjs from 'dayjs';
import {User, RecommendBook, LibraryManagementSystemSystem, getRepository} from './entry';
import {expectPreconditionRejected} from '../helpers/contractOracle';

describe('recommend a book',()=>{
  beforeEach(()=>{getRepository(User).splice(0);getRepository(RecommendBook).splice(0);});
  function reader(id:string) {
    const u=Object.assign(new User(),{UserID:id,RecommendedBook:[] as RecommendBook[]});
    getRepository(User).push(u); return u;
  }
  function existing(u:User,call:string) {
    const r=Object.assign(new RecommendBook(),{CallNo:call,RecommendUser:u});
    u.RecommendedBook.push(r);getRepository(RecommendBook).push(r);
  }
  test.each(['K17',''])('stores and associates one fresh witness for call number %j',call=>{
    existing(reader('someone-else'),'K18');
    const u=reader('target'), before=new Set(getRepository(RecommendBook)), date=dayjs();
    expect(new LibraryManagementSystemSystem().recommendBook('target',call,'Volume','Second','Writer','Press','Notes','007')).toBe(true);
    expect(getRepository(RecommendBook).some(r=>r instanceof RecommendBook && !before.has(r) &&
      r.CallNo===call && r.Title==='Volume' && r.Edition==='Second' && r.Author==='Writer' && r.Publisher==='Press' &&
      r.Description==='Notes' && r.ISBn==='007' && r.RecommendDate?.isSame(date,'day') &&
      r.RecommendUser===u && u.RecommendedBook.includes(r))).toBe(true);
  });
  test('requires the requested reader',()=>{
    reader('different');
    expectPreconditionRejected(()=>new LibraryManagementSystemSystem().recommendBook('absent','A','B','C','D','E','F','G'));
  });
  test.each(['target','other'])('rejects an existing call number recommended by %s',owner=>{
    const target=reader('target'), other=reader('other');
    existing(owner==='target'?target:other,'taken');
    expectPreconditionRejected(()=>new LibraryManagementSystemSystem().recommendBook('target','taken','B','C','D','E','F','G'));
  });
});
