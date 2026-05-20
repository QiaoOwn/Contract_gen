import {CashDesk, CoCoMESystem, getRepository, Store} from './entry';
describe('CoCoME/CoCoMESystem/openCashDesk', () => {
  it('Happy Path', () => {
    const service = new CoCoMESystem();
    const cashDesk = new CashDesk();
    cashDesk.Id = 1;
    cashDesk.IsOpened = false;
    service.CurrentStore = new Store();
    service.CurrentStore.IsOpened = true;
    getRepository(CashDesk).push(cashDesk);
    const result = service.openCashDesk(cashDesk.Id);
    expect(result).toBe(true);
    expect(cashDesk.IsOpened).toBe(true);
    expect(service.CurrentCashDesk).toBe(cashDesk);
  });
});
