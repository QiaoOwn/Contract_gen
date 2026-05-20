import dayjs from 'dayjs';
import {l, PreconditionError, StandardOPs} from '../globalEntry';
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

  /*find the card with provided card id,
   *if the card exists, update the card with provided info*/
  modifyBankCard(
    cardid: number,
    cardstatus: CardStatus,
    catalog: CardCatalog,
    password: number,
    balance: number
  ): boolean {
    /*Definition Start*/
    let bankcard: BankCard = l({
      logic: () =>
        getRepository(BankCard).find(
          (ban: BankCard) =>
            l({
              logic: () => ban.CardID === cardid,
              description: 'ban.CardID=cardid',
            }).build().pass
        ),
      description: 'BankCard.allInstance()->any(ban:BankCard|ban.CardID=cardid)',
    }).build().pass;
    /*Definition End*/

    /*Precondition Start*/
    const {errorMessage: preconditionErrorMessage, pass: isPreconditionPass} = l({
      logic: () => StandardOPs.oclIsUndefined(bankcard) === false,
      description: 'bankcard.oclIsUndefined()=false',
    }).build();
    if (!isPreconditionPass) {
      throw new PreconditionError(preconditionErrorMessage);
    }
    /*Precondition End*/

    /*Postcondition Start*/
    return l({
      execute: () => (bankcard.CardID = cardid),
      description: 'bankcard.CardID=cardid',
    })
      .and({
        execute: () => (bankcard.CardStatus = cardstatus),
        description: 'bankcard.CardStatus=cardstatus',
      })
      .and({
        execute: () => (bankcard.Catalog = catalog),
        description: 'bankcard.Catalog=catalog',
      })
      .and({
        execute: () => (bankcard.Password = password),
        description: 'bankcard.Password=password',
      })
      .and({
        execute: () => (bankcard.Balance = balance),
        description: 'bankcard.Balance=balance',
      })
      .and({
        execute: () => true,
        description: 'result=true',
      })
      .build().value;
    /*Postcondition End*/
  }
}
export {ManageBankCardCRUDService};
