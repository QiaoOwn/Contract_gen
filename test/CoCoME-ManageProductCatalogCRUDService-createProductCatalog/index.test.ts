import {getRepository, ManageProductCatalogCRUDService, ProductCatalog} from './entry';
describe('CoCoME/ManageProductCatalogCRUDService/createProductCatalog', () => {
  it('Happy Path', () => {
    const service = new ManageProductCatalogCRUDService();
    const result = service.createProductCatalog(1, 'test');
    expect(result).toBe(true);
    expect(
      getRepository(ProductCatalog).find((e) => e.Id === 1 && e.Name === 'test')
    ).toBeDefined();
  });
});
