import {CashDesk, ManageCashDeskCRUDService, getRepository} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

describe('CoCoME/ManageCashDeskCRUDService/modifyCashDesk', () => {
  beforeEach(() => clearRepositories(getRepository(CashDesk)));

  it('updates only the selected CashDesk and returns true', () => {
    const target = Object.assign(new CashDesk(), {Id: 1, Name: 'old', IsOpened: true});
    const neighbor = Object.assign(new CashDesk(), {Id: 2, Name: 'neighbor', IsOpened: false});
    getRepository(CashDesk).push(target, neighbor);
    expect(new ManageCashDeskCRUDService().modifyCashDesk(1, 'modifiedName', false)).toBe(true);
    expect(getRepository(CashDesk)).toEqual([target, neighbor]);
    expect(target.Id).toBe(1);
    expect(target.Name).toBe('modifiedName');
    expect(target.IsOpened).toBe(false);
    expect(neighbor.Name).toBe('neighbor');
    expect(neighbor.IsOpened).toBe(false);
  });

  it('rejects a missing ID without changing another CashDesk', () => {
    const neighbor = Object.assign(new CashDesk(), {Id: 2, Name: 'neighbor', IsOpened: true});
    getRepository(CashDesk).push(neighbor);
    expectPreconditionRejected(() =>
      new ManageCashDeskCRUDService().modifyCashDesk(99, 'modifiedName', false)
    );
    expect(getRepository(CashDesk)).toEqual([neighbor]);
    expect(neighbor.Name).toBe('neighbor');
    expect(neighbor.IsOpened).toBe(true);
  });
});
