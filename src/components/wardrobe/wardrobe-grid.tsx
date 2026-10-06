"use client";

import { useMutation } from "convex/react";
import { AnimatePresence } from "motion/react";
import { ArrowUpRight, Plus, Search, Shirt } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useStylistPanel } from "@/components/stylist/stylist-provider";
import { createStylistSelectionContext } from "@/lib/stylist-context";
import { ImportQueue } from "@/components/upload/import-queue";
import { EmptyState } from "@/components/common/empty-state";
import { LoadingGrid } from "@/components/common/loading-grid";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useActiveJobs } from "@/hooks/use-active-jobs";
import { colourOptions, useSetItemStatus, useWardrobe, type Item } from "@/hooks/use-items";
import { reportError } from "@/lib/errors";
import { pluralize } from "@/lib/format";
import { routes } from "@/lib/routes";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import type { Category } from "@convex/shared/wardrobe";
import { ItemTile } from "./item-tile";
import { SeedDemoWardrobe } from "./seed-demo-wardrobe";
import { SelectionBar } from "./selection-bar";
import { activeFilterCount, DEFAULT_FILTERS, WardrobeToolbar, type WardrobeFilters } from "./wardrobe-toolbar";

function sortItems(items: readonly Item[], sort: WardrobeFilters["sort"]): Item[] {
  const sorted = [...items];
  if (sort === "most-worn") return sorted.sort((a, b) => b.wearCount - a.wearCount || b.createdAt - a.createdAt);
  if (sort === "never-worn") return sorted.sort((a, b) => a.wearCount - b.wearCount || b.createdAt - a.createdAt);
  return sorted.sort((a, b) => b.createdAt - a.createdAt);
}

export function WardrobeGrid() {
  const { setContextOverride } = useStylistPanel();
  const [filters, setFilters] = useState<WardrobeFilters>(DEFAULT_FILTERS);
  const [selected, setSelected] = useState<ReadonlySet<Id<"items">>>(new Set());
  const [pending, setPending] = useState(false);

  const { items, isPending } = useWardrobe({
    query: filters.query,
    status: filters.showHidden ? "hidden" : undefined,
    category: filters.category === "all" ? undefined : filters.category,
  });

  const setStatus = useSetItemStatus();
  const setCategory = useMutation(api.items.setCategory);
  const removeItems = useMutation(api.items.remove);
  const { jobs } = useActiveJobs();
  const ingesting = jobs?.some((job) => job.type === "ingest") ?? false;

  const colours = useMemo(() => colourOptions(items ?? []), [items]);

  const visible = useMemo(() => {
    if (!items) return undefined;
    const filtered = items.filter((item) => {
      if (filters.colours.length > 0 && !filters.colours.includes(item.colours.primary)) return false;
      if (filters.seasons.length > 0 && !filters.seasons.some((season) => item.season.includes(season))) return false;
      if (filters.formality.length > 0 && !filters.formality.includes(item.formality)) return false;
      if (filters.neverWorn && item.wearCount > 0) return false;
      return true;
    });
    return sortItems(filtered, filters.sort);
  }, [filters.colours, filters.formality, filters.seasons, filters.sort, items]);

  const selectedContext = useMemo(
    () => createStylistSelectionContext((items ?? []).filter((item) => selected.has(item._id))),
    [items, selected],
  );
  useEffect(() => {
    setContextOverride(selectedContext);
    return () => setContextOverride(null);
  }, [selectedContext, setContextOverride]);

  const selectedIds = useMemo(() => [...selected], [selected]);
  const selectionMode = selected.size > 0;

  function patchFilters(patch: Partial<WardrobeFilters>) {
    setFilters((current) => ({ ...current, ...patch }));
    setSelected(new Set());
  }

  function toggleSelect(itemId: Id<"items">) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  }

  async function runBulk(action: () => Promise<unknown>, success: string) {
    setPending(true);
    try {
      await action();
      toast.success(success);
      setSelected(new Set());
    } catch (error) {
      reportError(error);
    } finally {
      setPending(false);
    }
  }

  const hasFilters =
    activeFilterCount(filters) > 0 || filters.query.trim().length > 0 || filters.category !== "all" || filters.neverWorn;

  return (
    <div className="@container space-y-7">
      <PageHeader
        eyebrow="The personal collection"
        title="Your wardrobe."
        description="The pieces you love. The looks you haven’t tried yet."
        actions={
          <div className="flex flex-wrap gap-2">
            <SeedDemoWardrobe
              onSeeded={() => {
                setFilters(DEFAULT_FILTERS);
                setSelected(new Set());
              }}
            />
            <Button className="h-11 rounded-full px-5" nativeButton={false} render={<Link href={routes.add} />}>
              <Plus data-icon="inline-start" />
              Add clothes
            </Button>
          </div>
        }
      />

      <ImportQueue />

      {ingesting ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-sm dark:bg-muted/20">
          <Spinner className="size-4" aria-hidden />
          <span>New clothes are being processed.</span>
          <Link href={routes.add} className="font-medium underline underline-offset-4">
            Watch progress
          </Link>
        </div>
      ) : null}

      <WardrobeToolbar filters={filters} onChange={patchFilters} colours={colours} searching={isPending} />

      {visible !== undefined && !isPending ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
          <h2 className="flex items-baseline gap-2 text-xs font-medium">
            {filters.showHidden ? "Hidden clothes" : hasFilters ? "Matching clothes" : "All clothes"}
            <span className="font-mono text-[10px] font-normal text-muted-foreground tabular-nums">
              {pluralize(visible.length, "item")}
            </span>
          </h2>
          {!filters.showHidden && visible.length > 0 ? (
            <Link
              href={routes.newOutfit}
              className="inline-flex items-center gap-1.5 rounded-full text-xs font-medium underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4"
            >
              Create an outfit <ArrowUpRight className="size-4" aria-hidden />
            </Link>
          ) : null}
        </div>
      ) : null}

      {visible === undefined || isPending ? (
        <LoadingGrid count={8} aspect="aspect-square" className="gap-x-5 gap-y-8 xl:grid-cols-4" />
      ) : visible.length === 0 ? (
        hasFilters ? (
          <EmptyState
            icon={Search}
            title="Nothing matches"
            description="Try a different search, or clear the filters to see everything again."
            action={
              <Button
                variant="outline"
                onClick={() => setFilters({ ...DEFAULT_FILTERS, showHidden: filters.showHidden })}
              >
                Clear filters
              </Button>
            }
          />
        ) : filters.showHidden ? (
          <EmptyState icon={Shirt} title="Nothing hidden" description="Items you hide from the grid show up here." />
        ) : (
          <EmptyState
            icon={Shirt}
            title="Your wardrobe is empty"
            description="Photograph what you own and every garment gets cut out, tagged and filed here."
            action={
              <Button nativeButton={false} render={<Link href={routes.add} />}>
                <Plus data-icon="inline-start" />
                Add clothes
              </Button>
            }
          />
        )
      ) : (
        <ul className="grid grid-cols-2 gap-x-3 gap-y-7 @xl:grid-cols-3 @xl:gap-x-5 @4xl:grid-cols-4 @4xl:gap-y-9">
          <AnimatePresence initial={false}>
            {visible.map((item) => (
              <ItemTile
                key={item._id}
                item={item}
                selected={selected.has(item._id)}
                selectionMode={selectionMode}
                onToggleSelect={toggleSelect}
              />
            ))}
          </AnimatePresence>
        </ul>
      )}

      {selectionMode ? (
        <SelectionBar
          count={selected.size}
          allHidden={filters.showHidden}
          pending={pending}
          onClear={() => setSelected(new Set())}
          onSetStatus={(status) =>
            void runBulk(
              () => setStatus({ itemIds: selectedIds, status }),
              status === "hidden" ? "Items hidden." : "Items are back in the grid.",
            )
          }
          onSetCategory={(category: Category) =>
            void runBulk(() => setCategory({ itemIds: selectedIds, category }), "Category updated.")
          }
          onDelete={async () => {
            await removeItems({ itemIds: selectedIds });
            toast.success(`${pluralize(selectedIds.length, "item")} deleted.`);
            setSelected(new Set());
          }}
        />
      ) : null}
    </div>
  );
}
