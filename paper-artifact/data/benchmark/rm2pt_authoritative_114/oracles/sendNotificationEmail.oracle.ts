import {ThirdPartyServices} from './entry';
import {expectPreconditionRejected} from '../helpers/contractOracle';

describe('ThirdPartyServices notification contract', () => {
  test.each(['notify@example.org', 'not-an-address', '   '])('accepts nonempty string %j', email => {
    expect(new ThirdPartyServices().sendNotificationEmail(email)).toBe(true);
  });
  test('rejects the empty string', () => {
    expectPreconditionRejected(() => new ThirdPartyServices().sendNotificationEmail(''));
  });
});
