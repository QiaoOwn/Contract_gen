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

class ManageUserCRUDService {
  /*SystemVariable Start*/
  PasswordValidated: boolean;
  WithdrawedNumber: number;
  InputCard: BankCard;
  CardIDValidated: boolean;
  IsDeposit: boolean;
  IsWithdraw: boolean;
  DepositedNumber: number;
  /*SystemVariable End*/

  /*find the user with provided user id,
   *if the user not exist, create a new user with provided info*/
  createUser(userid: number, name: string, address: string): boolean {
    /*Definition Start*/
    let user: User = l({
      logic: () =>
        getRepository(User).find(
          (use: User) =>
            l({
              logic: () => use.UserID === userid,
              description: 'use.UserID=userid',
            }).build().pass
        ),
      description: 'User.allInstance()->any(use:User|use.UserID=userid)',
    }).build().pass;
    /*Definition End*/

    /*Precondition Start*/
    const {errorMessage: preconditionErrorMessage, pass: isPreconditionPass} = l({
      logic: () => StandardOPs.oclIsUndefined(user) === true,
      description: 'user.oclIsUndefined()=true',
    }).build();
    if (!isPreconditionPass) {
      throw new PreconditionError(preconditionErrorMessage);
    }
    /*Precondition End*/

    /*Postcondition Start*/
    let use: User;
    return l({
      execute: () => (use = new User()),
      description: 'use.oclIsNew()',
    })
      .and({
        execute: () => (use.UserID = userid),
        description: 'use.UserID=userid',
      })
      .and({
        execute: () => (use.Name = name),
        description: 'use.Name=name',
      })
      .and({
        execute: () => (use.Address = address),
        description: 'use.Address=address',
      })
      .and({
        execute: () => getRepository(User).push(use),
        description: 'User.allInstance()->includes(use)',
      })
      .and({
        execute: () => true,
        description: 'result=true',
      })
      .build().value;
    /*Postcondition End*/
  }
}
export {ManageUserCRUDService};
