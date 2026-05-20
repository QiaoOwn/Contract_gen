import {getRepository, Item, ManageItemCRUDService} from './entry';
describe('CoCoME/ManageItemCRUDService/modifyItem', () => {
  it('Happy Path', () => {
    const service = new ManageItemCRUDService();
    const item = new Item();
    item.Barcode = 1;
    item.Name = 'test';
    item.Price = 1;
    item.OrderPrice = 1;
    item.StockNumber = 1;
    getRepository(Item).push(item);
    const result = service.modifyItem(item.Barcode, 'modifiedName', 2, 2, 2);
    expect(result).toBe(true);
    expect(item.Name).toBe('modifiedName');
    expect(item.Price).toBe(2);
    expect(item.OrderPrice).toBe(2);
    expect(item.StockNumber).toBe(2);
  });
});
