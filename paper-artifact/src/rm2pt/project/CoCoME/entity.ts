import {Attribute} from '../../model/Attribute';
import {Entity} from '../../model/Entity';
import {Relationship} from '../../model/Relationship';
const Payment = new Entity({
  name: 'Payment',
  description: 'The bill for the goods sold',
  attributes: [
    new Attribute({
      name: 'AmountTendered',
      type: 'Real',
      description: 'Amount Tendered',
    }),
  ],
  relationships: [
    new Relationship({
      name: 'BelongedSale',
      relatedEntity: 'Sale',
      associationType: 'Association',

      description: 'Payment belongs to a Sale',
    }),
  ],
});
const entities = {
  Store: new Entity({
    name: 'Store',
    description: 'The place where items are sold',
    attributes: [
      new Attribute({name: 'Id', type: 'Integer', description: 'Store ID'}),
      new Attribute({
        name: 'Name',
        type: 'String',
        description: 'Store Name',
      }),
      new Attribute({
        name: 'Address',
        type: 'String',
        description: 'Store Address',
      }),
      new Attribute({
        name: 'IsOpened',
        type: 'Boolean',
        description: 'Store Open Status',
      }),
    ],
    relationships: [
      new Relationship({
        name: 'AssociationCashdeskes',
        relatedEntity: 'Set(CashDesk)',
        associationType: 'Association',
        description: 'Store has multiple CashDesks',
      }),
      new Relationship({
        name: 'Productcatalogs',
        relatedEntity: 'Set(ProductCatalog)',
        associationType: 'Association',
        description: 'Store has multiple ProductCatalogs',
      }),
      new Relationship({
        name: 'Items',
        relatedEntity: 'Set(Item)',
        associationType: 'Association',
        description: 'Store has multiple Items',
      }),
      new Relationship({
        name: 'Cashiers',
        relatedEntity: 'Set(Cashier)',
        associationType: 'Association',

        description: 'Store has multiple Cashiers',
      }),
      new Relationship({
        name: 'Sales',
        relatedEntity: 'Set(Sale)',
        associationType: 'Association',
        description: 'Store has multiple Sales',
      }),
    ],
  }),

  ProductCatalog: new Entity({
    name: 'ProductCatalog',
    description: 'The catalogue of items',
    attributes: [
      new Attribute({
        name: 'Id',
        type: 'Integer',
        description: 'ProductCatalog ID',
      }),
      new Attribute({
        name: 'Name',
        type: 'String',
        description: 'ProductCatalog Name',
      }),
    ],
    relationships: [
      new Relationship({
        name: 'ContainedItems',
        relatedEntity: 'Item',
        associationType: 'Association',

        description: 'ProductCatalog contains multiple Items',
      }),
    ],
  }),

  CashDesk: new Entity({
    name: 'CashDesk',
    description: 'The cash desk in store',
    attributes: [
      new Attribute({
        name: 'Id',
        type: 'Integer',
        description: 'CashDesk ID',
      }),
      new Attribute({
        name: 'Name',
        type: 'String',
        description: 'CashDesk Name',
      }),
      new Attribute({
        name: 'IsOpened',
        type: 'Boolean',
        description: 'CashDesk Open Status',
      }),
    ],
    relationships: [
      new Relationship({
        name: 'ContainedSales',
        relatedEntity: 'Set(Sale)',
        associationType: 'Association',

        description: 'CashDesk handles multiple Sales',
      }),
      new Relationship({
        name: 'BelongedStore',
        relatedEntity: 'Store',
        associationType: 'Association',

        description: 'CashDesk belongs to one Store',
      }),
    ],
  }),

  Sale: new Entity({
    name: 'Sale',
    description: 'The sales order for items',
    attributes: [
      new Attribute({name: 'Time', type: 'Date', description: 'Sale Time'}),
      new Attribute({
        name: 'IsComplete',
        type: 'Boolean',
        description: 'Sale Completion Status',
      }),
      new Attribute({
        name: 'Amount',
        type: 'Real',
        description: 'Total Amount',
      }),
      new Attribute({
        name: 'IsReadytoPay',
        type: 'Boolean',
        description: 'Ready to Pay Status',
      }),
    ],
    relationships: [
      new Relationship({
        name: 'Belongedstore',
        relatedEntity: 'Store',
        associationType: 'Association',
        description: 'Sale belongs to a Store',
      }),
      new Relationship({
        name: 'BelongedCashDesk',
        relatedEntity: 'CashDesk',
        associationType: 'Association',

        description: 'Sale belongs to a CashDesk',
      }),
      new Relationship({
        name: 'ContainedSalesLine',
        relatedEntity: 'Set(SalesLineItem)',
        associationType: 'Association',

        description: 'Sale contains multiple SalesLineItems',
      }),
      new Relationship({
        name: 'AssoicatedPayment',
        relatedEntity: 'Payment',
        associationType: 'Association',
        description: 'Sale is associated with a Payment',
      }),
    ],
  }),

  Cashier: new Entity({
    name: 'Cashier',
    description: 'The cashier in store',
    attributes: [
      new Attribute({name: 'Id', type: 'Integer', description: 'Cashier ID'}),
      new Attribute({
        name: 'Name',
        type: 'String',
        description: 'Cashier Name',
      }),
    ],
    relationships: [
      new Relationship({
        name: 'WorkedStore',
        relatedEntity: 'Store',
        associationType: 'Association',

        description: 'Cashier works at one Store',
      }),
    ],
  }),

  SalesLineItem: new Entity({
    name: 'SalesLineItem',
    description: 'The sales order for a single item',
    attributes: [
      new Attribute({
        name: 'Quantity',
        type: 'Integer',
        description: 'Item Quantity',
      }),
      new Attribute({
        name: 'Subamount',
        type: 'Real',
        description: 'Sub Amount',
      }),
    ],
    relationships: [
      new Relationship({
        name: 'BelongedSale',
        relatedEntity: 'Sale',
        associationType: 'Association',

        description: 'SalesLineItem belongs to a Sale',
      }),
      new Relationship({
        name: 'BelongedItem',
        relatedEntity: 'Item',
        associationType: 'Association',
        description: 'SalesLineItem refers to an Item',
      }),
    ],
  }),

  Item: new Entity({
    name: 'Item',
    description: 'The item to be sold',
    attributes: [
      new Attribute({
        name: 'Barcode',
        type: 'Integer',
        description: 'Item Barcode',
      }),
      new Attribute({name: 'Name', type: 'String', description: 'Item Name'}),
      new Attribute({name: 'Price', type: 'Real', description: 'Item Price'}),
      new Attribute({
        name: 'StockNumber',
        type: 'Integer',
        description: 'Stock Number',
      }),
      new Attribute({
        name: 'OrderPrice',
        type: 'Real',
        description: 'Order Price',
      }),
    ],
    relationships: [
      new Relationship({
        name: 'BelongedCatalog',
        relatedEntity: 'ProductCatalog',
        associationType: 'Association',

        description: 'Item belongs to a ProductCatalog',
      }),
    ],
  }),

  Payment,

  CashPayment: new Entity({
    name: 'CashPayment',
    description: 'Pay in cash',
    extends: Payment,
    attributes: [
      new Attribute({
        name: 'Balance',
        type: 'Real',
        description: 'Change to be returned',
      }),
    ],
  }),

  CardPayment: new Entity({
    name: 'CardPayment',
    description: 'Pay by card',
    extends: Payment,
    attributes: [
      new Attribute({
        name: 'CardAccountNumber',
        type: 'String',
        description: 'Card Account Number',
      }),
      new Attribute({
        name: 'ExpiryDate',
        type: 'Date',
        description: 'Card Expiry Date',
      }),
    ],
  }),

  OrderEntry: new Entity({
    name: 'OrderEntry',
    description: 'The purchase order for an item',
    attributes: [
      new Attribute({
        name: 'Quantity',
        type: 'Integer',
        description: 'Quantity Ordered',
      }),
      new Attribute({
        name: 'SubAmount',
        type: 'Real',
        description: 'Sub Amount',
      }),
    ],
    relationships: [
      new Relationship({
        name: 'Item',
        relatedEntity: 'Item',
        associationType: 'Association',
        description: 'OrderEntry refers to an Item',
      }),
    ],
  }),

  Supplier: new Entity({
    name: 'Supplier',
    description: 'The supplier of items',
    attributes: [
      new Attribute({
        name: 'Id',
        type: 'Integer',
        description: 'Supplier ID',
      }),
      new Attribute({
        name: 'Name',
        type: 'String',
        description: 'Supplier Name',
      }),
    ],
  }),

  OrderProduct: new Entity({
    name: 'OrderProduct',
    description: 'The purchase order for items',
    attributes: [
      new Attribute({
        name: 'Id',
        type: 'Integer',
        description: 'OrderProduct ID',
      }),
      new Attribute({name: 'Time', type: 'Date', description: 'Order Time'}),
      new Attribute({
        name: 'OrderStatus',
        type: 'OrderStatus[NEW|RECEIVED|REQUESTED]',
        description: 'Order Status',
      }),
      new Attribute({
        name: 'Amount',
        type: 'Real',
        description: 'Total Amount',
      }),
    ],
    relationships: [
      new Relationship({
        name: 'Supplier',
        relatedEntity: 'Supplier',
        associationType: 'Association',
        description: 'OrderProduct is associated with a Supplier',
      }),
      new Relationship({
        name: 'ContainedEntries',
        relatedEntity: 'Set(OrderEntry)',
        associationType: 'Association',
        description: 'OrderProduct contains multiple OrderEntries',
      }),
    ],
  }),
};

export default entities;
