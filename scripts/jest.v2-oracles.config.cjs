const base = require('../jest.config.js');
module.exports = {
  ...base,
  rootDir: require('path').resolve(__dirname, '..'),
  testMatch: ['<rootDir>/data/operation_revision/oracles_v2/**/*.test.ts'],
  collectCoverage: false,
};
