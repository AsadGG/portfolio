import { ContactLinks } from "#/components/contact-links";
import { Skeleton } from "#/components/ui/skeleton";
import type { Profile } from "#/data/data-module";

// Shorter than the viewport so the next section peeks in as a cue to scroll.
const heroClassName =
  "relative flex min-h-[calc(88svh-4rem)] flex-col items-start justify-center gap-8 py-24";

const enterClassName = "animate-rise motion-reduce:animate-none";

function splitName(name: string) {
  const lastSpace = name.lastIndexOf(" ");
  return lastSpace === -1
    ? { leading: "", last: name }
    : { leading: name.slice(0, lastSpace), last: name.slice(lastSpace + 1) };
}

export function ProfileHero({ profile }: { profile: Profile }) {
  const { leading, last } = splitName(profile.name);

  return (
    <section
      aria-labelledby="profile-name"
      className={heroClassName}
      data-section="hero"
      id="hero"
    >
      <HeroBackdrop />
      <p
        className={`${enterClassName} inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/3 py-1.5 pr-3.5 pl-3 font-mono text-xs text-muted-foreground`}
      >
        <span aria-hidden="true" className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/60 motion-reduce:animate-none" />
          <span className="relative inline-flex size-2 rounded-full bg-primary" />
        </span>
        {profile.location}
      </p>
      <h1
        className={`${enterClassName} text-[clamp(3.5rem,11vw,8.5rem)] leading-[0.88] font-semibold tracking-[-0.055em] [--rise-delay:75ms]`}
        id="profile-name"
      >
        {leading ? <span className="block">{leading}</span> : null}{" "}
        <span className="block bg-linear-to-r from-primary via-sky-300 to-violet bg-clip-text pb-[0.1em] text-transparent">
          {last}
        </span>
      </h1>
      <p
        className={`${enterClassName} max-w-xl text-lg leading-relaxed text-pretty text-muted-foreground [--rise-delay:150ms] sm:text-xl`}
      >
        {profile.headline}
      </p>
      <ContactLinks
        className={`${enterClassName} [--rise-delay:200ms]`}
        profile={profile}
      />
      <div
        aria-hidden="true"
        className="absolute bottom-10 left-0 hidden items-center gap-3 font-mono text-[11px] tracking-[0.3em] text-muted-foreground uppercase md:flex"
      >
        <span className="relative h-12 w-px overflow-hidden bg-white/10">
          <span className="absolute inset-0 animate-scroll-cue bg-linear-to-b from-primary to-violet motion-reduce:animate-none" />
        </span>
        Scroll
      </div>
    </section>
  );
}

export function ProfileHeroSkeleton() {
  return (
    <output
      aria-busy="true"
      aria-label="Loading Profile"
      className={heroClassName}
    >
      <Skeleton aria-hidden="true" className="h-7 w-44 rounded-full" />
      <div className="w-full space-y-3">
        <Skeleton
          aria-hidden="true"
          className="h-[clamp(3rem,9vw,7rem)] w-[min(30rem,80%)] rounded-3xl"
        />
        <Skeleton
          aria-hidden="true"
          className="h-[clamp(3rem,9vw,7rem)] w-[min(36rem,90%)] rounded-3xl"
        />
      </div>
      <Skeleton
        aria-hidden="true"
        className="h-6 w-[min(28rem,78%)] rounded-full"
      />
      <div className="flex flex-wrap gap-3">
        {["email", "phone", "github", "linkedin"].map((key) => (
          <Skeleton
            aria-hidden="true"
            className="h-11 w-32 rounded-full"
            key={key}
          />
        ))}
      </div>
      <span className="sr-only">Loading Profile</span>
    </output>
  );
}

/** A faint engineering grid that fades out from behind the name. */
function HeroBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-y-0 left-1/2 -z-10 w-screen -translate-x-1/2 bg-[linear-gradient(to_right,rgb(255_255_255/0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgb(255_255_255/0.035)_1px,transparent_1px)] bg-size-[72px_72px] mask-[radial-gradient(ellipse_70%_60%_at_25%_45%,black,transparent_75%)]"
    />
  );
}
