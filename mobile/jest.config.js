/** @type {import('jest').Config} */

const sharedModuleNameMapper = {
  "^@vinaadi/shared/(.*)$": "<rootDir>/../packages/shared/src/$1",
  "^@vinaadi/shared$": "<rootDir>/../packages/shared/src/index.ts",
  "^@/(.*)$": "<rootDir>/src/$1",
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
  ],
};
