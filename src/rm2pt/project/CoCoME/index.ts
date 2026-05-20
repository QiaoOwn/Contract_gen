import changePrice from './changePrice';
import closeCashDesk from './closeCashDesk';
import closeStore from './closeStore';
import listSuppliers from './listSuppliers';
import manageCashDesk from './manageCashDesk';
import manageCashier from './manageCashier';
import manageProductCatalog from './manageProductCatalog';
import manageStore from './manageStore';
import manageSupplier from './manageSupplier';
import manageItem from './manageItem';
import openCashDesk from './openCashDesk';
import openStore from './openStore';
import orderProducts from './orderProducts';
import processSale from './processSale';
import receiveOrderedProduct from './receiveOrderedProduct';
import showStockReports from './showStockReports';
export * as actor from './actor';
export {default as entity} from './entity';
export const useCase = {
  changePrice,
  closeCashDesk,
  closeStore,
  listSuppliers,
  manageCashDesk,
  manageCashier,
  manageProductCatalog,
  manageStore,
  manageSupplier,
  manageItem,
  openCashDesk,
  openStore,
  orderProducts,
  processSale,
  receiveOrderedProduct,
  showStockReports,
};
