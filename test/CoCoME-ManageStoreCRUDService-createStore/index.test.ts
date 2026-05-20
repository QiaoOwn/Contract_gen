import {getRepository, ManageStoreCRUDService, Store} from './entry';
describe('CoCoME/ManageStoreCRUDService/createStore', () => {
  it('Happy Path', () => {
    const service = new ManageStoreCRUDService();
    const result = service.createStore(1, 'testname', 'testlocation', true);
    expect(result).toBe(true);
    expect(
      getRepository(Store).find(
        (e) => e.Id === 1 && e.Name === 'testname' && e.Address === 'testlocation'
      )
    ).toBeDefined();
  });
});
