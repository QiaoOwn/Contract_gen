import {AirportSystem, Device, Staff, getRepository} from './entry';

// Evaluation-only: original preconditions plus the owner's R01 new-object correction.
describe('R01 device creation', () => {
  beforeEach(() => {getRepository(Device).splice(0); getRepository(Staff).splice(0);});
  it.each([{id: 37, name: 'radar', location: 'Terminal East'},
    {id: 0, name: '', location: ''}, {id: -24, name: "sensor 'B'", location: 'Gate / 9'}])('creates and stores the new Device with supplied fields: %j', values => {
    const contact = Object.assign(new Staff(), {Id: 81});
    const other = Object.assign(new Staff(), {Id: 92});
    getRepository(Staff).push(other, contact);
    const existing = Object.assign(new Device(), {Id: 95, Contacts: other});
    getRepository(Device).push(existing);
    const before = [...getRepository(Device)];
    expect(new AirportSystem().createDevice(values.id, values.name, values.location, contact.Id)).toBe(true);
    const created = getRepository(Device).filter(item => !before.includes(item));
    const target = created.find(item => item != null && item.Id === values.id);
    expect(target).toBeDefined();
    expect(target?.Name).toBe(values.name);
    expect(target?.Location).toBe(values.location);
    expect(target?.Contacts).toBe(contact);
    // No assertions about unrelated state or inverse associations are added.
  });
  it('rejects a used identifier', () => {
    const contact = Object.assign(new Staff(), {Id: 11});
    getRepository(Staff).push(contact);
    getRepository(Device).push(Object.assign(new Device(), {Id: 23, Contacts: contact}));
    expect(() => new AirportSystem().createDevice(23, 'x', 'y', 11)).toThrow(expect.objectContaining({name: 'PreconditionError'}));
  });
  it('rejects an unknown staff contact', () => {
    expect(() => new AirportSystem().createDevice(78, 'x', 'y', 44)).toThrow(expect.objectContaining({name: 'PreconditionError'}));
  });
});
