import {CashDesk, getRepository, ManageCashDeskCRUDService} from './entry';
describe('CoCoME/ManageCashDeskCRUDService/createCashDesk', () => {
  it('Happy Path', () => {
    const service = new ManageCashDeskCRUDService();
    const result = service.createCashDesk(1, 'test', true);
    expect(result).toBe(true);
    expect(getRepository(CashDesk).find((e) => e.Id === 1)).toBeDefined();
  });
});
