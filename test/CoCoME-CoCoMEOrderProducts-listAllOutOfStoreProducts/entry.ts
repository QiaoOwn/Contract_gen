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

class CoCoMEOrderProducts {
  /*SystemVariable Start*/
  CurrentCashDesk: CashDesk;
  CurrentStore: Store;
  /*SystemVariable End*/

  /*TempVariable Start*/
  CurrentOrderProduct: OrderProduct;
  /*TempVariable End*/

  /*select all the items with the stock number is equal to 0*/
  listAllOutOfStoreProducts(): Item[] {
    /*Precondition Start*/
    const {errorMessage: preconditionErrorMessage, pass: isPreconditionPass} = l({
      logic: () => true,
      description: 'true',
    }).build();
    if (!isPreconditionPass) {
      throw new PreconditionError(preconditionErrorMessage);
    }
    /*Precondition End*/

    /*Postcondition Start*/
    return l({
      execute: () =>
        getRepository(Item).filter(
          (item: Item) =>
            l({
              logic: () => item.StockNumber === 0,
              description: 'item.StockNumber=0',
            }).build().pass
        ),
      description: 'result=Item.allInstance()->select(item:Item|item.StockNumber=0)',
    }).build().value;
    /*Postcondition End*/
  }
}
export {CoCoMEOrderProducts};
