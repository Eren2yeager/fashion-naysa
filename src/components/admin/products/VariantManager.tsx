"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/admin/shared/ConfirmDialog";

export interface VariantInput {
  sku: string;
  size: string;
  color: string;
  stock: number;
}

export type VariantAction =
  | { type: "ADD_VARIANT"; payload: VariantInput }
  | { type: "UPDATE_VARIANT"; index: number; payload: Partial<VariantInput> }
  | { type: "REMOVE_VARIANT"; index: number };

interface VariantManagerProps {
  variants: VariantInput[];
  dispatch: React.Dispatch<VariantAction>;
  error?: string;
}

const EMPTY: VariantInput = { sku: "", size: "", color: "", stock: 0 };

export function VariantManager({ variants, dispatch, error }: VariantManagerProps) {
  const [adding, setAdding] = React.useState(false);
  const [draft, setDraft] = React.useState<VariantInput>(EMPTY);
  const [draftError, setDraftError] = React.useState<string>("");
  // confirm removal of a variant with stock > 0
  const [confirmIndex, setConfirmIndex] = React.useState<number | null>(null);

  function handleAddSubmit() {
    if (!draft.sku || !draft.size || !draft.color) {
      setDraftError("SKU, size, and color are required.");
      return;
    }
    if (!Number.isInteger(draft.stock) || draft.stock < 0) {
      setDraftError("Stock must be a non-negative integer.");
      return;
    }
    dispatch({ type: "ADD_VARIANT", payload: draft });
    setDraft(EMPTY);
    setDraftError("");
    setAdding(false);
  }

  function handleRemove(index: number) {
    if (variants[index].stock > 0) {
      setConfirmIndex(index);
    } else {
      dispatch({ type: "REMOVE_VARIANT", index });
    }
  }

  function handleStockChange(index: number, raw: string) {
    const val = parseInt(raw, 10);
    if (!isNaN(val) && val >= 0) {
      dispatch({ type: "UPDATE_VARIANT", index, payload: { stock: val } });
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Variants</span>
        {!adding && (
          <Button type="button" variant="outline" size="sm" onClick={() => setAdding(true)}>
            Add variant
          </Button>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {variants.length > 0 && (
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {["Size", "Color", "SKU", "Stock", ""].map((h) => (
                  <th key={h} className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {variants.map((v, i) => (
                <tr key={i} className="hover:bg-muted/20">
                  <td className="px-3 py-2">
                    <input
                      className="w-20 rounded border border-border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      value={v.size}
                      onChange={(e) => dispatch({ type: "UPDATE_VARIANT", index: i, payload: { size: e.target.value } })}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      className="w-24 rounded border border-border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      value={v.color}
                      onChange={(e) => dispatch({ type: "UPDATE_VARIANT", index: i, payload: { color: e.target.value } })}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      className="w-28 rounded border border-border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      value={v.sku}
                      onChange={(e) => dispatch({ type: "UPDATE_VARIANT", index: i, payload: { sku: e.target.value } })}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      className="w-20 rounded border border-border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      value={v.stock}
                      onChange={(e) => handleStockChange(i, e.target.value)}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Button type="button" variant="ghost" size="icon-sm" onClick={() => handleRemove(i)}>
                      ✕
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {adding && (
        <div className="rounded-md border border-border bg-muted/20 p-3 space-y-3">
          <p className="text-sm font-medium">New variant</p>
          {draftError && <p className="text-sm text-destructive">{draftError}</p>}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(["size", "color", "sku"] as const).map((field) => (
              <div key={field} className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground capitalize">{field}</label>
                <input
                  className="rounded border border-border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  value={draft[field]}
                  onChange={(e) => setDraft((d) => ({ ...d, [field]: e.target.value }))}
                />
              </div>
            ))}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Stock</label>
              <input
                type="number"
                min="0"
                step="1"
                className="rounded border border-border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                value={draft.stock}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setDraft((d) => ({ ...d, stock: isNaN(val) ? 0 : Math.max(0, val) }));
                }}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={handleAddSubmit}>Add</Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => { setAdding(false); setDraft(EMPTY); setDraftError(""); }}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmIndex !== null}
        onOpenChange={(open) => { if (!open) setConfirmIndex(null); }}
        title="Remove variant?"
        description={`This variant has ${confirmIndex !== null ? variants[confirmIndex]?.stock : 0} unit(s) in stock. Remove anyway?`}
        destructive
        onConfirm={() => {
          if (confirmIndex !== null) {
            dispatch({ type: "REMOVE_VARIANT", index: confirmIndex });
            setConfirmIndex(null);
          }
        }}
      />
    </div>
  );
}
