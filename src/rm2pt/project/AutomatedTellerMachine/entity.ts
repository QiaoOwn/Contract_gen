import {Attribute} from '../../model/Attribute';
import {Entity} from '../../model/Entity';
import {Relationship} from '../../model/Relationship';

export default {
  BankCard: new Entity({
    name: 'BankCard',
    description: 'The BankCrad is a card that can deposit or withdraw money.',
    attributes: [
      new Attribute({
        name: 'CardID',
        type: 'Integer',
        description: 'The unique identifier of the bank card',
      }),
      new Attribute({
        name: 'CardStatus',
        type: 'CardStatus[NORMAL|SUSPEND|CANNEL]',
        description: 'The status of the bank card',
      }),
      new Attribute({
        name: 'Catalog',
        type: 'CardCatalog[CREDIT|DESPOSIT]',
        description: 'The catalog of the bank card',
      }),
      new Attribute({
        name: 'Password',
        type: 'Integer',
        description: 'The password of the bank card',
      }),
      new Attribute({
        name: 'Balance',
        type: 'Real',
        description: 'The balance of the bank card',
      }),
    ],
    relationships: [
      new Relationship({
        name: 'BelongedUser',
        relatedEntity: 'User',
        associationType: 'Association',
        description: 'The user who owns the bank card',
      }),
    ],
  }),
  User: new Entity({
    name: 'User',
    description: 'Bank user information.',
    attributes: [
      new Attribute({
        name: 'UserID',
        type: 'Integer',
        description: 'The id of the user',
      }),
      new Attribute({
        name: 'Name',
        type: 'String',
        description: 'The name of the user',
      }),
      new Attribute({
        name: 'Address',
        type: 'String',
        description: 'The address of the user',
      }),
    ],
    relationships: [
      new Relationship({
        name: 'OwnedCard',
        relatedEntity: 'BankCard',
        associationType: 'Association',
        description: 'The bank card owned by the user',
      }),
    ],
  }),
};
