import {getRepository, Item, ManageItemCRUDService} from './entry';
describe('CoCoME/ManageItemCRUDService/createItem', () => {
  it('Happy Path', () => {
    const service = new ManageItemCRUDService();
    const result = service.createItem(1, 'test', 1, 1, 1);
    expect(result).toBe(true);
    expect(
      getRepository(Item).find(
        (e) =>
          e.Barcode === 1 &&
          e.Name === 'test' &&
          e.Price === 1 &&
          e.StockNumber === 1 &&
          e.OrderPrice === 1
      )
    ).toBeDefined();
  });
});
