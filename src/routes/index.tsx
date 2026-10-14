import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { SectionState } from "../components/section-state";
import { useProfile } from "../data/profile-view";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const profile = useProfile();

  useEffect(() => {
    if (profile.status === "ready") {
      document.title = `${profile.data.name} — ${profile.data.headline}`;
    }
  }, [profile]);

  return (
    <main className="page-wrap">
      <SectionState skeleton={<ProfileSkeleton />} state={profile}>
        {(data) => (
          <section aria-labelledby="profile-name" className="profile-hero">
            <h1 id="profile-name">{data.name}</h1>
            <p>{data.headline}</p>
            <p>{data.location}</p>
            <nav aria-label="Contact links">
              <a href={`mailto:${data.email}`}>Email</a>
              <a href={`tel:${data.phone.replace(/[^\d+]/g, "")}`}>
                {data.phone}
              </a>
              <a href={data.github} rel="noopener noreferrer" target="_blank">
                GitHub
              </a>
              <a href={data.linkedin} rel="noopener noreferrer" target="_blank">
                LinkedIn
              </a>
            </nav>
          </section>
        )}
      </SectionState>
    </main>
  );
}

function ProfileSkeleton() {
  return (
    <output
      aria-busy="true"
      aria-label="Loading Profile"
      className="profile-hero profile-skeleton"
    >
      <span aria-hidden="true" className="skeleton-line skeleton-name" />
      <span aria-hidden="true" className="skeleton-line skeleton-headline" />
      <span aria-hidden="true" className="skeleton-line skeleton-location" />
      <span aria-hidden="true" className="skeleton-line skeleton-links" />
      <span className="visually-hidden">Loading Profile</span>
    </output>
  );
}
