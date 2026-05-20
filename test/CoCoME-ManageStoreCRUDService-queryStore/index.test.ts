import {getRepository, ManageStoreCRUDService, Store} from './entry';
describe('CoCoME/ManageStoreCRUDService/queryStore', () => {
  it('Happy Path', () => {
    const service = new ManageStoreCRUDService();
    const store = new Store();
    store.Id = 1;
    store.Name = 'testStore';
    store.Address = 'testAddress';
    store.IsOpened = true;
    getRepository(Store).push(store);
    const result = service.queryStore(1);
    expect(result).toBe(store);
  });
});
