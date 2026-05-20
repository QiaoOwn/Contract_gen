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
   *if the card not exist, create a new card with provided info*/
  createBankCard(
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
      logic: () => StandardOPs.oclIsUndefined(bankcard) === true,
      description: 'bankcard.oclIsUndefined()=true',
    }).build();
    if (!isPreconditionPass) {
      throw new PreconditionError(preconditionErrorMessage);
    }
    /*Precondition End*/

    /*Postcondition Start*/
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
        execute: () => getRepository(BankCard).push(ban),
        description: 'BankCard.allInstance()->includes(ban)',
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
