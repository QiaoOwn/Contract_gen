import {CoCoMESystem, Item, getRepository} from './entry';
import {expectPreconditionRejected} from '../helpers/contractOracle';

describe('Source-aligned selected-item sale price update', () => {
  beforeEach(() => getRepository(Item).splice(0));
  it.each([{barcode: 871, price: 19.75}, {barcode: 902, price: 0}, {barcode: 431, price: -6.5},
    {barcode: 0, price: 28.25}, {barcode: -53, price: 7.5}])('sets price for $barcode to $price', ({barcode, price}) => {
    const other = Object.assign(new Item(), {Barcode: barcode + 31, Price: 19.5, OrderPrice: 3.5});
    const selected = Object.assign(new Item(), {Barcode: barcode, Price: 71.75, OrderPrice: 5.75});
    getRepository(Item).push(other, selected);
    expect(new CoCoMESystem().changePrice(barcode, price)).toBe(true);
    expect(selected.Price).toBe(price);
  });
  it('rejects a missing barcode among other items', () => {
    getRepository(Item).push(Object.assign(new Item(), {Barcode: 714, Price: 13.25}));
    expectPreconditionRejected(() => new CoCoMESystem().changePrice(811, 4.25));
  });
  it('rejects an empty repository', () => expectPreconditionRejected(() => new CoCoMESystem().changePrice(442, 12.25)));
});
