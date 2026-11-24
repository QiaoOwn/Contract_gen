import {CoCoMESystem, Supplier, getRepository} from './entry';
import {expectSameMembers} from '../helpers/contractOracle';

describe('Source-aligned complete supplier result', () => {
  beforeEach(() => getRepository(Supplier).splice(0));
  it.each([[], [51], [611, 0, -31], [-62, -41], [0], [83, 83]].map(ids => ({ids})))('returns all supplier identities in $ids', ({ids}) => {
    const suppliers = ids.map(Id => Object.assign(new Supplier(), {Id, Name: 'Same supplier attributes'}));
    getRepository(Supplier).push(...suppliers);
    expectSameMembers(new CoCoMESystem().listSuppliers(), suppliers);
  });
});
