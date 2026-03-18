"use client";

import { JsonTreeNode } from "./JsonTreeNode";

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
