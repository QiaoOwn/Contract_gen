import {PreconditionError} from '../../../test/globalEntry';
import {CoCoMEOrderProducts as Original} from '../../../test/CoCoME-CoCoMEOrderProducts-orderItem/entry';

export * from '../../../test/CoCoME-CoCoMEOrderProducts-orderItem/entry';

export class CoCoMEOrderProducts extends Original {
  override orderItem(barcode: number, quantity: number): boolean {
    if (!this.CurrentOrderProduct) {
      throw new PreconditionError('A current product order is required.');
    }
    return super.orderItem(barcode, quantity);
  }
}
