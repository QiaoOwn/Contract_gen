import systemService from './systemService';
import {Operation} from '../../model/Operation';
import {Parameter} from '../../model/Parameter';
import {ReturnedType} from '../../model/ReturnedType';
import {Service} from '../../model/Service';
import {TempVariable} from '../../model/TempVariable';
import {UseCase} from '../../model/UseCase';
import {Cashier} from './actor';

const actors = [Cashier];

const tempVariables = [
  new TempVariable({name: 'CurrentSaleLine', type: 'SalesLineItem'}),
  new TempVariable({name: 'CurrentSale', type: 'Sale'}),
  new TempVariable({
    name: 'CurrentPaymentMethod',
    type: 'PaymentMethod[CASH|CARD]',
  }),
];

const operations = [
  new Operation({
    name: 'makeNewSale',
    description: `Definition: The makeNewSale operation handles its intended business action in this system.
    Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
    Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.`,
    returnType: new ReturnedType('Boolean'),
    precondition: `
    CurrentCashDesk.oclIsUndefined() = false and
    CurrentCashDesk.IsOpened = true and
    (CurrentSale.oclIsUndefined() = true or
    (CurrentSale.oclIsUndefined() = false and
        CurrentSale.IsComplete = true
    )
    )`,
    postcondition: `
    let s:Sale in
    s.oclIsNew() and
    s.BelongedCashDesk = CurrentCashDesk and
    CurrentCashDesk.ContainedSales->includes(s) and
    s.IsComplete = false and
    s.IsReadytoPay = false and
    Sale.allInstance()->includes(s) and
    self.CurrentSale = s and
    result = true`,
  }),
  new Operation({
    name: 'enterItem',
    description: `Definition: The enterItem operation handles its intended business action in this system.
    Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
    Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.`,
    parameters: [
      new Parameter({name: 'barcode', type: 'Integer'}),
      new Parameter({name: 'quantity', type: 'Integer'}),
    ],
    returnType: new ReturnedType('Boolean'),
    definition: `item:Item = Item.allInstance()->any(i:Item | i.Barcode = barcode)`,
    precondition: `
CurrentSale.oclIsUndefined() = false and
CurrentSale.IsComplete = false and
item.oclIsUndefined() = false and
item.StockNumber > 0`,
    postcondition: `
let sli:SalesLineItem in
sli.oclIsNew() and
self.CurrentSaleLine = sli and
sli.BelongedSale = CurrentSale and
CurrentSale.ContainedSalesLine->includes(sli) and
sli.Quantity = quantity and
sli.BelongedItem = item and
item.StockNumber = item.StockNumber@pre - quantity and
sli.Subamount = item.Price * quantity and
SalesLineItem.allInstance()->includes(sli) and
result = true`,
  }),
  new Operation({
    name: 'endSale',
    description: `Definition: The endSale operation handles its intended business action in this system.
    Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
    Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.`,
    returnType: new ReturnedType('Real'),
    definition: `
sls:Set(SalesLineItem) = CurrentSale.ContainedSalesLine,
sub:Set(Real) = sls->collect(s:SalesLineItem | s.Subamount)`,
    precondition: `
CurrentSale.oclIsUndefined() = false and
CurrentSale.IsComplete = false and
CurrentSale.IsReadytoPay = false`,
    postcondition: `
CurrentSale.Amount = sub.sum() and
CurrentSale.IsReadytoPay = true and
result = CurrentSale.Amount`,
  }),
  new Operation({
    name: 'makeCashPayment',
    description: `Definition: The makeCashPayment operation handles its intended business action in this system.
    Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
    Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.`,
    parameters: [new Parameter({name: 'amount', type: 'Real'})],
    returnType: new ReturnedType('Boolean'),
    precondition: `
CurrentSale.oclIsUndefined() = false and
CurrentSale.IsComplete = false and
CurrentSale.IsReadytoPay = true and
amount >= CurrentSale.Amount`,
    postcondition: `
let cp:CashPayment in
cp.oclIsNew() and
cp.AmountTendered = amount and
cp.BelongedSale = CurrentSale and
CurrentSale.AssoicatedPayment = cp and
CurrentSale.Belongedstore = CurrentStore and
CurrentStore.Sales->includes(CurrentSale) and
CurrentSale.IsComplete = true and
CurrentSale.Time.isEqual(Now) and
cp.Balance = amount - CurrentSale.Amount and
CashPayment.allInstance()->includes(cp) and
result = true`,
  }),
  //   new Operation({
  //     name: 'makeCardPayment',
  //     description: `if the current sale exist and not complete
  //     and is ready to pay
  //     call the third party card payment service with the card account number and expiry date and fee.
  //     then create a card payment the amount tendered is the fee
  //     and the payment belonged sale is current sale
  //     and current sale's assoicated payment is the payment
  //     and the payment expiry date is provided the expiry date and save the card payment
  //     and current sale belonged store is current store
  //     and add current sale to the current store,and the current sale is complete,
  //     and the time is now`,
  //     parameters: [
  //       new Parameter({name: 'cardAccountNumber', type: 'String'}),
  //       new Parameter({name: 'expiryDate', type: 'Date'}),
  //       new Parameter({name: 'fee', type: 'Real'}),
  //     ],
  //     returnType: new ReturnedType('Boolean'),
  //     precondition: `
  // CurrentSale.oclIsUndefined() = false and
  // CurrentSale.IsComplete = false and
  // CurrentSale.IsReadytoPay = true and
  // thirdPartyCardPaymentService(cardAccountNumber, expiryDate, fee)`,
  //     postcondition: `
  // let cdp:CardPayment in
  // cdp.oclIsNew() and
  // cdp.AmountTendered = fee and
  // cdp.BelongedSale = CurrentSale and
  // CurrentSale.AssoicatedPayment = cdp and
  // cdp.CardAccountNumber = cardAccountNumber and
  // cdp.ExpiryDate = expiryDate and
  // CardPayment.allInstance()->includes(cdp) and
  // CurrentSale.Belongedstore = CurrentStore and
  // CurrentStore.Sales->includes(CurrentSale) and
  // CurrentSale.IsComplete = true and
  // CurrentSale.Time.isEqual(Now) and
  // result = true`,
  //   }),
];

const service = new Service({
  name: 'ProcessSaleService',
  operations,
  tempVariables,
});

const useCase = new UseCase({
  name: 'processSale',
  description: 'The cashier checks out items',
  relatedService: service,
  systemService,
  involvedActors: actors,
});

export default useCase;
