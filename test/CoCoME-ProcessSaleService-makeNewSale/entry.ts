import dayjs from 'dayjs';
import {l, PreconditionError, StandardOPs} from '../globalEntry';
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

  /*The current cash desk exists and the cash desk is opened.
   *There is no ongoing sale, or the current sale is complete.
   *Then a new sale is created.
   *The sale is linked to the current cash desk.
   *The sale is initialized is not complete and not ready to pay.
   *The sale is added to the system.
   *The new created sale will be used in other step*/
  makeNewSale(): boolean {
    /*Precondition Start*/
    const {errorMessage: preconditionErrorMessage, pass: isPreconditionPass} = l({
      logic: () => StandardOPs.oclIsUndefined(this.CurrentCashDesk) === false,
      description: 'CurrentCashDesk.oclIsUndefined()=false',
    })
      .and({
        logic: () => this.CurrentCashDesk.IsOpened === true,
        description: 'CurrentCashDesk.IsOpened=true',
      })
      .and({
        logic: () =>
          l({
            logic: () => StandardOPs.oclIsUndefined(this.CurrentSale) === true,
            description: 'CurrentSale.oclIsUndefined()=true',
          }).or({
            logic: () =>
              l({
                logic: () => StandardOPs.oclIsUndefined(this.CurrentSale) === false,
                description: 'CurrentSale.oclIsUndefined()=false',
              }).and({
                logic: () => this.CurrentSale.IsComplete === true,
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

    /*Postcondition Start*/
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
        execute: () => this.CurrentCashDesk.ContainedSales.push(s),
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
        execute: () => getRepository(Sale).push(s),
        description: 'Sale.allInstance()->includes(s)',
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
    /*Postcondition End*/
  }
}
export {ProcessSaleService};
