"use client";

import { useState } from "react";
import { ShieldCheck, Construction } from "lucide-react";
import { Drawer } from "@/components/Drawer";

export function ComplianceInfoButton({ businessName }: { businessName: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
      >
        <ShieldCheck className="size-4" />
        See compliance info
      </button>

      <Drawer open={open} onClose={() => setOpen(false)} title={`Compliance info — ${businessName}`}>
        <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
          <Construction className="size-10 text-muted-foreground" />
          <p className="text-lg font-semibold text-foreground">Coming soon</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Compliance and risk screening data for this business will appear here.
          </p>
        </div>
      </Drawer>
    </>
  );
}
