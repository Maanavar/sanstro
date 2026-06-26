import React from "react";
import "@testing-library/jest-dom";

(globalThis as typeof globalThis & { React: typeof React }).React = React;
