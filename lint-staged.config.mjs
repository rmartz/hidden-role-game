export default {
  "*.{js,mjs,cjs,ts,tsx,jsx}": [
    "eslint --fix --max-warnings 0 --no-warn-ignored",
    "prettier --write",
  ],
  "*.{js,mjs,cjs,ts,tsx,jsx,json,md,yml,yaml}": (files) => {
    const toFormat = files.filter((f) => !f.endsWith("pnpm-lock.yaml"));
    return toFormat.length > 0
      ? [`prettier --write ${toFormat.join(" ")}`]
      : [];
  },
};
