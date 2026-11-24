import {Actor} from '../../model/Actor';

export const Customer = new Actor({
  name: 'Customer',
  description: 'The customer is the holder of the bank card',
});

export const BankClerk = new Actor({
  name: 'BankClerk',
  description:
    'The bank clerk is responsible for managing information, including user(customer) information, bank card information',
});
