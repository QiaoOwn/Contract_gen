import {getRepository, ManageProductCatalogCRUDService, ProductCatalog} from './entry';
describe('CoCoME/ManageProductCatalogCRUDService/queryProductCatalog', () => {
  it('Happy Path', () => {
    const service = new ManageProductCatalogCRUDService();
    const productCatalog = new ProductCatalog();
    productCatalog.Id = 1;
    productCatalog.Name = 'test';
    getRepository(ProductCatalog).push(productCatalog);
    const result = service.queryProductCatalog(1);
    expect(result).toBe(productCatalog);
  });
});
