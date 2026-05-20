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

class AutomatedTellerMachineSystem {
  /*SystemVariable Start*/
  PasswordValidated: boolean;
  WithdrawedNumber: number;
  InputCard: BankCard;
  CardIDValidated: boolean;
  IsDeposit: boolean;
  IsWithdraw: boolean;
  DepositedNumber: number;
  /*SystemVariable End*/

  /*if the card password and id is validated,
   *and the input card's balance is greater or equal than the input quantity,
   *then input card balance will reduce the quantity and record the withrawed number equal to the quantity,
   *and this means the money is withdraw
   **/
  withdrawCash(quantity: number): boolean {
    /*Precondition Start*/
    const {errorMessage: preconditionErrorMessage, pass: isPreconditionPass} = l({
      logic: () => this.PasswordValidated === true,
      description: 'self.PasswordValidated=true',
    })
      .and({
        logic: () => this.CardIDValidated === true,
        description: 'self.CardIDValidated=true',
      })
      .and({
        logic: () => StandardOPs.oclIsUndefined(this.InputCard) === false,
        description: 'self.InputCard.oclIsUndefined()=false',
      })
      .and({
        logic: () => this.InputCard.Balance >= quantity,
        description: 'self.InputCard.Balance>=quantity',
      })
      .build();
    if (!isPreconditionPass) {
      throw new PreconditionError(preconditionErrorMessage);
    }
    /*Precondition End*/

    /*Postcondition Start*/
    return l({
      execute: () => (this.InputCard.Balance = this.InputCard.Balance - quantity),
      description: 'self.InputCard.Balance=self.InputCard.Balance@pre-quantity',
    })
      .and({
        execute: () => (this.WithdrawedNumber = quantity),
        description: 'self.WithdrawedNumber=quantity',
      })
      .and({
        execute: () => (this.IsWithdraw = true),
        description: 'self.IsWithdraw=true',
      })
      .and({
        execute: () => true,
        description: 'result=true',
      })
      .build().value;
    /*Postcondition End*/
  }
}
export {AutomatedTellerMachineSystem};
