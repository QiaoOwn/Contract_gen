import {ProductCatalog, ManageProductCatalogCRUDService, getRepository} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

describe('CoCoME/ManageProductCatalogCRUDService/deleteProductCatalog', () => {
  beforeEach(() => clearRepositories(getRepository(ProductCatalog)));

  it('removes the selected ProductCatalog, preserves its neighbor, and returns true', () => {
    const target = Object.assign(new ProductCatalog(), {Id: 1, Name: 'target'});
    const neighbor = Object.assign(new ProductCatalog(), {Id: 2, Name: 'neighbor'});
    getRepository(ProductCatalog).push(target, neighbor);
    expect(new ManageProductCatalogCRUDService().deleteProductCatalog(1)).toBe(true);
    expect(getRepository(ProductCatalog)).toEqual([neighbor]);
  });

  it('rejects a missing ID without removing another ProductCatalog', () => {
    const neighbor = Object.assign(new ProductCatalog(), {Id: 2, Name: 'neighbor'});
    getRepository(ProductCatalog).push(neighbor);
    expectPreconditionRejected(() => new ManageProductCatalogCRUDService().deleteProductCatalog(99));
    expect(getRepository(ProductCatalog)).toEqual([neighbor]);
  });
});
