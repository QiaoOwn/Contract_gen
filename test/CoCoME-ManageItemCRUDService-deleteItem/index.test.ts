import {getRepository, Item, ManageItemCRUDService} from './entry';
describe('CoCoME/ManageItemCRUDService/deleteItem', () => {
  it('Happy Path', () => {
    const item = new Item();
    item.Barcode = 1;
    item.Name = 'test';
    item.Price = 1;
    item.OrderPrice = 1;
    item.StockNumber = 1;
    getRepository(Item).push(item);
    const service = new ManageItemCRUDService();
    const result = service.deleteItem(item.Barcode);
    expect(result).toBe(true);
    expect(getRepository(Item).length).toBe(0);
  });
});
