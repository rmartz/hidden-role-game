"use client";

import { useState } from "react";

export interface JsonTreeNodeProps {
  label: string;
  value: unknown;
}

export function JsonTreeNode({ label, value }: JsonTreeNodeProps) {
  const [expanded, setExpanded] = useState(false);

  if (value === null || value === undefined) {
    return (
      <div className="flex gap-1">
        <span className="text-muted-foreground">{label}:</span>
        <span className="text-orange-500">
          {value === null ? "null" : "undefined"}
        </span>
      </div>
    );
  }

  if (typeof value === "string") {
    return (
      <div className="flex gap-1">
        <span className="text-muted-foreground">{label}:</span>
        <span className="text-green-600 dark:text-green-400">{`"${value}"`}</span>
      </div>
    );
  }

  if (typeof value === "boolean" || typeof value === "number") {
    return (
      <div className="flex gap-1">
        <span className="text-muted-foreground">{label}:</span>
        <span
          className={
            typeof value === "boolean"
              ? "text-blue-600 dark:text-blue-400"
              : "text-purple-600 dark:text-purple-400"
          }
        >
          {String(value)}
        </span>
      </div>
    );
  }

  const isArray = Array.isArray(value);
  const entries = isArray
    ? (value as unknown[]).map((v, i) => [String(i), v] as [string, unknown])
    : Object.entries(value as Record<string, unknown>);
  const count = String(entries.length);
  const preview = isArray ? `[${count}]` : `{${count}}`;

  return (
    <div>
      <button
        type="button"
        className="flex gap-1 hover:text-foreground text-left"
        onClick={() => {
          setExpanded((e) => !e);
        }}
      >
        <span className="text-muted-foreground select-none w-3">
          {expanded ? "▾" : "▸"}
        </span>
        <span className="text-muted-foreground">{label}:</span>
        {!expanded && (
          <span className="text-muted-foreground italic">{preview}</span>
        )}
      </button>
      {expanded && (
        <div className="pl-4 border-l border-border ml-1">
          {entries.map(([k, v]) => (
            <JsonTreeNode key={k} label={k} value={v} />
          ))}
        </div>
      )}
    </div>
  );
}
