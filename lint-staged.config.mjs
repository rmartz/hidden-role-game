export default {
  "*.{js,mjs,cjs,ts,tsx,jsx}": [
    // No --max-warnings 0: warnings (the soft max-lines tier) are advisory and
    // must not block a commit; errors still fail via eslint's own exit code.
    "eslint --fix --no-warn-ignored",
    "prettier --write",
  ],
  "*.{json,md,yml,yaml}": (files) => {
    const toFormat = files.filter((f) => !f.endsWith("pnpm-lock.yaml"));
    return toFormat.length > 0
      ? [`prettier --write ${toFormat.join(" ")}`]
      : [];
  },
};
