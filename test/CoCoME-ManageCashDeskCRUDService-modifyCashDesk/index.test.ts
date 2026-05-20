import {CashDesk, getRepository, ManageCashDeskCRUDService} from './entry';
describe('CoCoME/ManageCashDeskCRUDService/modifyCashDesk', () => {
  it('Happy Path', () => {
    const service = new ManageCashDeskCRUDService();
    const cashDesk = new CashDesk();
    cashDesk.Id = 1;
    getRepository(CashDesk).push(cashDesk);
    const result = service.modifyCashDesk(cashDesk.Id, 'modifiedName', false);
    expect(result).toBe(true);
    expect(cashDesk.Name).toBe('modifiedName');
    expect(cashDesk.IsOpened).toBe(false);
  });
});
