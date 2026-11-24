import {Item, ManageItemCRUDService, getRepository} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

describe('CoCoME/ManageItemCRUDService/deleteItem', () => {
  beforeEach(() => clearRepositories(getRepository(Item)));

  it('removes only the selected Item and returns true', () => {
    const target = Object.assign(new Item(), {Barcode: 1});
    const survivor = Object.assign(new Item(), {Barcode: 2});
    getRepository(Item).push(target, survivor);
    expect(new ManageItemCRUDService().deleteItem(1)).toBe(true);
    expect(getRepository(Item)).toEqual([survivor]);
  });

  it('rejects a missing Item without removing another Item', () => {
    const survivor = Object.assign(new Item(), {Barcode: 2});
    getRepository(Item).push(survivor);
    expectPreconditionRejected(() => new ManageItemCRUDService().deleteItem(99));
    expect(getRepository(Item)).toEqual([survivor]);
  });
});
