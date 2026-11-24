import {Item, ManageItemCRUDService, getRepository} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

describe('CoCoME/ManageItemCRUDService/modifyItem', () => {
  beforeEach(() => clearRepositories(getRepository(Item)));

  it('updates the selected stored Item and leaves a neighbor unchanged', () => {
    const target = Object.assign(new Item(), {Barcode: 1, Name: 'old', Price: 1, StockNumber: 1, OrderPrice: 1});
    const neighbor = Object.assign(new Item(), {Barcode: 2, Name: 'neighbor', Price: 10, StockNumber: 11, OrderPrice: 12});
    getRepository(Item).push(neighbor, target);
    expect(new ManageItemCRUDService().modifyItem(1, 'new', 3, 4, 5)).toBe(true);
    expect(getRepository(Item)).toEqual([neighbor, target]);
    expect(target.Barcode).toBe(1);
    expect(target.Name).toBe('new');
    expect(target.Price).toBe(3);
    expect(target.StockNumber).toBe(4);
    expect(target.OrderPrice).toBe(5);
    expect(neighbor.Name).toBe('neighbor');
    expect(neighbor.Price).toBe(10);
    expect(neighbor.StockNumber).toBe(11);
    expect(neighbor.OrderPrice).toBe(12);
  });

  it('rejects a missing Item without mutating the repository', () => {
    const neighbor = Object.assign(new Item(), {Barcode: 2, Name: 'neighbor'});
    getRepository(Item).push(neighbor);
    expectPreconditionRejected(() => new ManageItemCRUDService().modifyItem(99, 'new', 3, 4, 5));
    expect(getRepository(Item)).toEqual([neighbor]);
    expect(neighbor.Name).toBe('neighbor');
  });
});
