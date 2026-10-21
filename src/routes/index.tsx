import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useRef } from "react";
import { z } from "zod";

import { ActiveSectionTracker } from "#/components/active-section-tracker";
import { EducationSection } from "#/components/education-section";
import { ExperienceSection } from "#/components/experience-section";
import { Footer } from "#/components/footer";
import { HighlightsSection } from "#/components/highlights-section";
import { IntroSection } from "#/components/intro-section";
import { ProfileHero, ProfileHeroSkeleton } from "#/components/profile-hero";
import { SectionState } from "#/components/section-state";
import { SkillsSection } from "#/components/skills-section";
import { StickyHeader } from "#/components/sticky-header";
import { useProfile } from "#/data/profile-view";

const ProjectDialog = lazy(() =>
  import("#/components/project-dialog").then((module) => ({
    default: module.ProjectDialog,
  })),
);

export const Route = createFileRoute("/")({
  validateSearch: z.object({
    project: z.string().optional(),
    part: z.string().optional(),
  }),
  component: Home,
});

function Home() {
  const profile = useProfile();
  const { part, project } = Route.useSearch();
  const navigate = useNavigate({ from: "/" });
  const returnFocus = useRef<HTMLAnchorElement | null>(null);

  const closeProject = () => {
    void navigate({
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
      <main className="mx-auto w-[min(1200px,calc(100%-2.5rem))]">
        <SectionState skeleton={<ProfileHeroSkeleton />} state={profile}>
          {(data) => <ProfileHero profile={data} />}
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
      {project && (
        <Suspense fallback={null}>
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
        </Suspense>
      )}
    </>
  );
}
