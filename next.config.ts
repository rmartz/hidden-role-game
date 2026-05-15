import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

export default withSentryConfig(nextConfig, {
  org: "reedmartz",
  project: "hidden-role-game",
  authToken: process.env["SENTRY_AUTH_TOKEN"],
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring",
  silent: !process.env["CI"],
});
