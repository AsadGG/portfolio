import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useProfile } from "../data/profile-view";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const profile = useProfile();

  useEffect(() => {
    if (profile) {
      document.title = `${profile.name} — ${profile.headline}`;
    }
  }, [profile]);

  if (!profile) return null;

  return (
    <main className="page-wrap">
      <section aria-labelledby="profile-name" className="profile-hero">
        <h1 id="profile-name">{profile.name}</h1>
        <p>{profile.headline}</p>
        <p>{profile.location}</p>
        <nav aria-label="Contact links">
          <a href={`mailto:${profile.email}`}>Email</a>
          <a href={`tel:${profile.phone.replace(/[^\d+]/g, "")}`}>
            {profile.phone}
          </a>
          <a href={profile.github} rel="noopener noreferrer" target="_blank">
            GitHub
          </a>
          <a href={profile.linkedin} rel="noopener noreferrer" target="_blank">
            LinkedIn
          </a>
        </nav>
      </section>
    </main>
  );
}
