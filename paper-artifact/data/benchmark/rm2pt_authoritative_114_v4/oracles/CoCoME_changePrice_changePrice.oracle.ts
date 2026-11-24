import {CoCoMESystem, Item, getRepository} from './entry';
import {expectPreconditionRejected} from '../helpers/contractOracle';

describe('CoCoME/changePrice/changePrice', () => {
  beforeEach(() => getRepository(Item).splice(0));

  it.each([
    {barcode: 871, price: 19.75},
    {barcode: 902, price: 0},
    {barcode: 431, price: -6.5},
    {barcode: 0, price: 28.25},
    {barcode: -53, price: 7.5},
  ])('sets only the selected Item price for $barcode to $price and keeps the neighbor', ({barcode, price}) => {
    const neighbor = Object.assign(new Item(), {Barcode: barcode + 31, Price: 19.5, OrderPrice: 3.5});
    const selected = Object.assign(new Item(), {Barcode: barcode, Price: 71.75, OrderPrice: 5.75});
    getRepository(Item).push(neighbor, selected);
    expect(new CoCoMESystem().changePrice(barcode, price)).toBe(true);
    expect(getRepository(Item)).toEqual([neighbor, selected]);
    expect(selected.Barcode).toBe(barcode);
    expect(selected.Price).toBe(price);
    expect(selected.OrderPrice).toBe(5.75);
    expect(neighbor.Barcode).toBe(barcode + 31);
    expect(neighbor.Price).toBe(19.5);
    expect(neighbor.OrderPrice).toBe(3.5);
  });

  it('rejects a missing barcode among other items without mutating them', () => {
    const present = Object.assign(new Item(), {Barcode: 714, Price: 13.25, OrderPrice: 2.5});
    getRepository(Item).push(present);
    expectPreconditionRejected(() => new CoCoMESystem().changePrice(811, 4.25));
    expect(getRepository(Item)).toEqual([present]);
    expect(present.Barcode).toBe(714);
    expect(present.Price).toBe(13.25);
    expect(present.OrderPrice).toBe(2.5);
  });

  it('rejects an empty repository', () =>
    expectPreconditionRejected(() => new CoCoMESystem().changePrice(442, 12.25)));
});
