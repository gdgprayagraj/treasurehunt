import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Renders riddle text so that code reads like code, not a wall of prose.
 * Supports a light, dependency-free subset of Markdown:
 *   - Fenced code blocks:  ```lang \n ... \n ```   → styled <pre><code> block
 *   - Inline code:         `like this`             → styled <code>
 *   - Everything else keeps its line breaks (whitespace-pre-wrap).
 *
 * It's a pure render (no hooks), so it works in both server and client components.
 */

type Segment =
  | { type: "code"; content: string }
  | { type: "text"; content: string };

function parseSegments(text: string): Segment[] {
  const segments: Segment[] = [];
  // ```optional-lang\n  ...code...  ```
  const fence = /```[^\n`]*\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = fence.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: "text", content: text.slice(lastIndex, match.index) });
    }
    segments.push({ type: "code", content: match[1].replace(/\n$/, "") });
    lastIndex = fence.lastIndex;
  }
  if (lastIndex < text.length) {
    segments.push({ type: "text", content: text.slice(lastIndex) });
  }
  return segments;
}

/** Split a text run on inline `code` spans and render each part. */
function renderInline(text: string, keyBase: string): React.ReactNode[] {
  return text.split(/(`[^`]+`)/g).map((part, i) => {
    if (part.length > 1 && part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={`${keyBase}-${i}`}
          className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em] font-normal text-google-blue"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return <React.Fragment key={`${keyBase}-${i}`}>{part}</React.Fragment>;
  });
}

export function RiddleContent({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const segments = parseSegments(text ?? "");

  return (
    <div className={cn("space-y-4 leading-relaxed", className)}>
      {segments.map((seg, i) => {
        if (seg.type === "code") {
          return (
            <pre
              key={i}
              className="overflow-x-auto rounded-lg border bg-muted/60 p-4 text-left text-sm font-normal"
            >
              <code className="font-mono">{seg.content}</code>
            </pre>
          );
        }
        // Skip blank text runs left between/around code fences.
        if (seg.content.trim() === "") return null;
        return (
          <p key={i} className="whitespace-pre-wrap">
            {renderInline(seg.content, String(i))}
          </p>
        );
      })}
    </div>
  );
}
