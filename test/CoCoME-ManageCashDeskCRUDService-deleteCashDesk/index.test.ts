import {CashDesk, getRepository, ManageCashDeskCRUDService} from './entry';
describe('CoCoME/ManageCashDeskCRUDService/deleteCashDesk', () => {
  it('Happy Path', () => {
    const service = new ManageCashDeskCRUDService();
    const cashDesk = new CashDesk();
    cashDesk.Id = 1;
    getRepository(CashDesk).push(cashDesk);
    const result = service.deleteCashDesk(1);
    expect(result).toBe(true);
    expect(getRepository(CashDesk).length).toBe(0);
  });
});
