import {getRepository, Item, ManageItemCRUDService, ProductCatalog} from './entry';
describe('CoCoME/ManageItemCRUDService/queryItem', () => {
  it('Happy Path', () => {
    const service = new ManageItemCRUDService();
    const item = new Item();
    item.Barcode = 1;
    item.Name = 'test';
    item.Price = 1;
    item.OrderPrice = 1;
    item.StockNumber = 1;
    getRepository(Item).push(item);
    const result = service.queryItem(1);
    expect(result).toBe(item);
  });
});
