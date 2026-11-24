import {CashDesk, ManageCashDeskCRUDService, getRepository} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

describe('CoCoME/ManageCashDeskCRUDService/createCashDesk', () => {
  beforeEach(() => clearRepositories(getRepository(CashDesk)));

  it('creates exactly one stored CashDesk with the supplied fields', () => {
    const neighbor = Object.assign(new CashDesk(), {Id: 2, Name: 'neighbor', IsOpened: false});
    getRepository(CashDesk).push(neighbor);
    expect(new ManageCashDeskCRUDService().createCashDesk(1, 'test', true)).toBe(true);
    const created = getRepository(CashDesk).filter(item => item !== neighbor);
    expect(getRepository(CashDesk)).toHaveLength(2);
    expect(created).toHaveLength(1);
    expect(created[0]).toBeInstanceOf(CashDesk);
    expect(created[0].Id).toBe(1);
    expect(created[0].Name).toBe('test');
    expect(created[0].IsOpened).toBe(true);
    expect(getRepository(CashDesk)).toContain(neighbor);
  });

  it('rejects a duplicate ID without adding or replacing a CashDesk', () => {
    const existing = Object.assign(new CashDesk(), {Id: 1, Name: 'original', IsOpened: false});
    getRepository(CashDesk).push(existing);
    expectPreconditionRejected(() =>
      new ManageCashDeskCRUDService().createCashDesk(1, 'test', true)
    );
    expect(getRepository(CashDesk)).toEqual([existing]);
    expect(existing.Name).toBe('original');
    expect(existing.IsOpened).toBe(false);
  });
});
