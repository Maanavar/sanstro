/**
 * ENV.EAS_PROJECT_ID must read the nested `extra.eas.projectId` that
 * app.config.ts writes. The old lookup used the flat key "eas.projectId",
 * which never exists, so the getter always threw.
 */

const mockExtra: { current: Record<string, unknown> | undefined } = { current: undefined };

jest.mock("expo-constants", () => ({
  __esModule: true,
  default: {
    get expoConfig() {
      return { extra: mockExtra.current };
    },
  },
}));

import { ENV } from "@/lib/env";

describe("ENV.EAS_PROJECT_ID", () => {
  it("reads the project id nested under extra.eas", () => {
    mockExtra.current = { eas: { projectId: "00000000-0000-4000-8000-000000000000" } };
    expect(ENV.EAS_PROJECT_ID).toBe("00000000-0000-4000-8000-000000000000");
  });

  it("does not accept a flat 'eas.projectId' key in place of the nested one", () => {
    mockExtra.current = { "eas.projectId": "flat-key" };
    expect(() => ENV.EAS_PROJECT_ID).toThrow("Missing EAS env: eas.projectId");
  });

  it("throws when extra has no eas block", () => {
    mockExtra.current = {};
    expect(() => ENV.EAS_PROJECT_ID).toThrow("Missing EAS env: eas.projectId");
  });

  it("throws when extra itself is missing", () => {
    mockExtra.current = undefined;
    expect(() => ENV.EAS_PROJECT_ID).toThrow("Missing EAS env: eas.projectId");
  });
});
