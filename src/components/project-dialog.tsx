import { cn } from "cn";
import { ExternalLinkIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { type GalleryImage, ImageGallery } from "#/components/image-gallery";
import { Markdown } from "#/components/markdown";
import { Badge } from "#/components/ui/badge";
import { buttonVariants } from "#/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog";
import { Tabs, TabsList, TabsPanel, TabsTab } from "#/components/ui/tabs";
import type { ProjectDetail } from "#/data/data-module";
import { useDataModule } from "#/data/data-module-provider";

type DetailState =
  | { status: "loading"; projectId?: string }
  | { status: "not-found"; projectId: string }
  | { status: "error"; projectId: string; message: string }
  | { status: "ready"; projectId: string; data: ProjectDetail };

type ProjectImage = ProjectDetail["images"][number];

function toGalleryImages(images: ProjectImage[]): GalleryImage[] {
  return images.map(({ src, alt, caption }) => ({ url: src, alt, caption }));
}

function SkillList({ skills, label }: { skills: string[]; label: string }) {
  if (skills.length === 0) return null;

  return (
    <ul aria-label={label} className="flex flex-wrap gap-1.5">
      {skills.map((skill) => (
        <li key={skill}>
          <Badge
            className="h-6 rounded-md bg-white/6 px-2 font-mono text-[0.6875rem] font-normal text-foreground/80"
            variant="secondary"
          >
            {skill}
          </Badge>
        </li>
      ))}
    </ul>
  );
}

const metaChipClassName =
  "rounded-full border border-white/10 bg-white/3 px-3 py-1 text-xs text-muted-foreground";

const linkButtonClassName = cn(
  buttonVariants({ variant: "outline", size: "lg" }),
  "h-10 gap-2 rounded-full border-white/12 bg-white/3 px-4 text-sm text-foreground hover:border-white/25 hover:bg-white/8",
);

export function ProjectDialog({
  projectId,
  partId,
  onPartChange,
  onClose,
  returnFocus,
}: {
  projectId?: string;
  partId?: string;
  onPartChange: (partId: string) => void;
  onClose: () => void;
  returnFocus: { current: HTMLAnchorElement | null };
}) {
  const { getProjectDetail } = useDataModule();
  const [detail, setDetail] = useState<DetailState>({ status: "loading" });

  useEffect(() => {
    if (!projectId) return;
    let active = true;
    setDetail({ status: "loading", projectId });
    void getProjectDetail(projectId).then((result) => {
      if (!active) return;
      if (result.status === "ready") {
        setDetail({ ...result, projectId });
      } else if (result.status === "not-found") {
        setDetail({ status: "not-found", projectId });
      } else setDetail({ status: "error", projectId, message: result.message });
    });
    return () => {
      active = false;
    };
  }, [getProjectDetail, projectId]);

  const currentDetail =
    detail.projectId === projectId ? detail : { status: "loading" as const };
  const open = Boolean(projectId && currentDetail.status === "ready");
  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && projectId) onClose();
      }}
      onOpenChangeComplete={(nextOpen) => {
        // The card may be off-screen when the Project was opened from the
        // hero gallery, so restoring focus must not scroll the page to it.
        if (!nextOpen) returnFocus.current?.focus({ preventScroll: true });
      }}
    >
      <DialogContent
        aria-label={
          currentDetail.status === "ready" ? currentDetail.data.name : "Project"
        }
        className="max-h-[min(90vh,60rem)] overflow-y-auto rounded-3xl bg-popover/95 p-6 text-sm shadow-[0_40px_120px_-30px_rgb(0_0_0/0.8)] ring-white/10 backdrop-blur-xl sm:max-w-3xl sm:p-10"
      >
        {currentDetail.status === "ready" ? (
          <ProjectContents
            onPartChange={onPartChange}
            partId={partId}
            project={currentDetail.data}
          />
        ) : currentDetail.status === "error" ? (
          <p>{currentDetail.message}</p>
        ) : (
          <p aria-live="polite">Loading Project…</p>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ProjectContents({
  project,
  partId,
  onPartChange,
}: {
  project: ProjectDetail;
  partId?: string;
  onPartChange: (partId: string) => void;
}) {
  const selectedPart =
    project.parts.find(({ id }) => id === partId) ?? project.parts[0];

  return (
    <div className="space-y-8">
      <DialogHeader className="gap-4 pr-8">
        <DialogTitle className="text-3xl font-semibold tracking-[-0.03em] text-balance sm:text-4xl">
          {project.name}
        </DialogTitle>
        {project.clientName || project.role ? (
          <div className="flex flex-wrap gap-2">
            {project.clientName ? (
              <p className={metaChipClassName}>Client: {project.clientName}</p>
            ) : null}
            {project.role ? (
              <p className={metaChipClassName}>Role: {project.role}</p>
            ) : null}
          </div>
        ) : null}
        <DialogDescription className="text-base leading-relaxed text-pretty text-muted-foreground">
          {project.summary}
        </DialogDescription>
      </DialogHeader>
      <ImageGallery
        key={project.id}
        images={toGalleryImages(project.images)}
        label={project.name}
      />
      {project.description ? <Markdown>{project.description}</Markdown> : null}
      {project.links ? (
        <nav
          aria-label={`${project.name} links`}
          className="flex flex-wrap gap-3"
        >
          {project.links.live ? (
            <a
              className={linkButtonClassName}
              href={project.links.live}
              rel="noopener noreferrer"
              target="_blank"
            >
              Live site
              <ExternalLinkIcon aria-hidden="true" />
            </a>
          ) : null}
          {project.links.repository ? (
            <a
              className={linkButtonClassName}
              href={project.links.repository}
              rel="noopener noreferrer"
              target="_blank"
            >
              Repository
              <ExternalLinkIcon aria-hidden="true" />
            </a>
          ) : null}
        </nav>
      ) : null}
      <SkillList
        label={`Skills used in ${project.name}`}
        skills={project.skills}
      />
      {project.parts.length === 1 && selectedPart ? (
        <PartContents part={selectedPart} />
      ) : selectedPart ? (
        <Tabs
          onValueChange={(value) => onPartChange(String(value))}
          value={selectedPart.id}
        >
          <TabsList
            aria-label={`${project.name} Platforms`}
            className="w-fit gap-1 rounded-full border-0 bg-white/5 p-1 ring-1 ring-white/10"
          >
            {project.parts.map((part) => (
              <TabsTab
                className="rounded-full px-4 py-1.5 font-medium transition-colors data-active:border-b-0 data-active:bg-white/10 data-active:text-foreground"
                key={part.id}
                value={part.id}
              >
                {part.name}
              </TabsTab>
            ))}
          </TabsList>
          {project.parts.map((part) => (
            <TabsPanel className="pt-6" key={part.id} value={part.id}>
              <PartContents part={part} />
            </TabsPanel>
          ))}
        </Tabs>
      ) : null}
    </div>
  );
}

function PartContents({ part }: { part: ProjectDetail["parts"][number] }) {
  return (
    <section aria-label={part.name} className="space-y-6">
      <p className="text-base leading-relaxed text-pretty text-muted-foreground">
        {part.summary}
      </p>
      {part.description ? <Markdown>{part.description}</Markdown> : null}
      <SkillList label={`Skills used in ${part.name}`} skills={part.skills} />
      <ImageGallery images={toGalleryImages(part.images)} label={part.name} />
    </section>
  );
}
