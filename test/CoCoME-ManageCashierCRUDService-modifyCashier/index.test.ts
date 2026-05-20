import {Cashier, getRepository, ManageCashierCRUDService} from './entry';
describe('CoCoME/ManageCashierCRUDService/modifyCashier', () => {
  it('Happy Path', () => {
    const service = new ManageCashierCRUDService();
    const cashier = new Cashier();
    cashier.Id = 1;
    cashier.Name = 'test';
    getRepository(Cashier).push(cashier);
    const result = service.modifyCashier(cashier.Id, 'modifiedName');
    expect(result).toBe(true);
    expect(cashier.Name).toBe('modifiedName');
  });
});
