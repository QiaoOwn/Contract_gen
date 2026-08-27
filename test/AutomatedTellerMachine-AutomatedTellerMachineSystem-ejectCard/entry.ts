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

  /*Definition: The ejectCard operation handles its intended business action in this system.
   *Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
   *Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.*/
  ejectCard(): boolean {
    /*Precondition Start*/
    const {errorMessage: preconditionErrorMessage, pass: isPreconditionPass} = l({
      logic: () => StandardOPs.oclEquals(this.PasswordValidated, true),
      description: 'self.PasswordValidated=true',
    })
      .and({
        logic: () => StandardOPs.oclEquals(this.CardIDValidated, true),
        description: 'self.CardIDValidated=true',
      })
      .and({
        logic: () => StandardOPs.oclEquals(StandardOPs.oclIsUndefined(this.InputCard), false),
        description: 'self.InputCard.oclIsUndefined()=false',
      })
      .build();
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
      return l({
        execute: () => (this.InputCard = undefined),
        description: 'self.InputCard=null',
      })
        .and({
          execute: () => (this.PasswordValidated = false),
          description: 'self.PasswordValidated=false',
        })
        .and({
          execute: () => (this.CardIDValidated = false),
          description: 'self.CardIDValidated=false',
        })
        .and({
          execute: () => (this.IsWithdraw = false),
          description: 'self.IsWithdraw=false',
        })
        .and({
          execute: () => (this.IsDeposit = false),
          description: 'self.IsDeposit=false',
        })
        .and({
          execute: () => (this.WithdrawedNumber = 0),
          description: 'self.WithdrawedNumber=0',
        })
        .and({
          execute: () => (this.DepositedNumber = 0),
          description: 'self.DepositedNumber=0',
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
      return l({
        logic: () => StandardOPs.oclEquals(this.InputCard, undefined),
        description: 'self.InputCard=null',
      })
        .and({
          logic: () => StandardOPs.oclEquals(this.PasswordValidated, false),
          description: 'self.PasswordValidated=false',
        })
        .and({
          logic: () => StandardOPs.oclEquals(this.CardIDValidated, false),
          description: 'self.CardIDValidated=false',
        })
        .and({
          logic: () => StandardOPs.oclEquals(this.IsWithdraw, false),
          description: 'self.IsWithdraw=false',
        })
        .and({
          logic: () => StandardOPs.oclEquals(this.IsDeposit, false),
          description: 'self.IsDeposit=false',
        })
        .and({
          logic: () => StandardOPs.oclEquals(this.WithdrawedNumber, 0),
          description: 'self.WithdrawedNumber=0',
        })
        .and({
          logic: () => StandardOPs.oclEquals(this.DepositedNumber, 0),
          description: 'self.DepositedNumber=0',
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
export {AutomatedTellerMachineSystem};
