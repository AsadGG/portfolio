import { cn } from "cn";
import type { CSSProperties } from "react";

import { SectionHeading } from "#/components/section-heading";
import { SectionReveal } from "#/components/section-reveal";
import { SectionState } from "#/components/section-state";
import { SpotlightCard } from "#/components/spotlight-card";
import { Card } from "#/components/ui/card";
import { Skeleton } from "#/components/ui/skeleton";
import { useHighlights } from "#/data/highlights-view";
import { revealClassName, revealOnView } from "#/reveal-on-view";

// Bento rhythm: every five Highlights form one wide row of two and one of three.
function bentoSpan(index: number) {
  return index % 5 < 2 ? "md:col-span-3" : "md:col-span-2";
}

export function HighlightsSection() {
  const highlights = useHighlights();

  return (
    <SectionReveal
      className="py-20 sm:py-28"
      data-section="highlights"
      id="highlights"
    >
      <SectionState skeleton={<HighlightsSkeleton />} state={highlights}>
        {(data) => (
          <section aria-labelledby="highlights-heading" className="space-y-12">
            <SectionHeading
              id="highlights-heading"
              index="02"
              lead="Recurring themes across the work below."
            >
              Highlights
            </SectionHeading>
            <ul className="grid grid-cols-1 gap-4 md:grid-cols-6">
              {data.map((highlight, index) => (
                <li
                  className={cn(revealClassName, bentoSpan(index))}
                  key={highlight.id}
                  ref={revealOnView}
                  style={{ "--reveal-index": index % 3 } as CSSProperties}
                >
                  <SpotlightCard className="h-full gap-5 p-7">
                    <span
                      aria-hidden="true"
                      className="grid size-10 place-items-center rounded-xl bg-linear-to-br from-primary/20 to-violet/20 font-mono text-xs text-primary ring-1 ring-white/10"
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="space-y-2.5">
                      <h3 className="text-lg font-semibold tracking-tight">
                        {highlight.title}
                      </h3>
                      <p className="text-[0.9375rem] leading-relaxed text-pretty text-muted-foreground">
                        {highlight.text}
                      </p>
                    </div>
                  </SpotlightCard>
                </li>
              ))}
            </ul>
          </section>
        )}
      </SectionState>
    </SectionReveal>
  );
}

function HighlightsSkeleton() {
  return (
    <section
      aria-label="Loading Highlights"
      aria-busy="true"
      className="space-y-12"
    >
      <div className="space-y-4">
        <Skeleton aria-hidden="true" className="h-3 w-16 rounded-full" />
        <Skeleton aria-hidden="true" className="h-12 w-56 rounded-full" />
      </div>
      <ul className="grid grid-cols-1 gap-4 md:grid-cols-6">
        {["one", "two", "three", "four", "five"].map((key, index) => (
          <li className={bentoSpan(index)} key={key}>
            <Card className="h-full gap-5 rounded-2xl bg-card/70 p-7">
              <Skeleton aria-hidden="true" className="size-10 rounded-xl" />
              <Skeleton aria-hidden="true" className="h-5 w-3/4 rounded-full" />
              <div className="space-y-2">
                <Skeleton
                  aria-hidden="true"
                  className="h-4 w-full rounded-full"
                />
                <Skeleton
                  aria-hidden="true"
                  className="h-4 w-4/5 rounded-full"
                />
              </div>
            </Card>
          </li>
        ))}
      </ul>
      <span className="sr-only">Loading Highlights</span>
    </section>
  );
}
