import {CoCoMEOrderProducts, Item, getRepository} from './entry';
import {expectSameMembers} from '../helpers/contractOracle';

describe('Source-aligned exactly-zero stock selection', () => {
  beforeEach(() => getRepository(Item).splice(0));
  it.each([[], [0], [0, 12, -9, 0], [17, -11], [0, 0, 0], [0, 0], [6, 0, 0, -8, 19]].map(stocks => ({stocks})))(
    'selects zero-stock object identities from $stocks', ({stocks}) => {
      const items = stocks.map(StockNumber => Object.assign(new Item(), {Barcode: 931, StockNumber, Price: 21.75, OrderPrice: 8.5}));
      getRepository(Item).push(...items);
      const expected: Item[] = [];
      for (let i = 0; i < stocks.length; i++) if (stocks[i] === 0) expected.push(items[i]);
      expectSameMembers(new CoCoMEOrderProducts().listAllOutOfStoreProducts(), expected);
    });
});
