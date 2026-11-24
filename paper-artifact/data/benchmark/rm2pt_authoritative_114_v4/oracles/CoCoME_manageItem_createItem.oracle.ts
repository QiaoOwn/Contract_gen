import {Item, ManageItemCRUDService, getRepository} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

describe('CoCoME/ManageItemCRUDService/createItem', () => {
  beforeEach(() => clearRepositories(getRepository(Item)));

  it('creates exactly one stored Item with all supplied values', () => {
    const neighbor = Object.assign(new Item(), {Barcode: 2, Name: 'neighbor'});
    getRepository(Item).push(neighbor);
    expect(new ManageItemCRUDService().createItem(1, 'test', 3, 4, 5)).toBe(true);
    const created = getRepository(Item).filter(item => item !== neighbor);
    expect(getRepository(Item)).toHaveLength(2);
    expect(created).toHaveLength(1);
    expect(created[0]).toBeInstanceOf(Item);
    expect(created[0].Barcode).toBe(1);
    expect(created[0].Name).toBe('test');
    expect(created[0].Price).toBe(3);
    expect(created[0].StockNumber).toBe(4);
    expect(created[0].OrderPrice).toBe(5);
    expect(getRepository(Item)).toContain(neighbor);
  });

  it('rejects a duplicate barcode without creating or replacing an Item', () => {
    const existing = Object.assign(new Item(), {Barcode: 1, Name: 'original'});
    getRepository(Item).push(existing);
    expectPreconditionRejected(() => new ManageItemCRUDService().createItem(1, 'test', 3, 4, 5));
    expect(getRepository(Item)).toEqual([existing]);
    expect(existing.Name).toBe('original');
  });
});
