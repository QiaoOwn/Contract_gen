import {Store, ManageStoreCRUDService, getRepository} from './entry';
import {expectPreconditionRejected} from '../helpers/contractOracle';

describe('Source-aligned queryStore: identifier lookup and object identity', () => {
  beforeEach(() => getRepository(Store).splice(0));
  const record = (id: number) => Object.assign(new Store(), {Id: id});
  const query = (id: number) => new ManageStoreCRUDService().queryStore(id);

  it('returns the target identity before a different record', () => {
    const target = record(7041), other = record(7099);
    getRepository(Store).push(target, other);
    expect(query(7041)).toBe(target);
  });
  it('returns the target identity after different records', () => {
    const target = record(8123);
    getRepository(Store).push(record(8110), record(8111), target);
    expect(query(8123)).toBe(target);
  });
  it('accepts an existing negative identifier without an extra domain restriction', () => {
    const target = record(-41);
    getRepository(Store).push(record(42), target);
    expect(query(-41)).toBe(target);
  });
  it('accepts an existing zero identifier', () => {
    const target = record(0);
    getRepository(Store).push(record(3), target);
    expect(query(0)).toBe(target);
  });
  it('rejects a missing identifier among existing records', () => {
    getRepository(Store).push(record(17), record(18));
    expectPreconditionRejected(() => query(99));
  });
  it('rejects a missing identifier in an empty repository', () => {
    expectPreconditionRejected(() => query(404));
  });
});

