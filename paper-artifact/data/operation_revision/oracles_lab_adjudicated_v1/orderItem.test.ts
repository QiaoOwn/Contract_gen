import {
  CoCoMEOrderProducts,
  Item,
  OrderEntry,
  getRepository,
} from './orderItem.reference';
import {clearRepositories, expectPreconditionRejected} from '../../../test/helpers/contractOracle';

describe('lab adjudication: orderItem', () => {
  beforeEach(() => clearRepositories(getRepository(Item), getRepository(OrderEntry)));

  it('rejects a missing current order without creating an entry', () => {
    const service = new CoCoMEOrderProducts();
    const item = new Item();
    item.Barcode = 7;
    item.OrderPrice = 3;
    getRepository(Item).push(item);

    expectPreconditionRejected(() => service.orderItem(7, 2));
    expect(getRepository(OrderEntry)).toHaveLength(0);
    expect(getRepository(Item)).toEqual([item]);
  });
});
