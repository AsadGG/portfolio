import type { Profile } from "#/data/data-module";

export function ContactLinks({
  profile,
  className,
}: {
  profile: Pick<Profile, "email" | "phone" | "github" | "linkedin">;
  className?: string;
}) {
  return (
    <nav aria-label="Contact links" className={className}>
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
  );
}
