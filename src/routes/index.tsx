import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { z } from "zod";
import { ActiveSectionTracker } from "../components/active-section-tracker";
import { ContactLinks } from "../components/contact-links";
import { EducationSection } from "../components/education-section";
import { ExperienceSection } from "../components/experience-section";
import { Footer } from "../components/footer";
import { HighlightsSection } from "../components/highlights-section";
import { IntroSection } from "../components/intro-section";
import { ProjectDialog } from "../components/project-dialog";
import { SectionState } from "../components/section-state";
import { SkillsSection } from "../components/skills-section";
import { StickyHeader } from "../components/sticky-header";
import { Skeleton } from "../components/ui/skeleton";
import { useProfile } from "../data/profile-view";

export const Route = createFileRoute("/")({
  validateSearch: z.object({
    project: z.string().optional(),
    part: z.string().optional(),
  }),
  component: Home,
});

const heroClassName =
  "flex min-h-[75vh] flex-col items-start justify-center gap-4 py-16";

function Home() {
  const profile = useProfile();
  const { part, project } = Route.useSearch();
  const navigate = useNavigate({ from: "/" });
  const returnFocus = useRef<HTMLAnchorElement | null>(null);

  const closeProject = () => {
    navigate({
      search: (previous) => ({
        ...previous,
        project: undefined,
        part: undefined,
      }),
      replace: true,
      resetScroll: false,
    });
  };

  useEffect(() => {
    if (profile.status === "ready") {
      document.title = `${profile.data.name} — ${profile.data.headline}`;
    }
  }, [profile]);

  return (
    <>
      <StickyHeader />
      <ActiveSectionTracker />
      <main className="mx-auto w-[min(1080px,calc(100%-2rem))]">
        <SectionState skeleton={<ProfileSkeleton />} state={profile}>
          {(data) => (
            <section
              aria-labelledby="profile-name"
              className={heroClassName}
              data-section="hero"
              id="hero"
            >
              <h1
                className="text-[clamp(3rem,10vw,6.5rem)] leading-[0.98] tracking-[-0.06em]"
                id="profile-name"
              >
                {data.name}
              </h1>
              <p className="text-[clamp(1rem,2.5vw,1.25rem)] text-muted-foreground">
                {data.headline}
              </p>
              <p className="text-[clamp(1rem,2.5vw,1.25rem)] text-muted-foreground">
                {data.location}
              </p>
              <ContactLinks
                className="mt-3 flex flex-wrap gap-x-6 gap-y-3"
                profile={data}
              />
            </section>
          )}
        </SectionState>
        <IntroSection />
        <HighlightsSection />
        <SkillsSection />
        <ExperienceSection
          onProjectOpen={(element) => {
            returnFocus.current = element;
          }}
        />
        <EducationSection />
      </main>
      <Footer />
      <ProjectDialog
        onClose={closeProject}
        onPartChange={(partId) =>
          navigate({
            search: (previous) => ({ ...previous, part: partId }),
            replace: true,
            resetScroll: false,
          })
        }
        partId={part}
        projectId={project}
        returnFocus={returnFocus}
      />
    </>
  );
}

function ProfileSkeleton() {
  return (
    <output
      aria-busy="true"
      aria-label="Loading Profile"
      className={heroClassName}
    >
      <Skeleton
        aria-hidden="true"
        className="h-[clamp(3rem,10vw,6.5rem)] w-[min(36rem,90%)] rounded-full"
      />
      <Skeleton
        aria-hidden="true"
        className="h-5 w-[min(28rem,78%)] rounded-full"
      />
      <Skeleton
        aria-hidden="true"
        className="h-5 w-[min(18rem,55%)] rounded-full"
      />
      <Skeleton
        aria-hidden="true"
        className="mt-3 h-8 w-[min(24rem,72%)] rounded-full"
      />
      <span className="sr-only">Loading Profile</span>
    </output>
  );
}
