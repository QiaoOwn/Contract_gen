import {PreconditionError} from '../../../test/globalEntry';
import {
  CoCoMESystem as Original,
  Item,
  OrderProduct,
  OrderStatus,
  getRepository,
} from '../../../test/CoCoME-CoCoMESystem-receiveOrderedProduct/entry';

export * from '../../../test/CoCoME-CoCoMESystem-receiveOrderedProduct/entry';

export class CoCoMESystem extends Original {
  override receiveOrderedProduct(orderID: number): boolean {
    const order = getRepository(OrderProduct).find((candidate) => candidate.Id === orderID);
    if (!order) throw new PreconditionError('The specified product order must exist.');
    const increments = new Map<Item, number>();
    for (const entry of order.ContainedEntries) {
      increments.set(entry.Item, (increments.get(entry.Item) || 0) + entry.Quantity);
    }
    for (const [item, quantity] of increments) {
      item.StockNumber += quantity;
    }
    order.OrderStatus = OrderStatus.RECEIVED;
    return true;
  }
}
