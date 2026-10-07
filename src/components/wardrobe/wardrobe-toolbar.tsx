"use client";

import { Check, Search, Shirt, SlidersHorizontal, X } from "lucide-react";
import { useId } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { titleCase } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  FORMALITY,
  FORMALITY_LABELS,
  SEASONS,
  type Category,
  type Formality,
  type Season,
} from "@convex/shared/wardrobe";
import { MultiToggleGroup } from "./toggle-options";

export const SORT_OPTIONS = {
  newest: "Newest first",
  "most-worn": "Most worn",
  "never-worn": "Never worn first",
} as const;

export type SortKey = keyof typeof SORT_OPTIONS;

export type WardrobeFilters = {
  query: string;
  category: Category | "all";
  colours: string[];
  seasons: Season[];
  formality: Formality[];
  sort: SortKey;
  showHidden: boolean;
  neverWorn: boolean;
};

export const DEFAULT_FILTERS: WardrobeFilters = {
  query: "",
  category: "all",
  colours: [],
  seasons: [],
  formality: [],
  sort: "newest",
  showHidden: false,
  neverWorn: false,
};

export type ColourOption = { value: string; hex: string | null; count: number };

type WardrobeToolbarProps = {
  filters: WardrobeFilters;
  onChange: (patch: Partial<WardrobeFilters>) => void;
  colours: readonly ColourOption[];
  /** True while the typed query has not reached the server yet. */
  searching?: boolean;
  disabled?: boolean;
};

export function activeFilterCount(filters: WardrobeFilters): number {
  return filters.colours.length + filters.seasons.length + filters.formality.length + Number(filters.neverWorn);
}

export function WardrobeToolbar({
  filters,
  onChange,
  colours,
  searching = false,
  disabled = false,
}: WardrobeToolbarProps) {
  const searchId = useId();
  const hiddenId = useId();
  const count = activeFilterCount(filters);

  function toggleColour(value: string) {
    onChange({
      colours: filters.colours.includes(value)
        ? filters.colours.filter((entry) => entry !== value)
        : [...filters.colours, value],
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <InputGroup className="h-10 min-w-48 flex-1 rounded-none border-0 border-b border-border bg-transparent px-0 shadow-none ring-0 focus-within:border-foreground sm:max-w-sm">
          <InputGroupAddon>{searching ? <Spinner aria-label="Searching" /> : <Search aria-hidden />}</InputGroupAddon>
          <InputGroupInput
            id={searchId}
            type="search"
            value={filters.query}
            onChange={(event) => onChange({ query: event.target.value })}
            placeholder="Search your wardrobe"
            aria-label="Search your wardrobe"
            disabled={disabled}
          />
          {filters.query ? (
            <InputGroupAddon align="inline-end">
              <InputGroupButton size="icon-xs" onClick={() => onChange({ query: "" })} aria-label="Clear search">
                <X />
              </InputGroupButton>
            </InputGroupAddon>
          ) : null}
        </InputGroup>

        <Button
          variant="outline"
          aria-pressed={filters.neverWorn}
          onClick={() => onChange({ neverWorn: !filters.neverWorn })}
          className={cn(
            "h-10 rounded-full border-border bg-transparent px-4 shadow-none",
            filters.neverWorn &&
              "border-foreground bg-foreground text-background hover:bg-foreground/90 hover:text-background",
          )}
          disabled={disabled}
        >
          <Shirt data-icon="inline-start" />
          Never worn
        </Button>

        <Popover>
          <PopoverTrigger
            render={
              <Button
                variant="outline"
                className="h-10 rounded-full border-border bg-transparent px-4 shadow-none sm:ml-auto"
                disabled={disabled}
              />
            }
          >
            <SlidersHorizontal data-icon="inline-start" />
            Filters
            {count > 0 || filters.showHidden ? (
              <Badge className="ml-1 tabular-nums">{count + Number(filters.showHidden)}</Badge>
            ) : null}
          </PopoverTrigger>
          <PopoverContent
            align="end"
            className="max-h-[min(32rem,var(--available-height))] w-[min(20rem,calc(100vw-2rem))] gap-4 overflow-y-auto overscroll-contain p-4"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Filters</p>
              {count > 0 ? (
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => onChange({ colours: [], seasons: [], formality: [], neverWorn: false })}
                >
                  Clear all
                </Button>
              ) : null}
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Colour</p>
              {colours.length === 0 ? (
                <p className="text-sm text-muted-foreground">No colours yet.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {colours.map((colour) => {
                    const active = filters.colours.includes(colour.value);
                    return (
                      <button
                        key={colour.value}
                        type="button"
                        onClick={() => toggleColour(colour.value)}
                        aria-pressed={active}
                        className={cn(
                          "inline-flex h-7 items-center gap-1.5 rounded-full border px-2 text-xs transition-colors",
                          active ? "border-primary bg-primary/10 text-foreground" : "border-border hover:bg-muted",
                        )}
                      >
                        <span
                          className="size-3 shrink-0 rounded-full ring-1 ring-foreground/15"
                          style={{ backgroundColor: colour.hex ?? colour.value }}
                          aria-hidden
                        />
                        {titleCase(colour.value)}
                        {active ? <Check className="size-3" aria-hidden /> : null}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <Separator />

            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Season</p>
              <MultiToggleGroup
                options={SEASONS}
                value={filters.seasons}
                onValueChange={(seasons) => onChange({ seasons })}
                aria-label="Season"
              />
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Formality</p>
              <MultiToggleGroup
                options={FORMALITY}
                value={filters.formality}
                onValueChange={(formality) => onChange({ formality })}
                label={(option) => FORMALITY_LABELS[option]}
                aria-label="Formality"
              />
            </div>

            <Separator />
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor={hiddenId} className="text-sm text-muted-foreground">
                Show hidden clothes
              </Label>
              <Switch
                id={hiddenId}
                checked={filters.showHidden}
                onCheckedChange={(showHidden) => onChange({ showHidden })}
                disabled={disabled}
              />
            </div>
          </PopoverContent>
        </Popover>

        <Select
          value={filters.sort}
          onValueChange={(value) => {
            if (value) onChange({ sort: value });
          }}
        >
          <SelectTrigger
            className="h-10 w-40 rounded-full border-transparent bg-transparent shadow-none"
            aria-label="Sort"
            disabled={disabled}
          >
            <SelectValue>{(value: SortKey | null) => (value ? SORT_OPTIONS[value] : SORT_OPTIONS.newest)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(SORT_OPTIONS) as SortKey[]).map((key) => (
              <SelectItem key={key} value={key}>
                {SORT_OPTIONS[key]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="-mx-1 overflow-x-auto px-1 pb-1">
        <ToggleGroup
          value={[filters.category]}
          onValueChange={(next) => onChange({ category: (next.at(-1) as Category | "all" | undefined) ?? "all" })}
          size="default"
          disabled={disabled}
          aria-label="Category"
          className="gap-1.5 [&_[data-slot=toggle-group-item]]:h-9 [&_[data-slot=toggle-group-item]]:rounded-full [&_[data-slot=toggle-group-item]]:bg-transparent [&_[data-slot=toggle-group-item]]:px-4 [&_[data-slot=toggle-group-item]]:text-xs [&_[data-slot=toggle-group-item]]:font-normal [&_[data-slot=toggle-group-item]]:text-muted-foreground [&_[data-slot=toggle-group-item][data-pressed]]:bg-foreground [&_[data-slot=toggle-group-item][data-pressed]]:text-background"
        >
          <ToggleGroupItem value="all">All</ToggleGroupItem>
          {CATEGORIES.map((category) => (
            <ToggleGroupItem key={category} value={category}>
              {CATEGORY_LABELS[category]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
    </div>
  );
}
