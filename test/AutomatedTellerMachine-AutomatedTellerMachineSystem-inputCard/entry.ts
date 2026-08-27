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

  /*Definition: The inputCard operation handles its intended business action in this system.
   *Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
   *Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.*/
  inputCard(cardid: number): boolean {
    /*Definition Start*/
    let bc: BankCard = evaluateDefinition(
      () =>
        l({
          logic: () =>
            getRepository(BankCard).find(
              (c: BankCard) =>
                l({
                  logic: () => StandardOPs.oclEquals(c.CardID, cardid),
                  description: 'c.CardID=cardid',
                }).build().pass
            ),
          description: 'BankCard.allInstances()->any(c:BankCard|c.CardID=cardid)',
        }).build().pass
    );
    /*Definition End*/

    /*Precondition Start*/
    const {errorMessage: preconditionErrorMessage, pass: isPreconditionPass} = l({
      logic: () => StandardOPs.oclEquals(StandardOPs.oclIsUndefined(bc), false),
      description: 'bc.oclIsUndefined()=false',
    })
      .and({
        logic: () => StandardOPs.oclEquals(bc.CardStatus, CardStatus.NORMAL),
        description: 'bc.CardStatus=CardStatus::NORMAL',
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
      return l()
        .if({
          logic: () =>
            l({
              logic: () =>
                StandardOPs.oclEquals(StandardOPs.oclIsUndefined(bc.BelongedUser), false),
              description: 'bc.BelongedUser.oclIsUndefined()=false',
            }),
          description: 'bc.BelongedUser.oclIsUndefined()=false',
          then: l({
            execute: () => (this.CardIDValidated = true),
            description: 'self.CardIDValidated=true',
          })
            .and({
              execute: () => (this.InputCard = bc),
              description: 'self.InputCard=bc',
            })
            .and({
              execute: () => true,
              description: 'result=true',
            }),
          else: l({
            execute: () => (this.CardIDValidated = false),
            description: 'self.CardIDValidated=false',
          }).and({
            execute: () => false,
            description: 'result=false',
          }),
        })
        .build().value;
      /*Postcondition Effects End*/
    })();
    /*OCL Post-state Snapshot*/
    oclState.capturePost();
    const {errorMessage: postconditionErrorMessage, pass: isPostconditionPass} = (() => {
      /*Postcondition Check Start*/
      return l()
        .if({
          logic: () =>
            l({
              logic: () =>
                StandardOPs.oclEquals(StandardOPs.oclIsUndefined(bc.BelongedUser), false),
              description: 'bc.BelongedUser.oclIsUndefined()=false',
            }),
          description: 'bc.BelongedUser.oclIsUndefined()=false',
          then: l({
            logic: () => StandardOPs.oclEquals(this.CardIDValidated, true),
            description: 'self.CardIDValidated=true',
          })
            .and({
              logic: () => StandardOPs.oclEquals(this.InputCard, bc),
              description: 'self.InputCard=bc',
            })
            .and({
              logic: () => StandardOPs.oclEquals(result, true),
              description: 'result=true',
            }),
          else: l({
            logic: () => StandardOPs.oclEquals(this.CardIDValidated, false),
            description: 'self.CardIDValidated=false',
          }).and({
            logic: () => StandardOPs.oclEquals(result, false),
            description: 'result=false',
          }),
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
