import { ArrowRight, ArrowDown } from "lucide-react";

export interface FlowDiagramNode {
  label: string;
  note?: string;
  /** Highlights this node as "you are here" — the page the guide was opened from. */
  current?: boolean;
}

/** A simple left-to-right (top-to-bottom on small screens) pipeline diagram: each column can hold
 * one or several boxes (several = "these all feed the next column"), connected by arrows. Meant
 * for describing how one module's data flows to/from others — not a general diagramming tool. */
export function FlowDiagram({ stages }: { stages: FlowDiagramNode[][] }) {
  return (
    <div className="flex flex-col items-stretch gap-2 overflow-x-auto rounded-md border border-border bg-muted/20 p-4 sm:flex-row sm:items-center">
      {stages.map((column, columnIndex) => (
        <div key={columnIndex} className="flex flex-1 flex-col items-center gap-2 sm:flex-row">
          <div className="flex w-full flex-col justify-center gap-2">
            {column.map((node, nodeIndex) => (
              <div
                key={nodeIndex}
                className={`rounded-md border px-3 py-2 text-center text-xs shadow-sm ${
                  node.current ? "border-primary bg-primary/10 font-semibold text-primary" : "border-border bg-card text-foreground"
                }`}
              >
                <p>{node.label}</p>
                {node.note ? <p className="mt-0.5 text-[10px] font-normal text-muted-foreground">{node.note}</p> : null}
              </div>
            ))}
          </div>
          {columnIndex < stages.length - 1 ? (
            <>
              <ArrowDown className="size-4 shrink-0 text-muted-foreground sm:hidden" />
              <ArrowRight className="hidden size-4 shrink-0 text-muted-foreground sm:block" />
            </>
          ) : null}
        </div>
      ))}
    </div>
  );
}
