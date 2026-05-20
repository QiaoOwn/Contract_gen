import checkBalance from './checkBalance';
import depositFunds from './depositFunds';
import manageBankCard from './manageBankCard';
import manageUser from './manageUser';
import withdrawCash from './withdrawCash';
export * as actor from './actor';
export {default as entity} from './entity';
export const useCase = {
  checkBalance,
  depositFunds,
  manageBankCard,
  manageUser,
  withdrawCash,
};
