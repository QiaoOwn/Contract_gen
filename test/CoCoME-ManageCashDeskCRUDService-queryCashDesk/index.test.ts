import {CashDesk, getRepository, ManageCashDeskCRUDService} from './entry';
describe('CoCoME/ManageCashDeskCRUDService/queryCashDesk', () => {
  it('Happy Path', () => {
    const service = new ManageCashDeskCRUDService();
    const cashDesk = new CashDesk();
    cashDesk.Id = 1;
    getRepository(CashDesk).push(cashDesk);
    const result = service.queryCashDesk(cashDesk.Id);
    expect(result).toBe(cashDesk);
  });
});
