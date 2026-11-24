import {AirportSystem, Device, Staff, getRepository} from './entry';
import {clearRepositories, expectPreconditionRejected} from '../helpers/contractOracle';

describe('Airport/AirportSystem/createDevice', () => {
  beforeEach(() => clearRepositories(getRepository(Device), getRepository(Staff)));

  it.each([
    {id: 37, name: 'radar', location: 'Terminal East'},
    {id: 0, name: '', location: ''},
    {id: -24, name: "sensor 'B'", location: 'Gate / 9'},
  ])('creates exactly one stored Device with its supplied fields: %j', values => {
    const contact = Object.assign(new Staff(), {Id: 81});
    const other = Object.assign(new Staff(), {Id: 92});
    getRepository(Staff).push(other, contact);
    const existing = Object.assign(new Device(), {Id: 95, Contacts: other});
    getRepository(Device).push(existing);
    const before = [...getRepository(Device)];

    expect(new AirportSystem().createDevice(values.id, values.name, values.location, contact.Id)).toBe(true);
    const after = getRepository(Device);
    const created = after.filter(item => !before.includes(item));
    expect(after).toHaveLength(before.length + 1);
    expect(created).toHaveLength(1);
    expect(after).toContain(existing);
    expect(created[0]).toBeInstanceOf(Device);
    expect(created[0].Id).toBe(values.id);
    expect(created[0].Name).toBe(values.name);
    expect(created[0].Location).toBe(values.location);
    expect(created[0].Contacts).toBe(contact);
  });

  it('rejects an already used identifier without adding a Device', () => {
    const contact = Object.assign(new Staff(), {Id: 11});
    getRepository(Staff).push(contact);
    const existing = Object.assign(new Device(), {Id: 23, Contacts: contact});
    getRepository(Device).push(existing);
    expectPreconditionRejected(() => new AirportSystem().createDevice(23, 'x', 'y', 11));
    expect(getRepository(Device)).toEqual([existing]);
  });

  it('rejects an unknown contact without adding a Device', () => {
    expectPreconditionRejected(() => new AirportSystem().createDevice(78, 'x', 'y', 44));
    expect(getRepository(Device)).toHaveLength(0);
  });
});
