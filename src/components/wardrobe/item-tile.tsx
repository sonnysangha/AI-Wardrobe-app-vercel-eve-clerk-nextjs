"use client";

import { Coins, Copy } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useRef } from "react";
import { ItemImage } from "@/components/common/item-image";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import type { Item } from "@/hooks/use-items";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import type { Id } from "@convex/_generated/dataModel";
import { CATEGORY_LABELS } from "@convex/shared/wardrobe";

const LONG_PRESS_MS = 450;

type ItemTileProps = {
  item: Item;
  selected: boolean;
  selectionMode: boolean;
  onToggleSelect: (itemId: Id<"items">) => void;
};

/** A garment in the grid. Opens the item, or toggles selection once selection mode is on. */
export function ItemTile({ item, selected, selectionMode, onToggleSelect }: ItemTileProps) {
  const reduceMotion = useReducedMotion();
  const longPress = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFired = useRef(false);

  function startLongPress() {
    cancelLongPress();
    longPressFired.current = false;
    longPress.current = setTimeout(() => {
      longPressFired.current = true;
      onToggleSelect(item._id);
    }, LONG_PRESS_MS);
  }

  function cancelLongPress() {
    if (longPress.current === null) return;
    clearTimeout(longPress.current);
    longPress.current = null;
  }

  return (
    <motion.li
      layout={!reduceMotion}
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      exit={reduceMotion ? undefined : { opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.2 }}
      className="group relative"
    >
      <Link
        href={routes.item(item._id)}
        onClick={(event) => {
          // A long press already toggled selection; don't navigate on the click that follows it.
          if (longPressFired.current) {
            longPressFired.current = false;
            event.preventDefault();
            return;
          }
          if (!selectionMode) return;
          event.preventDefault();
          onToggleSelect(item._id);
        }}
        onPointerDown={startLongPress}
        onPointerUp={cancelLongPress}
        onPointerLeave={cancelLongPress}
        onPointerCancel={cancelLongPress}
        className={cn(
          "block space-y-3 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          selected && "ring-2 ring-primary",
        )}
        aria-label={item.name}
      >
        <div className="relative">
          <ItemImage
            src={item.url}
            alt={item.name}
            aspect="aspect-square"
            className="rounded-lg bg-muted/70 p-6 transition-colors group-hover:bg-muted sm:p-9 dark:bg-muted/30 dark:group-hover:bg-muted/50"
            imgClassName="transition-transform duration-200 motion-safe:group-hover:scale-[1.035]"
          />
          {item.status === "needsCredits" ? (
            <Badge variant="outline" className="absolute right-2 bottom-2 bg-background/90 backdrop-blur">
              <Coins className="text-credit" aria-hidden />
              Needs credits
            </Badge>
          ) : null}
        </div>
        <div className="space-y-1.5 px-1">
          <p className="line-clamp-2 text-sm leading-snug font-medium tracking-[-0.02em]">{item.name}</p>
          <div className="flex items-center justify-between gap-2">
            <p className="truncate font-mono text-[9px] tracking-[0.1em] text-muted-foreground uppercase">
              {CATEGORY_LABELS[item.category]}
            </p>
            <div className="flex shrink-0 items-center -space-x-1" aria-label={`Colour: ${item.colours.primary}`}>
              {item.colours.hex.slice(0, 3).map((hex, index) => (
                <span
                  key={`${hex}-${index}`}
                  className="size-3 rounded-full border border-background ring-1 ring-border"
                  style={{ backgroundColor: hex }}
                />
              ))}
            </div>
          </div>
          {item.wearCount === 0 ? (
            <Badge variant="outline" className="mt-1 text-muted-foreground">
              Not worn yet
            </Badge>
          ) : null}
          {item.duplicateOfId ? (
            <Badge variant="outline" className="mt-1">
              <Copy aria-hidden />
              Possible duplicate
            </Badge>
          ) : null}
        </div>
      </Link>

      <label
        className={cn(
          "absolute top-2 right-2 z-10 flex size-11 cursor-pointer items-center justify-center rounded-full bg-background/90 shadow-sm backdrop-blur transition-opacity pointer-coarse:opacity-100",
          selected || selectionMode
            ? "opacity-100"
            : "opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 focus-within:opacity-100",
        )}
      >
        <Checkbox
          className="after:inset-0"
          checked={selected}
          onCheckedChange={() => onToggleSelect(item._id)}
          aria-label={selected ? `Deselect ${item.name}` : `Select ${item.name}`}
        />
      </label>
    </motion.li>
  );
}
