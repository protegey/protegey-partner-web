import type { ReactNode } from "react";

/** Comments, string literals, and `.methodCalls(` get a touch of color; everything else stays
 * plain on a solid black background — always dark, independent of the page's own theme, the way
 * a code editor reads. Matches on a single alternation so a string's own contents never get
 * re-matched by the method-call pattern. */
const TOKEN_RE = /(\/\/[^\n]*)|('(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*")|(\.[a-zA-Z_$][\w$]*(?=\())/g;

function highlightCode(code: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;
  let match: RegExpExecArray | null;

  TOKEN_RE.lastIndex = 0;
  while ((match = TOKEN_RE.exec(code)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(code.slice(lastIndex, match.index));
    }
    const [full, comment, str, method] = match;
    if (comment) {
      nodes.push(
        <span key={key++} className="text-neutral-500">
          {comment}
        </span>,
      );
    } else if (str) {
      nodes.push(
        <span key={key++} className="text-emerald-400">
          {str}
        </span>,
      );
    } else if (method) {
      nodes.push(
        <span key={key++} className="text-sky-400">
          {method}
        </span>,
      );
    }
    lastIndex = match.index + full.length;
  }
  if (lastIndex < code.length) nodes.push(code.slice(lastIndex));
  return nodes;
}

export function CodeBlock({ code, className = "" }: { code: string; className?: string }) {
  return (
    <pre className={`overflow-x-auto rounded-md bg-black p-3 text-xs text-neutral-200 ${className}`}>
      <code>{highlightCode(code)}</code>
    </pre>
  );
}
