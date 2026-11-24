import {CoCoMEOrderProducts, Supplier, OrderProduct, getRepository} from './entry';
import {expectPreconditionRejected} from '../helpers/contractOracle';

describe('Source-aligned selected Supplier association', () => {
  beforeEach(() => {getRepository(Supplier).splice(0); getRepository(OrderProduct).splice(0);});
  it.each([{id: 517, replace: false}, {id: 831, replace: true}, {id: 629, replace: false},
    {id: 0, replace: false}, {id: -47, replace: true}])('links the exact supplier $id', ({id, replace}) => {
    const other = Object.assign(new Supplier(), {Id: id + 17, Name: 'Other'});
    const selected = Object.assign(new Supplier(), {Id: id, Name: 'Selected'});
    getRepository(Supplier).push(other, selected);
    const order = Object.assign(new OrderProduct(), {Id: 914, Supplier: replace ? other : undefined});
    const service = new CoCoMEOrderProducts(); service.CurrentOrderProduct = order;
    expect(service.chooseSupplier(id)).toBe(true);
    expect(order.Supplier).toBe(selected);
  });
  it('rejects a missing supplier among other suppliers', () => {
    getRepository(Supplier).push(Object.assign(new Supplier(), {Id: 66}));
    const service = new CoCoMEOrderProducts(); service.CurrentOrderProduct = new OrderProduct();
    expectPreconditionRejected(() => service.chooseSupplier(621));
  });
  it('rejects an empty supplier repository', () => {
    const service = new CoCoMEOrderProducts(); service.CurrentOrderProduct = new OrderProduct();
    expectPreconditionRejected(() => service.chooseSupplier(421));
  });
  it('rejects an absent current order with an existing supplier', () => {
    getRepository(Supplier).push(Object.assign(new Supplier(), {Id: 351}));
    expectPreconditionRejected(() => new CoCoMEOrderProducts().chooseSupplier(351));
  });
});
