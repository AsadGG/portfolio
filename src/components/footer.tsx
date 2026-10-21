import { ContactLinks } from "#/components/contact-links";
import { SectionState } from "#/components/section-state";
import { Skeleton } from "#/components/ui/skeleton";
import { useProfile } from "#/data/profile-view";

export function Footer() {
  const profile = useProfile();

  return (
    <footer className="mx-auto w-[min(1080px,calc(100%-2rem))] border-t border-border/70 py-8">
      <SectionState compact skeleton={<FooterSkeleton />} state={profile}>
        {(data) => (
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1">
              <p className="font-medium">{data.name}</p>
              <p className="text-sm text-muted-foreground">
                © {new Date().getFullYear()}
              </p>
            </div>
            <ContactLinks
              className="flex flex-wrap gap-x-6 gap-y-3"
              profile={data}
            />
          </div>
        )}
      </SectionState>
    </footer>
  );
}

function FooterSkeleton() {
  return (
    <output aria-busy="true" aria-label="Loading footer" className="py-3">
      <Skeleton aria-hidden="true" className="h-5 w-48 rounded-full" />
      <span className="sr-only">Loading footer</span>
    </output>
  );
}
