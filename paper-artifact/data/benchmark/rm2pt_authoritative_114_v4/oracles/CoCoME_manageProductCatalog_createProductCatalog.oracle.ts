import {ProductCatalog, ManageProductCatalogCRUDService, getRepository} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

describe('CoCoME/ManageProductCatalogCRUDService/createProductCatalog', () => {
  beforeEach(() => clearRepositories(getRepository(ProductCatalog)));

  it('creates exactly one stored ProductCatalog with the supplied ID and name', () => {
    const neighbor = Object.assign(new ProductCatalog(), {Id: 2, Name: 'neighbor'});
    getRepository(ProductCatalog).push(neighbor);
    expect(new ManageProductCatalogCRUDService().createProductCatalog(1, 'test')).toBe(true);
    const created = getRepository(ProductCatalog).filter(item => item !== neighbor);
    expect(getRepository(ProductCatalog)).toHaveLength(2);
    expect(created).toHaveLength(1);
    expect(created[0]).toBeInstanceOf(ProductCatalog);
    expect(created[0].Id).toBe(1);
    expect(created[0].Name).toBe('test');
    expect(getRepository(ProductCatalog)).toContain(neighbor);
  });

  it('rejects a duplicate ID without adding or replacing a ProductCatalog', () => {
    const existing = Object.assign(new ProductCatalog(), {Id: 1, Name: 'original'});
    getRepository(ProductCatalog).push(existing);
    expectPreconditionRejected(() => new ManageProductCatalogCRUDService().createProductCatalog(1, 'test'));
    expect(getRepository(ProductCatalog)).toEqual([existing]);
    expect(existing.Name).toBe('original');
  });
});
