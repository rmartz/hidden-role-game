"use client";

import { useState } from "react";

interface JsonTreeNodeProps {
  label: string;
  value: unknown;
  defaultExpanded?: boolean;
}

function JsonTreeNode({
  label,
  value,
  defaultExpanded = false,
}: JsonTreeNodeProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

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

interface JsonTreeProps {
  data: unknown;
}

export function JsonTree({ data }: JsonTreeProps) {
  if (data === null || typeof data !== "object") {
    return <span>{String(data)}</span>;
  }

  const isArray = Array.isArray(data);
  const entries = isArray
    ? (data as unknown[]).map((v, i) => [String(i), v] as [string, unknown])
    : Object.entries(data as Record<string, unknown>);

  return (
    <div className="font-mono text-xs space-y-0.5">
      {entries.map(([k, v]) => (
        <JsonTreeNode key={k} label={k} value={v} />
      ))}
    </div>
  );
}
