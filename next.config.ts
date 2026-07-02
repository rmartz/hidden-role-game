import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

// Only create Sentry releases / upload source maps for production deploys.
//
// The Sentry build plugin creates a release named after the build's commit SHA
// whenever an auth token is present. On Vercel the token is set for every
// environment, so *preview* builds were creating releases keyed on
// feature-branch commits. Because we squash-merge, those commits are discarded
// when the PR merges — so the release list fills with releases whose commit no
// longer exists in main's history. The `Sentry Release` CI job then runs
// `sentry-cli releases set-commits <sha> --auto`, which resolves the *previous*
// release's commit to compute the range; when that previous release is a
// squashed preview commit it can't be found and the job fails ("Could not find
// the SHA of the previous release in the git history … amended or squashed").
//
// Gating release creation + source-map upload to production means every release
// corresponds to a durable main commit, so `set-commits --auto` always finds a
// reachable previous release. Runtime error capture in previews is unaffected —
// that comes from the SDK init in the instrumentation files, not this plugin.
const isProductionDeploy = process.env["VERCEL_ENV"] === "production";

export default withSentryConfig(nextConfig, {
  org: "reedmartz",
  project: "hidden-role-game",
  authToken: process.env["SENTRY_AUTH_TOKEN"],
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring",
  silent: !process.env["CI"],
  release: {
    create: isProductionDeploy,
    finalize: isProductionDeploy,
  },
  sourcemaps: {
    disable: !isProductionDeploy,
  },
});
