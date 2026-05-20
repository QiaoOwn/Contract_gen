import {getRepository, ManageProductCatalogCRUDService, ProductCatalog} from './entry';
describe('CoCoME/ManageProductCatalogCRUDService/modifyProductCatalog', () => {
  it('Happy Path', () => {
    const service = new ManageProductCatalogCRUDService();
    const productCatalog = new ProductCatalog();
    productCatalog.Id = 1;
    productCatalog.Name = 'test';
    getRepository(ProductCatalog).push(productCatalog);
    const result = service.modifyProductCatalog(1, 'modifiedName');
    expect(result).toBe(true);
    expect(productCatalog.Name).toBe('modifiedName');
  });
});
