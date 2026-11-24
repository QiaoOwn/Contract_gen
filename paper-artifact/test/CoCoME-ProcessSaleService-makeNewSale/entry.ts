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

  /*Definition: The makeNewSale operation handles its intended business action in this system.
   *Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
   *Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.*/
  makeNewSale(): boolean {
    /*Precondition Start*/
    const {errorMessage: preconditionErrorMessage, pass: isPreconditionPass} = l({
      logic: () => StandardOPs.oclEquals(StandardOPs.oclIsUndefined(this.CurrentCashDesk), false),
      description: 'CurrentCashDesk.oclIsUndefined()=false',
    })
      .and({
        logic: () => StandardOPs.oclEquals(this.CurrentCashDesk.IsOpened, true),
        description: 'CurrentCashDesk.IsOpened=true',
      })
      .and({
        logic: () =>
          l({
            logic: () => StandardOPs.oclEquals(StandardOPs.oclIsUndefined(this.CurrentSale), true),
            description: 'CurrentSale.oclIsUndefined()=true',
          }).or({
            logic: () =>
              l({
                logic: () =>
                  StandardOPs.oclEquals(StandardOPs.oclIsUndefined(this.CurrentSale), false),
                description: 'CurrentSale.oclIsUndefined()=false',
              }).and({
                logic: () => StandardOPs.oclEquals(this.CurrentSale.IsComplete, true),
                description: 'CurrentSale.IsComplete=true',
              }),
            description: '(CurrentSale.oclIsUndefined()=falseandCurrentSale.IsComplete=true)',
          }),
        description:
          '(CurrentSale.oclIsUndefined()=trueor(CurrentSale.oclIsUndefined()=falseandCurrentSale.IsComplete=true))',
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
      let s: Sale;
      return l({
        execute: () => (s = new Sale()),
        description: 's.oclIsNew()',
      })
        .and({
          execute: () => (s.BelongedCashDesk = this.CurrentCashDesk),
          description: 's.BelongedCashDesk=CurrentCashDesk',
        })
        .and({
          execute: () => StandardOPs.includeIfAbsent(this.CurrentCashDesk.ContainedSales, s),
          description: 'CurrentCashDesk.ContainedSales->includes(s)',
        })
        .and({
          execute: () => (s.IsComplete = false),
          description: 's.IsComplete=false',
        })
        .and({
          execute: () => (s.IsReadytoPay = false),
          description: 's.IsReadytoPay=false',
        })
        .and({
          execute: () => StandardOPs.includeIfAbsent(getRepository(Sale), s),
          description: 'Sale.allInstances()->includes(s)',
        })
        .and({
          execute: () => (this.CurrentSale = s),
          description: 'self.CurrentSale=s',
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
      let s: Sale = oclState.findNew(Sale);
      return l({
        logic: () => oclState.isNew(s, Sale),
        description: 's.oclIsNew()',
      })
        .and({
          logic: () => StandardOPs.oclEquals(s.BelongedCashDesk, this.CurrentCashDesk),
          description: 's.BelongedCashDesk=CurrentCashDesk',
        })
        .and({
          logic: () => StandardOPs.includes(this.CurrentCashDesk.ContainedSales, s),
          description: 'CurrentCashDesk.ContainedSales->includes(s)',
        })
        .and({
          logic: () => StandardOPs.oclEquals(s.IsComplete, false),
          description: 's.IsComplete=false',
        })
        .and({
          logic: () => StandardOPs.oclEquals(s.IsReadytoPay, false),
          description: 's.IsReadytoPay=false',
        })
        .and({
          logic: () => StandardOPs.includes(getRepository(Sale), s),
          description: 'Sale.allInstances()->includes(s)',
        })
        .and({
          logic: () => StandardOPs.oclEquals(this.CurrentSale, s),
          description: 'self.CurrentSale=s',
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
