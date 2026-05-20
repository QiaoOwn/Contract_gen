import {Service} from '@/rm2pt/model/Service';
import {TempVariable} from '@/rm2pt/model/TempVariable';
const systemService = new Service({
  name: 'AutomatedTellerMachineSystem',
  operations: [],
  tempVariables: [
    new TempVariable({name: 'PasswordValidated', type: 'Boolean'}),
    new TempVariable({name: 'WithdrawedNumber', type: 'Real'}),
    new TempVariable({name: 'InputCard', type: 'BankCard'}),
    new TempVariable({name: 'CardIDValidated', type: 'Boolean'}),
    new TempVariable({name: 'IsDeposit', type: 'Boolean'}),
    new TempVariable({name: 'IsWithdraw', type: 'Boolean'}),
    new TempVariable({name: 'DepositedNumber', type: 'Real'}),
  ],
});
export default systemService;
