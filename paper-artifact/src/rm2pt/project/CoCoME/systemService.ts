import {Service} from '@/rm2pt/model/Service';
import {TempVariable} from '@/rm2pt/model/TempVariable';
const tempVariables = [
  new TempVariable({name: 'CurrentCashDesk', type: 'CashDesk'}),
  new TempVariable({name: 'CurrentStore', type: 'Store'}),
];
const systemService = new Service({name: 'CoCoMESystem', operations: [], tempVariables});
export default systemService;
