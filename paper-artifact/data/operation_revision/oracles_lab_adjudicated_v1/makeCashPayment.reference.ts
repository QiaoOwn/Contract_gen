import {PreconditionError} from '../../../test/globalEntry';
import {ProcessSaleService as Original} from '../../../test/CoCoME-ProcessSaleService-makeCashPayment/entry';

export * from '../../../test/CoCoME-ProcessSaleService-makeCashPayment/entry';

export class ProcessSaleService extends Original {
  override makeCashPayment(amount: number): boolean {
    if (!this.CurrentStore) {
      throw new PreconditionError('A current store is required.');
    }
    return super.makeCashPayment(amount);
  }
}
