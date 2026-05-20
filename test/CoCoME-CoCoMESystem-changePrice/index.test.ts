import {CoCoMESystem, getRepository, Item} from './entry';
describe('CoCoME/CoCoMESystem/changePrice', () => {
  it('Happy Path', () => {
    const service = new CoCoMESystem();
    const item = new Item();
    item.Barcode = 123;
    item.Price = 10;
    getRepository(Item).push(item);
    const result = service.changePrice(item.Barcode, 20);
    expect(result).toBe(true);
    expect(item.Price).toBe(20);
  });
});
