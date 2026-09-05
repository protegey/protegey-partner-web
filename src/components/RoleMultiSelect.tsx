"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

export interface SelectableRole {
  id: string;
  name: string;
  displayName: string;
}

/** A multi-select dropdown for role assignment — renders hidden inputs so a plain <form> still picks up `roleIds` via FormData. */
export function RoleMultiSelect({
  roles,
  defaultSelectedNames = [],
  name = "roleIds",
}: {
  roles: SelectableRole[];
  defaultSelectedNames?: string[];
  name?: string;
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(roles.filter((r) => defaultSelectedNames.includes(r.name)).map((r) => r.id)),
  );
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  const selectedLabels = roles.filter((r) => selected.has(r.id)).map((r) => r.displayName);

  return (
    <div ref={containerRef} className="relative">
      {[...selected].map((id) => (
        <input key={id} type="hidden" name={name} value={id} />
      ))}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
      >
        <span className={selectedLabels.length ? "text-foreground" : "text-muted-foreground"}>
          {selectedLabels.length ? selectedLabels.join(", ") : "Select roles"}
        </span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
      </button>
      {open ? (
        <div className="absolute z-10 mt-1 w-full rounded-md border border-border bg-card p-1.5 shadow-lg">
          {roles.map((role) => (
            <label
              key={role.id}
              className="flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-foreground hover:bg-muted"
            >
              <input
                type="checkbox"
                checked={selected.has(role.id)}
                onChange={() => toggle(role.id)}
                className="size-4 rounded border-border"
              />
              {role.displayName}
            </label>
          ))}
        </div>
      ) : null}
    </div>
  );
}
