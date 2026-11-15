import { describe, it, expect } from "vitest";
import { offlineParseEvent } from "../lib/ai/events";

describe("Event NLP Parser (Offline Baseline)", () => {
  it("parses meeting with person and time correctly", () => {
    // Fixed reference date: Wednesday, Nov 11, 2026, 10:00 AM
    const refDate = new Date("2026-11-11T10:00:00.000Z");
    const result = offlineParseEvent("Meeting with Rahul on Sunday 5 pm", refDate);

    expect(result.people).toContain("Rahul");
    expect(result.remind_offsets).toEqual([30, 0]);
    expect(result.display_time).toContain("5:00 PM");
    expect(new Date(result.starts_at).getHours()).toBe(17);
  });

  it("handles tomorrow reminder gracefully", () => {
    const refDate = new Date("2026-11-11T10:00:00.000Z");
    const result = offlineParseEvent("Dentist appointment tomorrow 3:30 pm", refDate);

    expect(result.title).toContain("Dentist appointment");
    expect(new Date(result.starts_at).getDate()).toBe(12);
    expect(new Date(result.starts_at).getMinutes()).toBe(30);
  });

  it("extracts multiple people from with clause", () => {
    const refDate = new Date("2026-11-11T10:00:00.000Z");
    const result = offlineParseEvent("Sync with Priya and Vikram at 4 pm", refDate);

    expect(result.people).toContain("Priya");
    expect(result.people).toContain("Vikram");
  });
});
