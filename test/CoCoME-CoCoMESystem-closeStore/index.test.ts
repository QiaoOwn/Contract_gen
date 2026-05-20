import {CoCoMESystem, getRepository, Store} from './entry';
describe('CoCoME/CoCoMESystem/closeStore', () => {
  it('Happy Path', () => {
    const service = new CoCoMESystem();
    const store = new Store();
    store.Id = 1;
    store.IsOpened = true;
    getRepository(Store).push(store);
    const result = service.closeStore(store.Id);
    expect(result).toBe(true);
    expect(store.IsOpened).toBe(false);
  });
});
