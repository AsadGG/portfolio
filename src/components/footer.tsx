import { ArrowUpIcon } from "lucide-react";

import { ContactLinks } from "#/components/contact-links";
import { SectionState } from "#/components/section-state";
import { Button } from "#/components/ui/button";
import { Skeleton } from "#/components/ui/skeleton";
import { useProfile } from "#/data/profile-view";

const containerClassName = "mx-auto w-[min(1200px,calc(100%-2.5rem))]";

function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "instant"
      : "smooth",
  });
}

export function Footer() {
  const profile = useProfile();

  return (
    <footer className="relative mt-16 overflow-hidden border-t border-white/8 bg-linear-to-b from-transparent to-black/40">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[min(56rem,100%)] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--electric-violet)_22%,transparent),transparent)]"
      />
      <div className={`relative ${containerClassName} py-20`}>
        <SectionState compact skeleton={<FooterSkeleton />} state={profile}>
          {(data) => (
            <div className="space-y-16">
              <div className="space-y-6">
                <p className="font-mono text-xs tracking-[0.24em] text-primary uppercase">
                  Get in touch
                </p>
                <p className="max-w-3xl text-4xl font-semibold tracking-[-0.035em] text-balance sm:text-6xl">
                  Have a product to build?{" "}
                  <span className="text-muted-foreground">
                    Let’s talk it through.
                  </span>
                </p>
                <a
                  className="group/email inline-flex items-center gap-3 text-xl font-medium text-foreground decoration-primary/0 underline-offset-8 transition-[text-decoration-color,color] hover:text-foreground hover:underline hover:decoration-primary sm:text-2xl"
                  href={`mailto:${data.email}`}
                >
                  {data.email}
                </a>
              </div>
              <div className="flex flex-col gap-8 border-t border-white/8 pt-8 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <p className="font-medium">{data.name}</p>
                  <p className="font-mono text-xs text-muted-foreground">
                    © {new Date().getFullYear()}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-6">
                  <ContactLinks profile={data} variant="compact" />
                  <Button
                    aria-label="Back to top"
                    className="rounded-full border-white/10 bg-white/3 hover:-translate-y-0.5 hover:border-white/25"
                    onClick={scrollToTop}
                    size="icon-lg"
                    variant="outline"
                  >
                    <ArrowUpIcon aria-hidden="true" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </SectionState>
      </div>
    </footer>
  );
}

function FooterSkeleton() {
  return (
    <output aria-busy="true" aria-label="Loading footer" className="block py-3">
      <Skeleton
        aria-hidden="true"
        className="h-12 w-[min(36rem,90%)] rounded-full"
      />
      <Skeleton aria-hidden="true" className="mt-6 h-5 w-48 rounded-full" />
      <span className="sr-only">Loading footer</span>
    </output>
  );
}
