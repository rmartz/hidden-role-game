import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { NarratorNightInstruction } from "./NarratorNightInstruction";
import { NARRATOR_NIGHT_INSTRUCTION_COPY } from "./NarratorNightInstruction.copy";

afterEach(cleanup);

describe("NarratorNightInstruction", () => {
  it("renders the heading and wake instruction only when no optional fields are provided", () => {
    render(
      <NarratorNightInstruction
        instruction={{ wakeInstruction: "Tell Seer to open their eyes." }}
      />,
    );

    expect(
      screen.getByText(NARRATOR_NIGHT_INSTRUCTION_COPY.heading),
    ).toBeDefined();
    expect(screen.getByText("“Tell Seer to open their eyes.”")).toBeDefined();
    expect(screen.queryByText(/raise your thumbs/)).toBeNull();
    expect(screen.queryByText(/look around/)).toBeNull();
  });

  it("renders preWake, wakeInstruction, and postWake when all fields are present", () => {
    render(
      <NarratorNightInstruction
        instruction={{
          preWake: "All Werewolves, raise your thumbs.",
          wakeInstruction: "Tell Minion to open their eyes.",
          postWake: "Tell them to look around, then close their eyes.",
        }}
      />,
    );

    expect(
      screen.getByText("“All Werewolves, raise your thumbs.”"),
    ).toBeDefined();
    expect(screen.getByText("“Tell Minion to open their eyes.”")).toBeDefined();
    expect(
      screen.getByText("“Tell them to look around, then close their eyes.”"),
    ).toBeDefined();
  });

  it("renders wakeInstruction and postWake without preWake when preWake is omitted", () => {
    render(
      <NarratorNightInstruction
        instruction={{
          wakeInstruction: "Tell all Werewolves to open their eyes.",
          postWake: "Tell them to find their teammates and choose a target.",
        }}
      />,
    );

    expect(
      screen.getByText("“Tell all Werewolves to open their eyes.”"),
    ).toBeDefined();
    expect(
      screen.getByText(
        "“Tell them to find their teammates and choose a target.”",
      ),
    ).toBeDefined();
    expect(screen.queryByText(/raise your thumbs/)).toBeNull();
  });
});
