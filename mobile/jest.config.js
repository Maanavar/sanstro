/** @type {import('jest').Config} */

const sharedModuleNameMapper = {
  "^@vinaadi/shared/(.*)$": "<rootDir>/../packages/shared/src/$1",
  "^@vinaadi/shared$": "<rootDir>/../packages/shared/src/index.ts",
  "^@/(.*)$": "<rootDir>/src/$1",
  "^expo-crypto$": "<rootDir>/__mocks__/expo-crypto.ts",
};

module.exports = {
  projects: [
    {
      // Pure TypeScript utility tests — fast, no RN/jsdom overhead.
      displayName: "utils",
      testEnvironment: "node",
      transform: { "^.+\\.tsx?$": "babel-jest" },
      testMatch: ["<rootDir>/__tests__/**/*.test.ts"],
      moduleNameMapper: sharedModuleNameMapper,
    },
    {
      // React context / hook tests — pure React (no RN native), jsdom environment.
      // sessionContext.tsx uses only React hooks, so @testing-library/react works here.
      displayName: "react",
      testEnvironment: "jsdom",
      transform: { "^.+\\.tsx?$": "babel-jest" },
      testMatch: ["<rootDir>/__tests__/**/*.react.test.tsx"],
      moduleNameMapper: {
        ...sharedModuleNameMapper,
        // Pin React to the version installed locally under mobile/ so that
        // @testing-library/react and sessionContext both reference the same copy.
        "^react$": "<rootDir>/node_modules/react",
        "^react/(.*)$": "<rootDir>/node_modules/react/$1",
        "^react-dom$": "<rootDir>/node_modules/react-dom",
        "^react-dom/(.*)$": "<rootDir>/node_modules/react-dom/$1",
      },
    },
    {
      // Full screen renders — real RN primitives via @testing-library/react-native
      // and the jest-expo preset (derives react-native/jest-preset, gives us its
      // node-based `react-native-env` test environment — RNTL renders into RN's
      // own tree, not a DOM, so jsdom is neither needed nor correct here).
      // Nothing used this before: 0 screen-level tests existed anywhere in this
      // repo despite @testing-library/react-native and jest-expo already being
      // installed — the config simply never wired a project to them.
      displayName: "screens",
      preset: "jest-expo",
      testMatch: ["<rootDir>/__tests__/**/*.screen.test.tsx"],
      moduleNameMapper: sharedModuleNameMapper,
      setupFilesAfterEnv: ["<rootDir>/jest.setup.screens.js"],
    },
  ],
};
