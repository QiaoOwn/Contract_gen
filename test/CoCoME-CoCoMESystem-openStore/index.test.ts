import {CoCoMESystem, getRepository, Store} from './entry';
describe('CoCoME/CoCoMESystem/openStore', () => {
  it('Happy Path', () => {
    const service = new CoCoMESystem();
    const store = new Store();
    store.Id = 1;
    store.IsOpened = false;
    getRepository(Store).push(store);
    const result = service.openStore(store.Id);
    expect(result).toBe(true);
    expect(store.IsOpened).toBe(true);
    expect(service.CurrentStore).toBe(store);
  });
});
