import { describe, expect, it } from "vitest";
import {
  canInsertContentReport,
  canSelectContentReport,
  canUpdateContentReport,
  isDuplicateReport,
} from "./contentReports";

const row = {
  reporter_id: "user-1",
  target_type: "post",
  target_id: "post-1",
  status: "pending" as const,
};

describe("content report RLS predicates", () => {
  it("lets a user insert only their own report", () => {
    expect(canInsertContentReport(row, "user-1")).toBe(true);
    expect(canInsertContentReport(row, "user-2")).toBe(false);
    expect(canInsertContentReport(row, null)).toBe(false);
  });

  it("lets a user select only their own report", () => {
    expect(canSelectContentReport(row, "user-1")).toBe(true);
    expect(canSelectContentReport(row, "user-2")).toBe(false);
    expect(canSelectContentReport(row, "staff-1", true)).toBe(true);
  });

  it("blocks users from altering resolution", () => {
    expect(canUpdateContentReport(row, "user-1")).toBe(false);
    expect(canUpdateContentReport(row, "staff-1", true)).toBe(true);
  });

  it("dedups the same user + target", () => {
    expect(isDuplicateReport([row], row)).toBe(true);
    expect(
      isDuplicateReport([row], { ...row, target_id: "post-2" })
    ).toBe(false);
  });
});
