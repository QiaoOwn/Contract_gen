import {Cashier, getRepository, ManageCashierCRUDService} from './entry';
describe('CoCoME/ManageCashierCRUDService/deleteCashier', () => {
  it('Happy Path', () => {
    const service = new ManageCashierCRUDService();
    const cashier = new Cashier();
    cashier.Id = 1;
    cashier.Name = 'test';
    getRepository(Cashier).push(cashier);
    const result = service.deleteCashier(1);
    expect(result).toBe(true);
    expect(getRepository(Cashier).length).toBe(0);
  });
});
