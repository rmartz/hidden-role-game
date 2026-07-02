import { readdirSync, readFileSync } from "fs";
import { resolve } from "path";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";

// Per-job timeout caps in minutes, tuned from observed p95 + ~1.8x headroom
// across recent successful runs. Browser-heavy jobs (tests run Playwright,
// screenshots build + serve Storybook) are sized higher. Adding a job to any
// workflow requires registering it here, or the test below fails — forcing a
// deliberate cap rather than leaving a job unbounded.
const EXPECTED_TIMEOUT_MINUTES: Record<string, Record<string, number>> = {
  "ci-actions.yml": {
    build: 2,
    format: 2,
    lint: 2,
    "sentry-release": 2,
    "storybook-tests": 4,
    tests: 2,
    typecheck: 1,
  },
  "config-validate.yml": {
    "validate-config": 2,
  },
  "file-length.yml": {
    check: 2,
  },
  "package-pins.yml": {
    "check-pins": 1,
  },
  "pr-title-lint.yml": {
    "pr-title": 1,
  },
  "storybook-screenshots-cleanup.yml": {
    cleanup: 1,
  },
  "storybook-screenshots.yml": {
    screenshots: 5,
  },
};

const workflowsDir = resolve(import.meta.dirname, "../.github/workflows");

interface WorkflowJob {
  "timeout-minutes"?: number;
  uses?: string;
}

interface WorkflowFile {
  fileName: string;
  jobs: Record<string, WorkflowJob>;
}

function loadWorkflows(): WorkflowFile[] {
  return readdirSync(workflowsDir)
    .filter((name) => name.endsWith(".yml") || name.endsWith(".yaml"))
    .map((fileName) => {
      const parsed = parse(
        readFileSync(resolve(workflowsDir, fileName), "utf-8"),
      ) as { jobs: Record<string, WorkflowJob> };
      return { fileName, jobs: parsed.jobs };
    });
}

describe("GitHub Actions workflow timeouts", () => {
  const workflows = loadWorkflows();

  it("registers every workflow file in EXPECTED_TIMEOUT_MINUTES", () => {
    const onDisk = workflows.map((workflow) => workflow.fileName).sort();
    expect(onDisk).toEqual(Object.keys(EXPECTED_TIMEOUT_MINUTES).sort());
  });

  for (const { fileName, jobs } of workflows) {
    for (const [jobId, job] of Object.entries(jobs)) {
      const expected = EXPECTED_TIMEOUT_MINUTES[fileName]?.[jobId];

      it(`${fileName} job "${jobId}" has its expected timeout`, () => {
        if (job.uses !== undefined) {
          // GitHub Actions rejects timeout-minutes on reusable-workflow callers.
          expect(job["timeout-minutes"]).toBeUndefined();
          expect(expected).toBeUndefined();
          return;
        }

        expect(
          expected,
          `job "${jobId}" in ${fileName} needs a registered cap`,
        ).toBeDefined();
        expect(job["timeout-minutes"]).toBe(expected);
      });
    }
  }
});
