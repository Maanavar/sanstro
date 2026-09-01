import React from "react";
import "@testing-library/jest-dom";

// The `@ts-expect-error` that used to sit here is gone, and so is the mismatch
// it suppressed: the @types/react override now actually applies (it had been
// sitting in package.json, which pnpm 11 no longer reads), so web and mobile
// resolve one version instead of 19.2.17 and 19.1.17.
(globalThis as typeof globalThis & { React: typeof React }).React = React;
