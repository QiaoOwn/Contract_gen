import {getRepository, ManageProductCatalogCRUDService, ProductCatalog} from './entry';
describe('CoCoME/ManageProductCatalogCRUDService/deleteProductCatalog', () => {
  it('Happy Path', () => {
    const service = new ManageProductCatalogCRUDService();
    const productCatalog = new ProductCatalog();
    productCatalog.Id = 1;
    productCatalog.Name = 'test';
    getRepository(ProductCatalog).push(productCatalog);
    const result = service.deleteProductCatalog(1);
    expect(result).toBe(true);
    expect(getRepository(ProductCatalog).length).toBe(0);
  });
});
