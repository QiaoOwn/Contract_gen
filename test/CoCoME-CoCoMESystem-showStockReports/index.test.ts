import {CoCoMESystem, getRepository, Item} from './entry';
describe('CoCoME/CoCoMESystem/showStockReports', () => {
  it('Happy Path', () => {
    const service = new CoCoMESystem();
    const result = service.showStockReports();
    expect(result).toBe(getRepository(Item));
  });
});
