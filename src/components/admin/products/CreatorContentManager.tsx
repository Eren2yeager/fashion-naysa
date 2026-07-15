"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";

export interface CreatorInput {
  creatorName: string;
  platform: string;
  url: string;
  embedHtml?: string;
}

export type CreatorAction =
  | { type: "ADD_CREATOR"; payload: CreatorInput }
  | { type: "MOVE_CREATOR"; fromIndex: number; toIndex: number }
  | { type: "REMOVE_CREATOR"; index: number };

interface CreatorContentManagerProps {
  items: CreatorInput[];
  dispatch: React.Dispatch<CreatorAction>;
}

const EMPTY: CreatorInput = { creatorName: "", platform: "", url: "", embedHtml: "" };

export function CreatorContentManager({ items, dispatch }: CreatorContentManagerProps) {
  const [adding, setAdding] = React.useState(false);
  const [draft, setDraft] = React.useState<CreatorInput>(EMPTY);
  const [draftError, setDraftError] = React.useState<string>("");

  function handleAdd() {
    if (!draft.creatorName || !draft.platform) {
      setDraftError("Creator name and platform are required.");
      return;
    }
    if (!draft.url.startsWith("http://") && !draft.url.startsWith("https://")) {
      setDraftError("URL must start with http:// or https://");
      return;
    }
    dispatch({ type: "ADD_CREATOR", payload: draft });
    setDraft(EMPTY);
    setDraftError("");
    setAdding(false);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Creator Content</span>
        {!adding && (
          <Button type="button" variant="outline" size="sm" onClick={() => setAdding(true)}>
            Add creator
          </Button>
        )}
      </div>

      {items.length > 0 && (
        <ol className="space-y-2">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 rounded-md border border-border bg-muted/20 p-3 text-sm">
              <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                <span className="font-medium">{item.creatorName}</span>
                <span className="text-muted-foreground">{item.platform}</span>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate text-xs text-primary underline underline-offset-2"
                >
                  {item.url}
                </a>
                {item.embedHtml && (
                  <span className="text-xs text-muted-foreground italic">Has embed HTML</span>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={i === 0}
                  onClick={() => dispatch({ type: "MOVE_CREATOR", fromIndex: i, toIndex: i - 1 })}
                  aria-label="Move up"
                >
                  ↑
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={i === items.length - 1}
                  onClick={() => dispatch({ type: "MOVE_CREATOR", fromIndex: i, toIndex: i + 1 })}
                  aria-label="Move down"
                >
                  ↓
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => dispatch({ type: "REMOVE_CREATOR", index: i })}
                  aria-label="Remove"
                >
                  ✕
                </Button>
              </div>
            </li>
          ))}
        </ol>
      )}

      {adding && (
        <div className="rounded-md border border-border bg-muted/20 p-3 space-y-3">
          <p className="text-sm font-medium">New creator entry</p>
          {draftError && <p className="text-sm text-destructive">{draftError}</p>}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {([
              { field: "creatorName", label: "Creator name" },
              { field: "platform", label: "Platform" },
              { field: "url", label: "URL" },
            ] as const).map(({ field, label }) => (
              <div key={field} className={`flex flex-col gap-1 ${field === "url" ? "sm:col-span-2" : ""}`}>
                <label className="text-xs text-muted-foreground">{label}</label>
                <input
                  className="rounded border border-border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  value={draft[field] ?? ""}
                  onChange={(e) => setDraft((d) => ({ ...d, [field]: e.target.value }))}
                  placeholder={field === "url" ? "https://" : ""}
                />
              </div>
            ))}
            <div className="flex flex-col gap-1 sm:col-span-2">
              <label className="text-xs text-muted-foreground">Embed HTML (optional)</label>
              <textarea
                className="rounded border border-border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                rows={3}
                value={draft.embedHtml ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, embedHtml: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={handleAdd}>Add</Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => { setAdding(false); setDraft(EMPTY); setDraftError(""); }}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
