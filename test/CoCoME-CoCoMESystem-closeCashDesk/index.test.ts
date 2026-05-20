import {CashDesk, CoCoMESystem, getRepository, Store} from './entry';
describe('CoCoME/CoCoMESystem/closeCashDesk', () => {
  it('Happy Path', () => {
    const service = new CoCoMESystem();
    const cashDesk = new CashDesk();
    const store = new Store();
    store.IsOpened = true;
    service.CurrentStore = store;
    cashDesk.Id = 1;
    cashDesk.IsOpened = true;
    getRepository(CashDesk).push(cashDesk);
    const result = service.closeCashDesk(cashDesk.Id);
    expect(result).toBe(true);
    expect(cashDesk.IsOpened).toBe(false);
    expect(service.CurrentCashDesk).toBe(cashDesk);
  });
});
