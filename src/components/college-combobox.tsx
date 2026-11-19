"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  required?: boolean;
};

type Item = { kind: "option"; value: string } | { kind: "custom"; value: string };

/**
 * A text box with a list that opens on click.
 * - Clicking (or focusing) the box shows every college.
 * - Typing narrows the list to matching names.
 * - If the typed name isn't in the list, the last row lets the person use it as-is.
 * The list grows from the box at 97% size, never from zero (UI library item T03).
 */
export function CollegeCombobox({ id, value, onChange, options, placeholder, required }: Props) {
  const listId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  // While the person hasn't typed since opening, show the full list.
  const [query, setQuery] = useState<string | null>(null);
  const [active, setActive] = useState(0);

  const items: Item[] = useMemo(() => {
    const q = (query ?? "").trim().toLowerCase();
    const matches = q ? options.filter((o) => o.toLowerCase().includes(q)) : options;
    const list: Item[] = matches.map((o) => ({ kind: "option", value: o }));
    const typed = (query ?? "").trim();
    if (typed && !options.some((o) => o.toLowerCase() === typed.toLowerCase())) {
      list.push({ kind: "custom", value: typed });
    }
    return list;
  }, [options, query]);

  // Close when the person clicks anywhere outside the box and its list.
  useEffect(() => {
    if (!open) return;
    function onDown(e: PointerEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) close();
    }
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  // Keep the highlighted row visible while moving with the arrow keys.
  useEffect(() => {
    if (!open) return;
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  function openList() {
    if (open) return;
    setQuery(null);
    const idx = options.findIndex((o) => o === value);
    setActive(idx >= 0 ? idx : 0);
    setOpen(true);
  }

  function close() {
    setOpen(false);
    setQuery(null);
  }

  function choose(item: Item) {
    onChange(item.value);
    close();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) return openList();
      if (items.length === 0) return;
      const step = e.key === "ArrowDown" ? 1 : -1;
      setActive((a) => (a + step + items.length) % items.length);
    } else if (e.key === "Enter") {
      if (open && items[active]) {
        e.preventDefault();
        choose(items[active]);
      }
    } else if (e.key === "Escape") {
      if (open) {
        e.preventDefault();
        close();
      }
    } else if (e.key === "Tab") {
      close();
    }
  }

  return (
    <div ref={wrapRef} className="relative">
      <input
        ref={inputRef}
        id={id}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && items[active] ? `${listId}-${active}` : undefined}
        autoComplete="off"
        required={required}
        value={value}
        placeholder={placeholder}
        onClick={openList}
        onFocus={openList}
        onChange={(e) => {
          onChange(e.target.value);
          setQuery(e.target.value);
          setActive(0);
          if (!open) setOpen(true);
        }}
        onKeyDown={onKeyDown}
        className="flex h-10 w-full rounded-md border border-input bg-background py-2 pl-3 pr-10 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      />
      <button
        type="button"
        tabIndex={-1}
        aria-label={open ? "Close college list" : "Open college list"}
        onClick={() => {
          if (open) close();
          else {
            openList();
            inputRef.current?.focus();
          }
        }}
        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground"
      >
        <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.ul
            ref={listRef}
            id={listId}
            role="listbox"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1, transition: { duration: 0.16, ease: [0.2, 0, 0, 1] } }}
            exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.1, ease: [0.3, 0, 1, 1] } }}
            style={{ transformOrigin: "top center" }}
            className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-64 overflow-auto rounded-lg border bg-popover p-1 text-sm text-popover-foreground shadow-lg"
          >
            {items.length === 0 ? (
              <li className="px-3 py-2 text-muted-foreground">Start typing your college name.</li>
            ) : (
              items.map((item, i) => {
                const selected = item.kind === "option" && item.value === value;
                return (
                  <li
                    key={`${item.kind}-${item.value}`}
                    id={`${listId}-${i}`}
                    data-index={i}
                    role="option"
                    aria-selected={selected}
                    // Keep focus in the text box so the list doesn't close before the click lands.
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => choose(item)}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-md px-3 py-2",
                      i === active && "bg-muted",
                      item.kind === "custom" && "mt-1 border-t pt-2.5 text-google-blue",
                    )}
                  >
                    {item.kind === "custom" ? (
                      <>
                        <Plus className="h-4 w-4 shrink-0" />
                        <span className="truncate">
                          Use &ldquo;<span className="font-medium">{item.value}</span>&rdquo;
                        </span>
                      </>
                    ) : (
                      <>
                        <Check
                          className={cn("h-4 w-4 shrink-0", selected ? "opacity-100" : "opacity-0")}
                        />
                        <span className="truncate">{item.value}</span>
                      </>
                    )}
                  </li>
                );
              })
            )}
          </motion.ul>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
