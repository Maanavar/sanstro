import { afterEach, describe, expect, it } from "vitest";

import { API_ERROR_CODES, type ApiError } from "@vinaadi/shared/api";

import { ApiRequestError } from "./api";
import { formatErrorMessage } from "./error-messages";

const TYPED_BIRTH_TIME_ERROR: ApiError = {
  code: "BIRTH_TIME_REQUIRED",
  message: {
    ta: "இந்தக் கணக்கீட்டிற்கு பிறந்த நேரம் தேவை.",
    en: "A birth time is required for this calculation.",
  },
  requestId: "req-error-test",
  detail: "A birth time is required for this calculation.",
  status: 422,
};

afterEach(() => {
  document.documentElement.lang = "en";
});

describe("formatErrorMessage", () => {
  it("renders a typed error in the active Tamil language", () => {
    document.documentElement.lang = "ta";
    const error = new ApiRequestError(422, "/birth-profiles", TYPED_BIRTH_TIME_ERROR);

    expect(formatErrorMessage(error)).toMatchObject({
      code: "BIRTH_TIME_REQUIRED",
      title: "பிறந்த நேரம் தேவை",
      message: "இந்தக் கணக்கீட்டிற்கு பிறந்த நேரம் தேவை.",
      statusCode: 422,
    });
  });

  it("keeps the narrow legacy birth-time fallback for pre-envelope errors", () => {
    expect(formatErrorMessage(new Error("422: birth time is required"))).toMatchObject({
      code: "BIRTH_TIME_REQUIRED",
      title: "Birth Time Required",
    });
  });

  it("does not classify unrelated text by a broad legacy substring", () => {
    const info = formatErrorMessage(new Error("sunrise unavailable"));

    expect(info.code).toBeUndefined();
    expect(info.title).toBe("Something went wrong");
  });

  it("has an intentional presentation title for every typed API code", () => {
    for (const code of API_ERROR_CODES) {
      const typedError: ApiError = {
        code,
        message: { ta: "சோதனை", en: "Test" },
        requestId: "req-error-catalogue",
        detail: "Test",
        status: 400,
      };

      expect(formatErrorMessage(new ApiRequestError(400, "/test", typedError)).title).not.toBe(
        "Something went wrong",
      );
    }
  });
});
