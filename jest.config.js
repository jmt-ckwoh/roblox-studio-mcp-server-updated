export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\.{1,2}/.*)\.js$': '$1',
  },
  transform: {
    '^.+\.tsx?$': ['ts-jest', {
      useESM: true,
    }],
  },
  setupFilesAfterEnv: ['./jest.setup.js'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/types/**/*.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60
    }
  },
  testMatch: ['**/*.test.ts'],
};
