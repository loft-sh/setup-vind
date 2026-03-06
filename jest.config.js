module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: ['./src/**'],
  coverageReporters: ['lcov', 'text'],
  resolver: '<rootDir>/jest-resolver.js',
  transformIgnorePatterns: ['node_modules/(?!@actions/)'],
  transform: {
    '^.+\\.[tj]sx?$': ['ts-jest', { tsconfig: { allowJs: true } }],
  },
};
