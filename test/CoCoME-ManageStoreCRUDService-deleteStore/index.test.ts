import {getRepository, ManageStoreCRUDService, Store} from './entry';
describe('CoCoME/ManageStoreCRUDService/deleteStore', () => {
  it('Happy Path', () => {
    const service = new ManageStoreCRUDService();
    const store = new Store();
    store.Id = 1;
    store.Name = 'testStore';
    store.Address = 'testAddress';
    store.IsOpened = true;
    getRepository(Store).push(store);
    const result = service.deleteStore(1);
    expect(result).toBe(true);
    expect(getRepository(Store).length).toBe(0);
  });
});
