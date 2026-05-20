import {Actor} from '../../model/Actor';

export const Cashier = new Actor({
  name: 'Cashier',
  description:
    'The cashier is responsible for opening or closing the cash desk and the checkout of items',
});

export const StoreManager = new Actor({
  name: 'StoreManager',
  description:
    'The store manager is responsible for procurement and price setting of items, and opening or closing the store',
});

export const Administrator = new Actor({
  name: 'Administrator',
  description:
    'The system administrator is responsible for managing information, including store information, cash desk information, cashier information, item information, item catalogue information and supplier information',
});
