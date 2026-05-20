import {Cashier, getRepository, ManageCashierCRUDService} from './entry';
describe('CoCoME/ManageCashierCRUDService/createCashier', () => {
  it('Happy Path', () => {
    const service = new ManageCashierCRUDService();
    const result = service.createCashier(1, 'test');
    expect(result).toBe(true);
    expect(getRepository(Cashier).find((e) => e.Id === 1 && e.Name === 'test')).toBeDefined();
  });
});
