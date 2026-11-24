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
/*The BankCrad is a card that can deposit or withdraw money.*/
class BankCard {
  /*The unique identifier of the bank card*/
  CardID: number;
  /*The status of the bank card*/
  CardStatus: CardStatus;
  /*The catalog of the bank card*/
  Catalog: CardCatalog;
  /*The password of the bank card*/
  Password: number;
  /*The balance of the bank card*/
  Balance: number;
  /*The user who owns the bank card*/
  BelongedUser: User;
}
/*Bank user information.*/
class User {
  /*The id of the user*/
  UserID: number;
  /*The name of the user*/
  Name: string;
  /*The address of the user*/
  Address: string;
  /*The bank card owned by the user*/
  OwnedCard: BankCard;
}
enum CardStatus {
  NORMAL = 'NORMAL',
  SUSPEND = 'SUSPEND',
  CANNEL = 'CANNEL',
}
enum CardCatalog {
  CREDIT = 'CREDIT',
  DESPOSIT = 'DESPOSIT',
}
const map = new Map();
map.set(BankCard, []);
map.set(User, []);
const getRepository = <T>(clazz: new (...args: any[]) => T) => {
  return map.get(clazz) as T[];
};
export {CardStatus, CardCatalog, BankCard, User, getRepository};

class ManageBankCardCRUDService {
  /*SystemVariable Start*/
  PasswordValidated: boolean;
  WithdrawedNumber: number;
  InputCard: BankCard;
  CardIDValidated: boolean;
  IsDeposit: boolean;
  IsWithdraw: boolean;
  DepositedNumber: number;
  /*SystemVariable End*/

  /*Definition: The createBankCard operation handles its intended business action in this system.
   *Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
   *Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.*/
  createBankCard(
    cardid: number,
    cardstatus: CardStatus,
    catalog: CardCatalog,
    password: number,
    balance: number
  ): boolean {
    /*Definition Start*/
    let bankcard: BankCard = evaluateDefinition(
      () =>
        l({
          logic: () =>
            getRepository(BankCard).find(
              (ban: BankCard) =>
                l({
                  logic: () => StandardOPs.oclEquals(ban.CardID, cardid),
                  description: 'ban.CardID=cardid',
                }).build().pass
            ),
          description: 'BankCard.allInstances()->any(ban:BankCard|ban.CardID=cardid)',
        }).build().pass
    );
    /*Definition End*/

    /*Precondition Start*/
    const {errorMessage: preconditionErrorMessage, pass: isPreconditionPass} = l({
      logic: () => StandardOPs.oclEquals(StandardOPs.oclIsUndefined(bankcard), true),
      description: 'bankcard.oclIsUndefined()=true',
    }).build();
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
      let ban: BankCard;
      return l({
        execute: () => (ban = new BankCard()),
        description: 'ban.oclIsNew()',
      })
        .and({
          execute: () => (ban.CardID = cardid),
          description: 'ban.CardID=cardid',
        })
        .and({
          execute: () => (ban.CardStatus = cardstatus),
          description: 'ban.CardStatus=cardstatus',
        })
        .and({
          execute: () => (ban.Catalog = catalog),
          description: 'ban.Catalog=catalog',
        })
        .and({
          execute: () => (ban.Password = password),
          description: 'ban.Password=password',
        })
        .and({
          execute: () => (ban.Balance = balance),
          description: 'ban.Balance=balance',
        })
        .and({
          execute: () => StandardOPs.includeIfAbsent(getRepository(BankCard), ban),
          description: 'BankCard.allInstances()->includes(ban)',
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
      let ban: BankCard = oclState.findNew(BankCard);
      return l({
        logic: () => oclState.isNew(ban, BankCard),
        description: 'ban.oclIsNew()',
      })
        .and({
          logic: () => StandardOPs.oclEquals(ban.CardID, cardid),
          description: 'ban.CardID=cardid',
        })
        .and({
          logic: () => StandardOPs.oclEquals(ban.CardStatus, cardstatus),
          description: 'ban.CardStatus=cardstatus',
        })
        .and({
          logic: () => StandardOPs.oclEquals(ban.Catalog, catalog),
          description: 'ban.Catalog=catalog',
        })
        .and({
          logic: () => StandardOPs.oclEquals(ban.Password, password),
          description: 'ban.Password=password',
        })
        .and({
          logic: () => StandardOPs.oclEquals(ban.Balance, balance),
          description: 'ban.Balance=balance',
        })
        .and({
          logic: () => StandardOPs.includes(getRepository(BankCard), ban),
          description: 'BankCard.allInstances()->includes(ban)',
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
export {ManageBankCardCRUDService};
