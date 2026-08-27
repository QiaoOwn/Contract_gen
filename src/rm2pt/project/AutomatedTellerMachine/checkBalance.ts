// checkBalance.js
import {TempVariable} from '../../model/TempVariable';
import systemService from './systemService';
import {Operation} from '../../model/Operation';
import {Parameter} from '../../model/Parameter';
import {ReturnedType} from '../../model/ReturnedType';
import {Service} from '../../model/Service';
import {UseCase} from '../../model/UseCase';
import {Customer} from './actor';

const actors = [Customer];

const tempVariables = [
  new TempVariable({name: 'PasswordValidated', type: 'Boolean'}),
  new TempVariable({name: 'InputCard', type: 'BankCard'}),
  new TempVariable({name: 'CardIDValidated', type: 'Boolean'}),
];

const operations = [
  new Operation({
    name: 'inputCard',
    description: `Definition: The inputCard operation handles its intended business action in this system.
    Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
    Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.`,
    parameters: [new Parameter({name: 'cardid', type: 'Integer'})],
    returnType: new ReturnedType('Boolean'),
    definition: 'bc:BankCard = BankCard.allInstances()->any(c:BankCard | c.CardID = cardid)',
    precondition: 'bc.oclIsUndefined() = false and bc.CardStatus=CardStatus::NORMAL',
    postcondition: `
          if bc.BelongedUser.oclIsUndefined()=false then
            self.CardIDValidated = true and
            self.InputCard = bc and
            result = true
          else
            self.CardIDValidated = false and
            result = false
          endif
        `,
  }),
  new Operation({
    name: 'inputPassword',
    description: `Definition: The inputPassword operation handles its intended business action in this system.
    Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
    Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.`,
    parameters: [new Parameter({name: 'password', type: 'Integer'})],
    returnType: new ReturnedType('Boolean'),
    precondition: `
          self.CardIDValidated = true and
          self.InputCard.oclIsUndefined() = false
        `,
    postcondition: `
          if self.InputCard.Password = password then
            self.PasswordValidated = true and
            result = true
          else
            self.PasswordValidated = false and
            result = false
          endif
        `,
  }),
  new Operation({
    name: 'checkBalance',
    description: `Definition: The checkBalance operation handles its intended business action in this system.
    Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
    Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.`,
    returnType: new ReturnedType('Real'),
    precondition: `
      self.PasswordValidated = true and
      self.CardIDValidated = true and
      self.InputCard.oclIsUndefined() = false
    `,
    postcondition: `
      result = self.InputCard.Balance
    `,
  }),
  new Operation({
    name: 'ejectCard',
    description: `Definition: The ejectCard operation handles its intended business action in this system.
    Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
    Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.`,
    returnType: new ReturnedType('Boolean'),
    precondition: `
      self.PasswordValidated = true and
      self.CardIDValidated = true and
      self.InputCard.oclIsUndefined() = false
    `,
    postcondition: `
      self.InputCard = null and
      self.PasswordValidated = false and
      self.CardIDValidated = false and
      self.IsWithdraw = false and
      self.IsDeposit = false and
      self.WithdrawedNumber = 0 and
      self.DepositedNumber = 0 and
      result = true
    `,
  }),
];

const service = new Service({
  name: 'AutomatedTellerMachineSystem',
  operations,
  tempVariables,
});

const useCase = new UseCase({
  name: 'checkBalance',
  description: 'The customer checks balance',
  relatedService: service,
  systemService,
  involvedActors: actors,
});

export default useCase;
