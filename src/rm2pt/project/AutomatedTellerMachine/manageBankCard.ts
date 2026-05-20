import systemService from './systemService';
import {Operation} from '../../model/Operation';
import {Parameter} from '../../model/Parameter';
import {ReturnedType} from '../../model/ReturnedType';
import {Service} from '../../model/Service';
import {UseCase} from '../../model/UseCase';
import {BankClerk} from './actor';

const actors = [BankClerk];

const operations = [
  new Operation({
    name: 'createBankCard',
    description: `Definition: The createBankCard operation handles its intended business action in this system.
    Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
    Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.`,
    parameters: [
      new Parameter({name: 'cardid', type: 'Integer'}),
      new Parameter({
        name: 'cardstatus',
        type: 'CardStatus[NORMAL|SUSPEND|CANCEL]',
      }),
      new Parameter({name: 'catalog', type: 'CardCatalog[CREDIT|DEPOSIT]'}),
      new Parameter({name: 'password', type: 'Integer'}),
      new Parameter({name: 'balance', type: 'Real'}),
    ],
    returnType: new ReturnedType('Boolean'),
    definition: `
      bankcard:BankCard = BankCard.allInstance()->any(ban:BankCard | ban.CardID = cardid)
    `,
    precondition: `
      bankcard.oclIsUndefined() = true
    `,
    postcondition: `
      let ban:BankCard in
      ban.oclIsNew() and
      ban.CardID = cardid and
      ban.CardStatus = cardstatus and
      ban.Catalog = catalog and
      ban.Password = password and
      ban.Balance = balance and
      BankCard.allInstance()->includes(ban) and
      result = true
    `,
  }),
  new Operation({
    name: 'queryBankCard',
    description: `Definition: The queryBankCard operation handles its intended business action in this system.
    Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
    Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.`,
    parameters: [new Parameter({name: 'cardid', type: 'Integer'})],
    returnType: new ReturnedType('BankCard'),
    definition: `
      bankcard:BankCard = BankCard.allInstance()->any(ban:BankCard | ban.CardID = cardid)
    `,
    precondition: `
     bankcard.oclIsUndefined() = false
    `,
    postcondition: `
      result = bankcard
    `,
  }),
  new Operation({
    name: 'modifyBankCard',
    description: `Definition: The modifyBankCard operation handles its intended business action in this system.
    Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
    Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.`,
    parameters: [
      new Parameter({name: 'cardid', type: 'Integer'}),
      new Parameter({
        name: 'cardstatus',
        type: 'CardStatus[NORMAL|SUSPEND|CANCEL]',
      }),
      new Parameter({name: 'catalog', type: 'CardCatalog[CREDIT|DEPOSIT]'}),
      new Parameter({name: 'password', type: 'Integer'}),
      new Parameter({name: 'balance', type: 'Real'}),
    ],
    returnType: new ReturnedType('Boolean'),
    definition: `
      bankcard:BankCard = BankCard.allInstance()->any(ban:BankCard | ban.CardID = cardid)
    `,
    precondition: `
      bankcard.oclIsUndefined() = false
    `,
    postcondition: `
      	bankcard.CardID = cardid and
        bankcard.CardStatus = cardstatus and
        bankcard.Catalog = catalog and
        bankcard.Password = password and
        bankcard.Balance = balance and
        result = true
    `,
  }),
  new Operation({
    name: 'deleteBankCard',
    description: `Definition: The deleteBankCard operation handles its intended business action in this system.
    Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
    Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.`,
    parameters: [new Parameter({name: 'cardid', type: 'Integer'})],
    returnType: new ReturnedType('Boolean'),
    definition: `
      bankcard:BankCard = BankCard.allInstance()->any(ban:BankCard | ban.CardID = cardid)
    `,
    precondition: `
     bankcard.oclIsUndefined() = false and
			BankCard.allInstance()->includes(bankcard)
    `,
    postcondition: `
     BankCard.allInstance()->excludes(bankcard) and
			result = true
    `,
  }),
];

const service = new Service({
  name: 'ManageBankCardCRUDService',
  operations,
});

const useCase = new UseCase({
  name: 'manageBankCard',
  description:
    'The bank clerk manages bank card information, including entering, inquiring, modifying and deleting of bank card information',
  relatedService: service,
  systemService,
  involvedActors: actors,
});

export default useCase;
