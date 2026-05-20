import {TempVariable} from '../../model/TempVariable';
import systemService from './systemService';
import {Operation} from '../../model/Operation';
import {Parameter} from '../../model/Parameter';
import {ReturnedType} from '../../model/ReturnedType';
import {Service} from '../../model/Service';
import {UseCase} from '../../model/UseCase';
import {Cashier} from './actor';

const actors = [Cashier];

const tempVariables = [
  new TempVariable({name: 'CurrentCashDesk', type: 'CashDesk'}),
  new TempVariable({name: 'CurrentStore', type: 'Store'}),
];

const operations = [
  new Operation({
    name: 'openCashDesk',
    description: `Definition: The openCashDesk operation handles its intended business action in this system.
    Precondition: Required inputs are present, referenced data is valid, and the action is allowed by business rules.
    Postcondition: The system applies the requested outcome, keeps data consistent, and returns the defined result.`,
    parameters: [new Parameter({name: 'cashDeskID', type: 'Integer'})],
    returnType: new ReturnedType('Boolean'),
    definition: `cd:CashDesk = CashDesk.allInstance()->any(s:CashDesk | s.Id = cashDeskID)`,
    precondition: `
cd.oclIsUndefined() = false and
cd.IsOpened = false and
CurrentStore.oclIsUndefined() = false and
CurrentStore.IsOpened = true`,
    postcondition: `
self.CurrentCashDesk = cd and
cd.IsOpened = true and
result = true`,
  }),
];

const service = new Service({
  name: 'CoCoMESystem',
  operations,
  tempVariables,
});

const useCase = new UseCase({
  name: 'openCashDesk',
  description: 'The cashier opens cash desk',
  relatedService: service,
  systemService,
  involvedActors: actors,
});

export default useCase;
