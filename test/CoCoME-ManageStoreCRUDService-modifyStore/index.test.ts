import {getRepository, ManageStoreCRUDService, Store} from './entry';
describe('CoCoME/ManageStoreCRUDService/modifyStore', () => {
  it('Happy Path', () => {
    const service = new ManageStoreCRUDService();
    const store = new Store();
    store.Id = 1;
    store.Name = 'testStore';
    store.Address = 'testAddress';
    store.IsOpened = true;
    getRepository(Store).push(store);
    const result = service.modifyStore(store.Id, 'modifiedName', 'modifiedAddress', false);
    expect(result).toBe(true);
    expect(store.Name).toBe('modifiedName');
    expect(store.Address).toBe('modifiedAddress');
    expect(store.IsOpened).toBe(false);
  });
});
