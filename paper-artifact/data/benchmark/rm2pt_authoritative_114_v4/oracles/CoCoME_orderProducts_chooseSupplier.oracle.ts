import {CoCoMEOrderProducts, Supplier, OrderProduct, getRepository} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

describe('CoCoME/CoCoMEOrderProducts/chooseSupplier', () => {
  beforeEach(() => clearRepositories(getRepository(Supplier), getRepository(OrderProduct)));

  it('links only the current order to the selected Supplier identity', () => {
    const other = Object.assign(new Supplier(), {Id: 66, Name: 'Other'});
    const selected = Object.assign(new Supplier(), {Id: 351, Name: 'Selected'});
    const retained = Object.assign(new Supplier(), {Id: 902, Name: 'Retained'});
    getRepository(Supplier).push(other, selected, retained);
    const neighbor = Object.assign(new OrderProduct(), {Id: 44, Supplier: retained});
    const order = Object.assign(new OrderProduct(), {Id: 91, Supplier: other});
    getRepository(OrderProduct).push(neighbor, order);
    const service = new CoCoMEOrderProducts();
    service.CurrentOrderProduct = order;
    expect(service.chooseSupplier(351)).toBe(true);
    expect(order.Supplier).toBe(selected);
    expect(neighbor.Supplier).toBe(retained);
    expect(getRepository(OrderProduct)).toEqual([neighbor, order]);
    expect(getRepository(Supplier)).toEqual([other, selected, retained]);
  });

  it('rejects a missing supplier among other suppliers without changing orders', () => {
    const existing = Object.assign(new Supplier(), {Id: 66, Name: 'Existing'});
    getRepository(Supplier).push(existing);
    const order = Object.assign(new OrderProduct(), {Id: 17, Supplier: existing});
    getRepository(OrderProduct).push(order);
    const service = new CoCoMEOrderProducts();
    service.CurrentOrderProduct = order;
    expectPreconditionRejected(() => service.chooseSupplier(621));
    expect(order.Supplier).toBe(existing);
    expect(getRepository(OrderProduct)).toEqual([order]);
  });

  it('rejects an empty supplier repository', () => {
    const service = new CoCoMEOrderProducts();
    service.CurrentOrderProduct = new OrderProduct();
    expectPreconditionRejected(() => service.chooseSupplier(421));
  });

  it('rejects an absent current order with an existing supplier', () => {
    getRepository(Supplier).push(Object.assign(new Supplier(), {Id: 351}));
    expectPreconditionRejected(() => new CoCoMEOrderProducts().chooseSupplier(351));
  });
});
