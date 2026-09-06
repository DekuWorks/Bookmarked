import { describe, expect, it } from "vitest";
import {
  formatListeningTime,
  parseListeningTime,
  validateListeningSession,
} from "../../../../packages/utils/listeningTime";

describe("mobile listening time helpers", () => {
  it("converts stored seconds to HH:MM for readers", () => {
    expect(formatListeningTime(9000)).toBe("2:30");
    expect(parseListeningTime("2:5")).toMatchObject({ ok: true, display: "2:05", seconds: 7500 });
  });

  it("rejects an ending position before the start", () => {
    expect(validateListeningSession({ start: "2:30", end: "1:45" }).ok).toBe(false);
  });
});
