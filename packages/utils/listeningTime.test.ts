import { describe, expect, it } from "vitest";
import {
  CURRENT_EXCEEDS_TOTAL_ERROR,
  LISTENING_TIME_ERROR,
  SESSION_END_BEFORE_START_ERROR,
  SESSION_END_EXCEEDS_TOTAL_ERROR,
  calculateAudiobookProgress,
  calculateAudiobookSessionDuration,
  formatAudiobookProgressLabel,
  formatHistorySessionDetail,
  formatListeningSessionSummary,
  formatListeningTime,
  formatListeningTimeSpoken,
  nextListeningProgressAfterSession,
  parseListeningTime,
  resolveAudiobookDurationSeconds,
  resolveTrackingFormat,
  validateListeningProgress,
  validateListeningSession,
} from "./listeningTime";

describe("parseListeningTime", () => {
  it("parses hours and minutes into seconds", () => {
    expect(parseListeningTime("2:30")).toEqual({
      ok: true,
      seconds: 9000,
      hours: 2,
      minutes: 30,
      display: "2:30",
    });
    expect(parseListeningTime("20:30")).toMatchObject({ ok: true, seconds: 73800, display: "20:30" });
    expect(parseListeningTime("0:30")).toMatchObject({ ok: true, seconds: 1800, display: "0:30" });
  });

  it("normalizes unpadded minutes on parse", () => {
    expect(parseListeningTime("2:5")).toMatchObject({
      ok: true,
      seconds: 7500,
      display: "2:05",
    });
  });

  it("rejects seconds, total minutes, and invalid minutes", () => {
    expect(parseListeningTime("02:30:00")).toEqual({ ok: false, error: LISTENING_TIME_ERROR });
    expect(parseListeningTime("9000")).toEqual({ ok: false, error: LISTENING_TIME_ERROR });
    expect(parseListeningTime("2:60")).toEqual({ ok: false, error: LISTENING_TIME_ERROR });
    expect(parseListeningTime("2")).toEqual({ ok: false, error: LISTENING_TIME_ERROR });
    expect(parseListeningTime("")).toEqual({ ok: false, error: LISTENING_TIME_ERROR });
  });
});

describe("formatListeningTime", () => {
  it("shows 2:30 for 9000 seconds and never pads hours", () => {
    expect(formatListeningTime(9000)).toBe("2:30");
    expect(formatListeningTime(73800)).toBe("20:30");
    expect(formatListeningTime(0)).toBe("0:00");
  });

  it("rounds leftover seconds to the nearest minute", () => {
    expect(formatListeningTime(9030)).toBe("2:31");
  });
});

describe("formatListeningTimeSpoken", () => {
  it("uses accessible hour and minute wording", () => {
    expect(formatListeningTimeSpoken(9000)).toBe("2 hours 30 minutes");
    expect(formatListeningTimeSpoken(3600)).toBe("1 hour");
    expect(formatListeningTimeSpoken(1800)).toBe("30 minutes");
    expect(formatListeningTimeSpoken(60)).toBe("1 minute");
  });
});

describe("calculateAudiobookProgress", () => {
  it("uses the same one-decimal rounding as page progress", () => {
    expect(calculateAudiobookProgress(9000, 73800)).toBe(12.2);
    expect(calculateAudiobookProgress(73800, 73800)).toBe(100);
    expect(calculateAudiobookProgress(0, 73800)).toBe(0);
    expect(calculateAudiobookProgress(100, 0)).toBe(0);
  });
});

describe("calculateAudiobookSessionDuration", () => {
  it("subtracts start from end in seconds", () => {
    expect(calculateAudiobookSessionDuration(6300, 9000)).toBe(2700);
    expect(calculateAudiobookSessionDuration(9000, 6300)).toBe(0);
  });
});

describe("validateListeningProgress", () => {
  it("accepts current at or below total", () => {
    expect(validateListeningProgress({ current: "2:30", total: "20:30" })).toEqual({
      ok: true,
      currentSeconds: 9000,
      totalSeconds: 73800,
      percent: 12.2,
    });
  });

  it("rejects current after total", () => {
    expect(validateListeningProgress({ current: "21:00", total: "20:30" })).toEqual({
      ok: false,
      error: CURRENT_EXCEEDS_TOTAL_ERROR,
    });
  });
});

describe("validateListeningSession", () => {
  it("accepts an ending position after the start", () => {
    expect(validateListeningSession({ start: "1:45", end: "2:30", total: "20:30" })).toEqual({
      ok: true,
      startSeconds: 6300,
      endSeconds: 9000,
      durationSeconds: 2700,
    });
  });

  it("rejects an ending position before the start", () => {
    expect(validateListeningSession({ start: "2:30", end: "1:45" })).toEqual({
      ok: false,
      error: SESSION_END_BEFORE_START_ERROR,
    });
  });

  it("rejects an ending position past a known total", () => {
    expect(validateListeningSession({ start: "1:45", end: "21:00", total: "20:30" })).toEqual({
      ok: false,
      error: SESSION_END_EXCEEDS_TOTAL_ERROR,
    });
  });
});

describe("nextListeningProgressAfterSession", () => {
  it("moves current forward but never backwards", () => {
    expect(nextListeningProgressAfterSession(3600, 9000)).toBe(9000);
    expect(nextListeningProgressAfterSession(9000, 3600)).toBe(9000);
  });
});

describe("resolveTrackingFormat", () => {
  it("prefers the user-book format over the catalog", () => {
    expect(resolveTrackingFormat({ userFormat: "audiobook", catalogFormat: "book" })).toBe(
      "audiobook"
    );
    expect(resolveTrackingFormat({ userFormat: "book", catalogFormat: "audiobook" })).toBe("book");
    expect(resolveTrackingFormat({ userFormat: null, catalogFormat: "audiobook" })).toBe(
      "audiobook"
    );
  });
});

describe("resolveAudiobookDurationSeconds", () => {
  it("prefers the user edition duration", () => {
    expect(
      resolveAudiobookDurationSeconds({
        userDurationSeconds: 73800,
        catalogDurationSeconds: 9000,
      })
    ).toBe(73800);
    expect(
      resolveAudiobookDurationSeconds({
        userDurationSeconds: null,
        catalogDurationSeconds: 9000,
      })
    ).toBe(9000);
  });
});

describe("session copy", () => {
  it("uses listened wording instead of pages", () => {
    expect(
      formatListeningSessionSummary({
        listening_start_seconds: 6300,
        listening_end_seconds: 9000,
        listening_seconds: 2700,
      })
    ).toBe("Listened from 1:45 to 2:30 · 45 minutes");
    expect(formatAudiobookProgressLabel(9000, 73800)).toBe("2:30 of 20:30");
    expect(
      formatHistorySessionDetail({
        session_format: "audiobook",
        pages_read: 0,
        listening_seconds: 2700,
      })
    ).toBe("45 minutes");
    expect(formatHistorySessionDetail({ session_format: "book", pages_read: 12 })).toBe("12 pages");
  });
});
