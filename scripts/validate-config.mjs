#!/usr/bin/env node
/**
 * Validates deployment config files against deployment/schema.yml.
 *
 * Reads each environment listed in deployment/environments.yml, loads the
 * corresponding deployment/{env}.yml, and checks every key against:
 *   1. denied_patterns  — reject immediately (belt-and-suspenders)
 *   2. allowed_patterns — accept if matched
 *   3. allowed_keys     — accept if listed explicitly
 *
 * Exits 0 if all configs are valid, 1 if any violations are found.
 * Accepts optional --env=<name> to validate a single environment.
 */

import { existsSync, readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const deploymentDir = join(root, "deployment");

function parseYamlSimple(content) {
  // Minimal YAML parser for the constrained flat-key: value format used here.
  // Does not handle anchors, multiline values, or nested structures.
  const result = {};
  for (const rawLine of content.split("\n")) {
    const line = rawLine.replace(/#.*$/, "").trim();
    if (!line) continue;
    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) continue;
    const key = line.slice(0, colonIndex).trim();
    const value = line
      .slice(colonIndex + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
    if (key) result[key] = value;
  }
  return result;
}

function parseYamlList(content, listKey) {
  const lines = content.split("\n");
  const items = [];
  let inList = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith(`${listKey}:`)) {
      inList = true;
      continue;
    }
    if (inList) {
      if (trimmed.startsWith("- ")) {
        items.push(
          trimmed
            .slice(2)
            .replace(/#.*$/, "")
            .replace(/^["']|["']$/g, "")
            .trim(),
        );
      } else if (trimmed && !trimmed.startsWith("#")) {
        inList = false;
      }
    }
  }
  return items;
}

function globMatch(pattern, key) {
  const regex = new RegExp(
    "^" +
      pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*") +
      "$",
  );
  return regex.test(key);
}

function loadSchema() {
  const content = readFileSync(join(deploymentDir, "schema.yml"), "utf8");
  return {
    allowedPatterns: parseYamlList(content, "allowed_patterns"),
    allowedKeys: parseYamlList(content, "allowed_keys"),
    deniedPatterns: parseYamlList(content, "denied_patterns"),
  };
}

function loadEnvironments() {
  const content = readFileSync(join(deploymentDir, "environments.yml"), "utf8");
  const envs = parseYamlList(content, "active");
  const parsed = parseYamlSimple(content);
  const singleEnv = parsed["single_environment"] === "true";
  return { environments: envs, singleEnvironment: singleEnv };
}

function validateConfig(envName, schema) {
  const configPath = join(deploymentDir, `${envName}.yml`);
  if (!existsSync(configPath)) {
    return [`deployment/${envName}.yml not found`];
  }

  const content = readFileSync(configPath, "utf8");
  const inVariablesSection = [];
  let inVars = false;
  let foundVariablesBlock = false;
  for (const rawLine of content.split("\n")) {
    const line = rawLine.replace(/#.*$/, "");
    const trimmed = line.trim();
    if (trimmed === "variables:") {
      inVars = true;
      foundVariablesBlock = true;
      continue;
    }
    if (inVars && trimmed && !trimmed.startsWith("#")) {
      // A non-indented line signals a new top-level section — stop collecting
      if (!line.startsWith(" ")) {
        inVars = false;
        continue;
      }
      const colonIndex = trimmed.indexOf(":");
      if (colonIndex !== -1) {
        const key = trimmed.slice(0, colonIndex).trim();
        // Skip commented-out example lines (original line starts with whitespace + #)
        if (!rawLine.trim().startsWith("#") && key) {
          inVariablesSection.push(key);
        }
      }
    }
  }

  const errors = [];
  if (!foundVariablesBlock) {
    errors.push(
      `  MISSING  variables:  (no variables: block found in deployment/${envName}.yml)`,
    );
    return errors;
  }
  for (const key of inVariablesSection) {
    const isDenied = schema.deniedPatterns.some((p) => globMatch(p, key));
    if (isDenied) {
      errors.push(
        `  DENIED   ${key}  (matches a denied_pattern in schema.yml)`,
      );
      continue;
    }
    const isAllowed =
      schema.allowedPatterns.some((p) => globMatch(p, key)) ||
      schema.allowedKeys.includes(key);
    if (!isAllowed) {
      errors.push(
        `  REJECTED ${key}  (not in allowed_patterns or allowed_keys in schema.yml)`,
      );
    }
  }
  return errors;
}

const args = process.argv.slice(2);
const envArg = args.find((a) => a.startsWith("--env="))?.slice(6);

const { environments, singleEnvironment } = loadEnvironments();
const schema = loadSchema();

const toValidate = envArg ? [envArg] : environments;

if (!singleEnvironment && environments.length < 2 && !envArg) {
  console.error(
    "ERROR: environments.yml lists fewer than 2 environments but single_environment is not true.\n" +
      "Set single_environment: true if this project intentionally uses one environment.",
  );
  process.exit(1);
}

let anyErrors = false;
for (const env of toValidate) {
  const errors = validateConfig(env, schema);
  if (errors.length > 0) {
    console.error(`\ndeployment/${env}.yml — ${errors.length} violation(s):`);
    for (const e of errors) console.error(e);
    anyErrors = true;
  } else {
    console.log(`deployment/${env}.yml — OK`);
  }
}

if (anyErrors) {
  console.error(
    "\nFix the violations above or update deployment/schema.yml to allow these keys.",
  );
  process.exit(1);
}
