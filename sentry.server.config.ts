import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env["SENTRY_DSN"],

  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,

  // Attach local variable values to stack frames
  includeLocalVariables: true,

  // Answer the browser SDK's `tunnel: true` requests and forward them to Sentry
  integrations: [Sentry.serveTunnelIntegration()],
});
