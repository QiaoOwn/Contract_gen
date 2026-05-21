const {createDefaultPreset} = require('ts-jest');

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/test/**/*.test.ts', '<rootDir>/test/**/index.test.ts'],
  // Do not set testPathIgnorePatterns here: `jest.runCLI` in graph.ts runs files under
  // test/tmp/ and would otherwise get "No tests found". CI/local `npm test` passes
  // `--testPathIgnorePatterns=test/tmp` in package.json instead.
  coverageDirectory: '<rootDir>/public/coverage',
  coveragePathIgnorePatterns: ['<rootDir>/test/tmp/'],
  transform: {
    ...tsJestTransformCfg,
  },
  setupFiles: ['<rootDir>/setup-test.ts'],
  moduleNameMapper: {
    '@/(.*)': '<rootDir>/src/$1',
  },
};
