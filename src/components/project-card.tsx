import { Link } from "@tanstack/react-router";
import { ArrowUpRightIcon } from "lucide-react";

import { Badge } from "#/components/ui/badge";
import { Card, CardContent, CardHeader } from "#/components/ui/card";
import type { ExperienceProject } from "#/data/data-module";
import { usePointerTilt } from "#/use-pointer-tilt";

export function ProjectCard({
  project,
  onOpen,
}: {
  project: ExperienceProject;
  onOpen?: (element: HTMLAnchorElement) => void;
}) {
  const pointer = usePointerTilt<HTMLAnchorElement>({ maxTilt: 5 });

  return (
    <Link
      {...pointer}
      aria-label={`Open ${project.name}`}
      className="group/project flex h-full w-full rounded-2xl perspective-[1100px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
      data-project-link={project.id}
      onClick={(event) => onOpen?.(event.currentTarget)}
      resetScroll={false}
      search={(previous) => ({
        ...previous,
        project: project.id,
        part: undefined,
      })}
      to="/"
    >
      <Card className="relative h-full w-full gap-0 rounded-2xl bg-card/80 py-0 text-sm ring-white/8 transition-[transform,box-shadow] duration-300 ease-out transform-[rotateX(var(--rx,0deg))_rotateY(var(--ry,0deg))] group-hover/project:shadow-[0_30px_60px_-25px_color-mix(in_oklab,var(--electric-cyan)_35%,transparent)] group-hover/project:ring-white/20 motion-reduce:transform-none">
        <div className="relative aspect-16/10 overflow-hidden border-b border-white/6 bg-[radial-gradient(ellipse_at_50%_120%,color-mix(in_oklab,var(--electric-violet)_30%,transparent),transparent_70%),linear-gradient(to_bottom,var(--secondary),var(--card))]">
          {project.thumbnail ? (
            <img
              alt={project.thumbnail.alt}
              className="size-full object-cover object-top transition-transform duration-700 ease-out group-hover/project:scale-[1.04] data-[orientation=portrait]:object-contain data-[orientation=portrait]:pt-5 data-[orientation=portrait]:drop-shadow-[0_12px_24px_rgb(0_0_0/0.5)] motion-reduce:transition-none"
              decoding="async"
              loading="lazy"
              onLoad={(event) => {
                const image = event.currentTarget;
                image.dataset.orientation =
                  image.naturalHeight > image.naturalWidth
                    ? "portrait"
                    : "landscape";
              }}
              src={project.thumbnail.cardSrc ?? project.thumbnail.src}
            />
          ) : (
            <div
              aria-label={`Placeholder image for ${project.name}`}
              className="flex size-full flex-col items-center justify-center gap-2 px-4 text-center"
              role="img"
            >
              <span className="font-mono text-[11px] tracking-[0.25em] text-muted-foreground uppercase">
                Placeholder
              </span>
              <span className="text-base font-medium">{project.name}</span>
            </div>
          )}
          <span
            aria-hidden="true"
            className="absolute top-3 right-3 flex h-8 items-center gap-1.5 rounded-full bg-background/80 pr-2.5 pl-3 text-xs font-medium text-foreground opacity-0 -translate-y-1 ring-1 ring-white/10 backdrop-blur-md transition-[opacity,translate] duration-300 group-hover/project:translate-y-0 group-hover/project:opacity-100 group-focus-visible/project:translate-y-0 group-focus-visible/project:opacity-100 motion-reduce:translate-y-0"
          >
            View
            <ArrowUpRightIcon className="size-3.5" />
          </span>
        </div>
        <CardHeader className="gap-1 px-5 pt-5">
          <h4 className="text-base font-semibold tracking-tight text-foreground transition-colors group-hover/project:text-primary">
            {project.name}
          </h4>
          {project.clientName ? (
            <p className="text-xs text-muted-foreground">
              Client: {project.clientName}
            </p>
          ) : null}
        </CardHeader>
        <CardContent className="flex flex-1 flex-col gap-4 px-5 pt-3 pb-5">
          <p className="line-clamp-3 leading-relaxed text-muted-foreground">
            {project.summary}
          </p>
          <ul
            aria-label={`Skills used in ${project.name}`}
            className="mt-auto flex flex-wrap gap-1.5 pt-1"
          >
            {project.skills.map((skill) => (
              <li key={skill}>
                <Badge
                  className="rounded-md bg-white/6 font-mono text-[0.6875rem] font-normal text-foreground/75"
                  variant="secondary"
                >
                  {skill}
                </Badge>
              </li>
            ))}
          </ul>
        </CardContent>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[inherit] bg-[radial-gradient(32rem_circle_at_var(--mx,50%)_var(--my,0%),rgb(255_255_255/0.07),transparent_45%)] opacity-0 transition-opacity duration-300 group-hover/project:opacity-100"
        />
      </Card>
    </Link>
  );
}
