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

  /*the card id and password is validated and the input card exist, then if the money is withdraw,
   *if print the withdrawed number or if it is deposit print the deposited number or print 0*/
  printReceipt(): number {
    /*Precondition Start*/
    const {errorMessage: preconditionErrorMessage, pass: isPreconditionPass} = l({
      logic: () => this.CardIDValidated === true,
      description: 'self.CardIDValidated=true',
    })
      .and({
        logic: () => this.PasswordValidated === true,
        description: 'self.PasswordValidated=true',
      })
      .and({
        logic: () => StandardOPs.oclIsUndefined(this.InputCard) === false,
        description: 'self.InputCard.oclIsUndefined()=false',
      })
      .build();
    if (!isPreconditionPass) {
      throw new PreconditionError(preconditionErrorMessage);
    }
    /*Precondition End*/

    /*Postcondition Start*/
    return l()
      .if({
        logic: () =>
          l({
            logic: () => this.IsWithdraw === true,
            description: 'self.IsWithdraw=true',
          }),
        description: 'self.IsWithdraw=true',
        then: l({
          execute: () => this.WithdrawedNumber,
          description: 'result=self.WithdrawedNumber',
        }),
        else: l().if({
          logic: () =>
            l({
              logic: () => this.IsDeposit === true,
              description: 'self.IsDeposit=true',
            }),
          description: 'self.IsDeposit=true',
          then: l({
            execute: () => this.DepositedNumber,
            description: 'result=self.DepositedNumber',
          }),
          else: l({
            execute: () => 0,
            description: 'result=0',
          }),
        }),
      })
      .build().value;
    /*Postcondition End*/
  }
}
export {AutomatedTellerMachineSystem};
