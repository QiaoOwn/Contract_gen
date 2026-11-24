import {ProductCatalog, ManageProductCatalogCRUDService, getRepository} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

describe('CoCoME/ManageProductCatalogCRUDService/modifyProductCatalog', () => {
  beforeEach(() => clearRepositories(getRepository(ProductCatalog)));

  it('updates only the selected ProductCatalog and returns true', () => {
    const target = Object.assign(new ProductCatalog(), {Id: 1, Name: 'old'});
    const neighbor = Object.assign(new ProductCatalog(), {Id: 2, Name: 'neighbor'});
    getRepository(ProductCatalog).push(target, neighbor);
    expect(new ManageProductCatalogCRUDService().modifyProductCatalog(1, 'new')).toBe(true);
    expect(getRepository(ProductCatalog)).toEqual([target, neighbor]);
    expect(target.Id).toBe(1);
    expect(target.Name).toBe('new');
    expect(neighbor.Name).toBe('neighbor');
  });

  it('rejects a missing ID without changing another ProductCatalog', () => {
    const neighbor = Object.assign(new ProductCatalog(), {Id: 2, Name: 'neighbor'});
    getRepository(ProductCatalog).push(neighbor);
    expectPreconditionRejected(() => new ManageProductCatalogCRUDService().modifyProductCatalog(99, 'new'));
    expect(getRepository(ProductCatalog)).toEqual([neighbor]);
    expect(neighbor.Name).toBe('neighbor');
  });
});
