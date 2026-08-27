import systemService from './systemService';
import {Operation} from '../../model/Operation';
import {Parameter} from '../../model/Parameter';
import {ReturnedType} from '../../model/ReturnedType';
import {Service} from '../../model/Service';
import {TempVariable} from '../../model/TempVariable';
import {UseCase} from '../../model/UseCase';
import {StoreManager} from './actor';

const actors = [StoreManager];

const tempVariables = [new TempVariable({name: 'CurrentOrderProduct', type: 'OrderProduct'})];

const operations = [
  new Operation({
    name: 'makeNewOrder',
    description: `Definition: The makeNewOrder operation handles its intended business action in this system.
    Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
    Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.`,
    parameters: [new Parameter({name: 'orderid', type: 'Integer'})],
    returnType: new ReturnedType('Boolean'),
    definition: `o:OrderProduct = OrderProduct.allInstances()->any(o:OrderProduct | o.Id = orderid)`,
    precondition: `o.oclIsUndefined() = true`,
    postcondition: `
let op:OrderProduct in
op.oclIsNew() and
op.OrderStatus = OrderStatus::NEW and
op.Id = orderid and
op.Time = Now and
OrderProduct.allInstances()->includes(op) and
self.CurrentOrderProduct = op and
result = true`,
  }),
  new Operation({
    name: 'listAllOutOfStoreProducts',
    description: `Definition: The listAllOutOfStoreProducts operation handles its intended business action in this system.
    Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
    Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.`,
    returnType: new ReturnedType('Set(Item)'),
    precondition: `true`,
    postcondition: `
result = Item.allInstances()->select(item:Item | item.StockNumber = 0)`,
  }),
  new Operation({
    name: 'orderItem',
    description: `Definition: The orderItem operation handles its intended business action in this system.
    Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
    Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.`,
    parameters: [
      new Parameter({name: 'barcode', type: 'Integer'}),
      new Parameter({name: 'quantity', type: 'Integer'}),
    ],
    returnType: new ReturnedType('Boolean'),
    definition: `item:Item = Item.allInstances()->any(i:Item | i.Barcode = barcode)`,
    precondition: `item.oclIsUndefined() = false`,
    postcondition: `
let order:OrderEntry in
order.oclIsNew() and
order.Quantity = quantity and
order.SubAmount = item.OrderPrice * quantity and
order.Item = item and
OrderEntry.allInstances()->includes(order) and
CurrentOrderProduct.ContainedEntries->includes(order) and
result = true`,
  }),
  new Operation({
    name: 'chooseSupplier',
    description: `Definition: The chooseSupplier operation handles its intended business action in this system.
    Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
    Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.`,
    parameters: [new Parameter({name: 'supplierID', type: 'Integer'})],
    returnType: new ReturnedType('Boolean'),
    definition: `sup:Supplier = Supplier.allInstances()->any(s:Supplier | s.Id = supplierID)`,
    precondition: `
sup.oclIsUndefined() = false and
CurrentOrderProduct.oclIsUndefined() = false`,
    postcondition: `
CurrentOrderProduct.Supplier = sup and
result = true`,
  }),
  new Operation({
    name: 'placeOrder',
    description: `Definition: The placeOrder operation handles its intended business action in this system.
    Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
    Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.`,
    returnType: new ReturnedType('Boolean'),
    definition: `sub:Set(Real) = CurrentOrderProduct.ContainedEntries->collect(o:OrderEntry | o.SubAmount)`,
    precondition: `CurrentOrderProduct.oclIsUndefined() = false`,
    postcondition: `
CurrentOrderProduct.OrderStatus = OrderStatus::REQUESTED and
CurrentOrderProduct.Amount = CurrentOrderProduct.Amount@pre + sub.sum() and
result = true`,
  }),
];

const service = new Service({
  name: 'CoCoMEOrderProducts',
  operations,
  tempVariables,
});

const useCase = new UseCase({
  name: 'orderProducts',
  description: 'The store manager places an order for purchase',
  relatedService: service,
  systemService,
  involvedActors: actors,
});

export default useCase;
