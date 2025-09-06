module.exports = {
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/?(*.)+(spec|test).+(ts|tsx|js)',
  ],
  testEnvironment: 'node',
  setupFilesAfterEnv: [
    '<rootDir>/src/__mocks__/setupFetch.ts',
    '<rootDir>/src/__mocks__/silenceConsole.ts',
  ],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  collectCoverage: true,
  verbose: true,
};
