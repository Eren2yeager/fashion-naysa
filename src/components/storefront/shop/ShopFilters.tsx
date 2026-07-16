"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const TAGS = [
  "New Arrivals",
  "Dresses",
  "Tailoring",
  "Knitwear",
  "Resort Ease",
  "Workday Form",
  "Evening Line",
  "Soft Structure",
];

const SORT_OPTIONS = [
  { value: "", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
] as const;

export default function ShopFilters() {
  const router = useRouter();
  const sp = useSearchParams();

  const activeTag = sp.get("tag") ?? "";
  const activeSort = sp.get("sort") ?? "";

  // Local state only for the debounce buffer; URL is the source of truth.
  const [search, setSearch] = useState(sp.get("q") ?? "");

  // Reflect external URL changes (e.g. browser back/forward) in the input.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSearch(sp.get("q") ?? "");
  }, [sp]);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const push = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(sp.toString());
      for (const [k, v] of Object.entries(updates)) {
        if (v) params.set(k, v);
        else params.delete(k);
      }
      // Reset to page 1 whenever filters change
      params.delete("page");
      router.push(`/shop?${params.toString()}`);
    },
    [router, sp],
  );

  function handleSearch(value: string) {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => push({ q: value }), 300);
  }

  function handleTag(tag: string) {
    push({ tag: activeTag === tag ? "" : tag });
  }

  function handleSort(value: string) {
    push({ sort: value });
  }

  function handleClear() {
    setSearch("");
    router.push("/shop");
  }

  const hasFilters = activeTag || search || activeSort;

  return (
    <div className="flex flex-col gap-4">
      {/* Search + Sort row */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search products…"
          aria-label="Search products"
          className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring sm:max-w-xs"
        />

        <div className="flex items-center gap-2">
          <select
            value={activeSort}
            onChange={(e) => handleSort(e.target.value)}
            aria-label="Sort products"
            className="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={handleClear}>
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Tag pills */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by tag">
        {TAGS.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => handleTag(tag)}
            aria-pressed={activeTag === tag}
          >
            <Badge
              variant={activeTag === tag ? "default" : "outline"}
              className="cursor-pointer select-none"
            >
              {tag}
            </Badge>
          </button>
        ))}
      </div>
    </div>
  );
}
