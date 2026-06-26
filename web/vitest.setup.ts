import React from "react";
import "@testing-library/jest-dom";

// @ts-expect-error - React type version mismatch in workspace
(globalThis as typeof globalThis & { React: typeof React }).React = React;
