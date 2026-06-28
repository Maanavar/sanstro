/** @type {import('jest').Config} */
module.exports = {
  // "node" environment: no jsdom / React Native setup — fine for pure TS utility tests.
  // When component/render tests are added, split this into a separate project config
  // with preset "jest-expo" and testEnvironment "jsdom".
  testEnvironment: "node",
  transform: {
    "^.+\\.tsx?$": "babel-jest",
  },
  testMatch: ["**/__tests__/**/*.test.ts", "**/__tests__/**/*.test.tsx"],
  // Resolve workspace packages to source so babel-jest can transpile them
  moduleNameMapper: {
    "^@vinaadi/shared/(.*)$": "<rootDir>/../packages/shared/src/$1",
    "^@/(.*)$": "<rootDir>/$1",
  },
};
