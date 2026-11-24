import {CoCoMESystem, Item, getRepository} from './entry';
import {expectSameMembers} from '../helpers/contractOracle';

describe('Source-aligned complete stock result', () => {
  beforeEach(() => getRepository(Item).splice(0));
  it.each([[], [21], [9, 0, -8], [-13, -7], [0], [0, 0]].map(stocks => ({stocks})))('returns every registered item for stock $stocks', ({stocks}) => {
    const items = stocks.map(StockNumber => Object.assign(new Item(), {Barcode: 614, StockNumber, Price: 12.5, OrderPrice: 4.25}));
    getRepository(Item).push(...items);
    expectSameMembers(new CoCoMESystem().showStockReports(), items);
  });
});
