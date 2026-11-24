import {CashDesk, ManageCashDeskCRUDService, getRepository} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

describe('CoCoME/ManageCashDeskCRUDService/deleteCashDesk', () => {
  beforeEach(() => clearRepositories(getRepository(CashDesk)));

  it('removes the selected CashDesk, preserves its neighbor, and returns true', () => {
    const target = Object.assign(new CashDesk(), {Id: 1, Name: 'target', IsOpened: true});
    const neighbor = Object.assign(new CashDesk(), {Id: 2, Name: 'neighbor', IsOpened: false});
    getRepository(CashDesk).push(target, neighbor);
    expect(new ManageCashDeskCRUDService().deleteCashDesk(1)).toBe(true);
    expect(getRepository(CashDesk)).toEqual([neighbor]);
  });

  it('rejects a missing ID without removing another CashDesk', () => {
    const neighbor = Object.assign(new CashDesk(), {Id: 2, Name: 'neighbor', IsOpened: true});
    getRepository(CashDesk).push(neighbor);
    expectPreconditionRejected(() => new ManageCashDeskCRUDService().deleteCashDesk(99));
    expect(getRepository(CashDesk)).toEqual([neighbor]);
  });
});
