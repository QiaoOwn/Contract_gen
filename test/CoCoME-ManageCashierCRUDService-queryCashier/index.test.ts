import {Cashier, getRepository, ManageCashierCRUDService} from './entry';
describe('CoCoME/ManageCashierCRUDService/queryCashier', () => {
  it('Happy Path', () => {
    const service = new ManageCashierCRUDService();
    const cashier = new Cashier();
    cashier.Id = 1;
    cashier.Name = 'test';
    getRepository(Cashier).push(cashier);
    const result = service.queryCashier(cashier.Id);
    expect(result).toBe(cashier);
  });
});
