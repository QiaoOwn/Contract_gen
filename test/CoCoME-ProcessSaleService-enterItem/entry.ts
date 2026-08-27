import dayjs from 'dayjs';
import {
  evaluateDefinition,
  l,
  OCLExecutionTrace,
  OCLStateSnapshot,
  PostconditionError,
  PreconditionError,
  StandardOPs,
} from '../globalEntry';
/*The place where items are sold*/
class Store {
  /*Store ID*/
  Id: number;
  /*Store Name*/
  Name: string;
  /*Store Address*/
  Address: string;
  /*Store Open Status*/
  IsOpened: boolean;
  /*Store has multiple CashDesks*/
  AssociationCashdeskes: CashDesk[];
  /*Store has multiple ProductCatalogs*/
  Productcatalogs: ProductCatalog[];
  /*Store has multiple Items*/
  Items: Item[];
  /*Store has multiple Cashiers*/
  Cashiers: Cashier[];
  /*Store has multiple Sales*/
  Sales: Sale[];
}
/*The catalogue of items*/
class ProductCatalog {
  /*ProductCatalog ID*/
  Id: number;
  /*ProductCatalog Name*/
  Name: string;
  /*ProductCatalog contains multiple Items*/
  ContainedItems: Item;
}
/*The cash desk in store*/
class CashDesk {
  /*CashDesk ID*/
  Id: number;
  /*CashDesk Name*/
  Name: string;
  /*CashDesk Open Status*/
  IsOpened: boolean;
  /*CashDesk handles multiple Sales*/
  ContainedSales: Sale[];
  /*CashDesk belongs to one Store*/
  BelongedStore: Store;
}
/*The sales order for items*/
class Sale {
  /*Sale Time*/
  Time: dayjs.Dayjs;
  /*Sale Completion Status*/
  IsComplete: boolean;
  /*Total Amount*/
  Amount: number;
  /*Ready to Pay Status*/
  IsReadytoPay: boolean;
  /*Sale belongs to a Store*/
  Belongedstore: Store;
  /*Sale belongs to a CashDesk*/
  BelongedCashDesk: CashDesk;
  /*Sale contains multiple SalesLineItems*/
  ContainedSalesLine: SalesLineItem[];
  /*Sale is associated with a Payment*/
  AssoicatedPayment: Payment;
}
/*The cashier in store*/
class Cashier {
  /*Cashier ID*/
  Id: number;
  /*Cashier Name*/
  Name: string;
  /*Cashier works at one Store*/
  WorkedStore: Store;
}
/*The sales order for a single item*/
class SalesLineItem {
  /*Item Quantity*/
  Quantity: number;
  /*Sub Amount*/
  Subamount: number;
  /*SalesLineItem belongs to a Sale*/
  BelongedSale: Sale;
  /*SalesLineItem refers to an Item*/
  BelongedItem: Item;
}
/*The item to be sold*/
class Item {
  /*Item Barcode*/
  Barcode: number;
  /*Item Name*/
  Name: string;
  /*Item Price*/
  Price: number;
  /*Stock Number*/
  StockNumber: number;
  /*Order Price*/
  OrderPrice: number;
  /*Item belongs to a ProductCatalog*/
  BelongedCatalog: ProductCatalog;
}
/*The bill for the goods sold*/
class Payment {
  /*Amount Tendered*/
  AmountTendered: number;
  /*Payment belongs to a Sale*/
  BelongedSale: Sale;
}
/*Pay in cash*/
class CashPayment extends Payment {
  /*Change to be returned*/
  Balance: number;
}
/*Pay by card*/
class CardPayment extends Payment {
  /*Card Account Number*/
  CardAccountNumber: string;
  /*Card Expiry Date*/
  ExpiryDate: dayjs.Dayjs;
}
/*The purchase order for an item*/
class OrderEntry {
  /*Quantity Ordered*/
  Quantity: number;
  /*Sub Amount*/
  SubAmount: number;
  /*OrderEntry refers to an Item*/
  Item: Item;
}
/*The supplier of items*/
class Supplier {
  /*Supplier ID*/
  Id: number;
  /*Supplier Name*/
  Name: string;
}
/*The purchase order for items*/
class OrderProduct {
  /*OrderProduct ID*/
  Id: number;
  /*Order Time*/
  Time: dayjs.Dayjs;
  /*Order Status*/
  OrderStatus: OrderStatus;
  /*Total Amount*/
  Amount: number;
  /*OrderProduct is associated with a Supplier*/
  Supplier: Supplier;
  /*OrderProduct contains multiple OrderEntries*/
  ContainedEntries: OrderEntry[];
}
enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
}
enum OrderStatus {
  NEW = 'NEW',
  RECEIVED = 'RECEIVED',
  REQUESTED = 'REQUESTED',
}
const map = new Map();
map.set(Store, []);
map.set(ProductCatalog, []);
map.set(CashDesk, []);
map.set(Sale, []);
map.set(Cashier, []);
map.set(SalesLineItem, []);
map.set(Item, []);
map.set(Payment, []);
map.set(CashPayment, []);
map.set(CardPayment, []);
map.set(OrderEntry, []);
map.set(Supplier, []);
map.set(OrderProduct, []);
const getRepository = <T>(clazz: new (...args: any[]) => T) => {
  return map.get(clazz) as T[];
};
export {
  PaymentMethod,
  OrderStatus,
  Store,
  ProductCatalog,
  CashDesk,
  Sale,
  Cashier,
  SalesLineItem,
  Item,
  Payment,
  CashPayment,
  CardPayment,
  OrderEntry,
  Supplier,
  OrderProduct,
  getRepository,
};

class ProcessSaleService {
  /*SystemVariable Start*/
  CurrentCashDesk: CashDesk;
  CurrentStore: Store;
  /*SystemVariable End*/

  /*TempVariable Start*/
  CurrentSaleLine: SalesLineItem;
  CurrentSale: Sale;
  CurrentPaymentMethod: PaymentMethod;
  /*TempVariable End*/

  /*Definition: The enterItem operation handles its intended business action in this system.
   *Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
   *Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.*/
  enterItem(barcode: number, quantity: number): boolean {
    /*Definition Start*/
    let item: Item = evaluateDefinition(
      () =>
        l({
          logic: () =>
            getRepository(Item).find(
              (i: Item) =>
                l({
                  logic: () => StandardOPs.oclEquals(i.Barcode, barcode),
                  description: 'i.Barcode=barcode',
                }).build().pass
            ),
          description: 'Item.allInstances()->any(i:Item|i.Barcode=barcode)',
        }).build().pass
    );
    /*Definition End*/

    /*Precondition Start*/
    const {errorMessage: preconditionErrorMessage, pass: isPreconditionPass} = l({
      logic: () => StandardOPs.oclEquals(StandardOPs.oclIsUndefined(this.CurrentSale), false),
      description: 'CurrentSale.oclIsUndefined()=false',
    })
      .and({
        logic: () => StandardOPs.oclEquals(this.CurrentSale.IsComplete, false),
        description: 'CurrentSale.IsComplete=false',
      })
      .and({
        logic: () => StandardOPs.oclEquals(StandardOPs.oclIsUndefined(item), false),
        description: 'item.oclIsUndefined()=false',
      })
      .and({
        logic: () => item.StockNumber > 0,
        description: 'item.StockNumber>0',
      })
      .build();
    if (!isPreconditionPass) {
      throw new PreconditionError(preconditionErrorMessage);
    }
    /*Precondition End*/

    /*OCL Pre-state Snapshot*/
    const oclState = new OCLStateSnapshot(map, [this]);
    /*OCL Effect Trace*/
    const oclExecutionTrace = new OCLExecutionTrace();
    const result = (() => {
      /*Postcondition Effects Start*/
      let sli: SalesLineItem;
      return l({
        execute: () => (sli = new SalesLineItem()),
        description: 'sli.oclIsNew()',
      })
        .and({
          execute: () => (this.CurrentSaleLine = sli),
          description: 'self.CurrentSaleLine=sli',
        })
        .and({
          execute: () => (sli.BelongedSale = this.CurrentSale),
          description: 'sli.BelongedSale=CurrentSale',
        })
        .and({
          execute: () => StandardOPs.includeIfAbsent(this.CurrentSale.ContainedSalesLine, sli),
          description: 'CurrentSale.ContainedSalesLine->includes(sli)',
        })
        .and({
          execute: () => (sli.Quantity = quantity),
          description: 'sli.Quantity=quantity',
        })
        .and({
          execute: () => (sli.BelongedItem = item),
          description: 'sli.BelongedItem=item',
        })
        .and({
          execute: () => (item.StockNumber = oclState.preValue(item, 'StockNumber') - quantity),
          description: 'item.StockNumber=item.StockNumber@pre-quantity',
        })
        .and({
          execute: () => (sli.Subamount = item.Price * quantity),
          description: 'sli.Subamount=item.Price*quantity',
        })
        .and({
          execute: () => StandardOPs.includeIfAbsent(getRepository(SalesLineItem), sli),
          description: 'SalesLineItem.allInstances()->includes(sli)',
        })
        .and({
          execute: () => true,
          description: 'result=true',
        })
        .build().value;
      /*Postcondition Effects End*/
    })();
    /*OCL Post-state Snapshot*/
    oclState.capturePost();
    const {errorMessage: postconditionErrorMessage, pass: isPostconditionPass} = (() => {
      /*Postcondition Check Start*/
      let sli: SalesLineItem = oclState.findNew(SalesLineItem);
      return l({
        logic: () => oclState.isNew(sli, SalesLineItem),
        description: 'sli.oclIsNew()',
      })
        .and({
          logic: () => StandardOPs.oclEquals(this.CurrentSaleLine, sli),
          description: 'self.CurrentSaleLine=sli',
        })
        .and({
          logic: () => StandardOPs.oclEquals(sli.BelongedSale, this.CurrentSale),
          description: 'sli.BelongedSale=CurrentSale',
        })
        .and({
          logic: () => StandardOPs.includes(this.CurrentSale.ContainedSalesLine, sli),
          description: 'CurrentSale.ContainedSalesLine->includes(sli)',
        })
        .and({
          logic: () => StandardOPs.oclEquals(sli.Quantity, quantity),
          description: 'sli.Quantity=quantity',
        })
        .and({
          logic: () => StandardOPs.oclEquals(sli.BelongedItem, item),
          description: 'sli.BelongedItem=item',
        })
        .and({
          logic: () =>
            StandardOPs.oclEquals(
              item.StockNumber,
              oclState.preValue(item, 'StockNumber') - quantity
            ),
          description: 'item.StockNumber=item.StockNumber@pre-quantity',
        })
        .and({
          logic: () => StandardOPs.oclEquals(sli.Subamount, item.Price * quantity),
          description: 'sli.Subamount=item.Price*quantity',
        })
        .and({
          logic: () => StandardOPs.includes(getRepository(SalesLineItem), sli),
          description: 'SalesLineItem.allInstances()->includes(sli)',
        })
        .and({
          logic: () => StandardOPs.oclEquals(result, true),
          description: 'result=true',
        })
        .build();
      /*Postcondition Check End*/
    })();
    if (!isPostconditionPass) {
      throw new PostconditionError(postconditionErrorMessage);
    }
    return result;
  }
}
export {ProcessSaleService};
