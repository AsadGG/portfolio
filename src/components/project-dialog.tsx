import { useEffect, useState } from "react";
import { type GalleryImage, ImageGallery } from "#/components/image-gallery";
import { Markdown } from "#/components/markdown";
import { Badge } from "#/components/ui/badge";
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
    <ul aria-label={label} className="flex flex-wrap gap-2">
      {skills.map((skill) => (
        <li key={skill}>
          <Badge variant="secondary">{skill}</Badge>
        </li>
      ))}
    </ul>
  );
}

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
    getProjectDetail(projectId).then((result) => {
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
        if (!nextOpen) returnFocus.current?.focus();
      }}
    >
      <DialogContent
        aria-label={
          currentDetail.status === "ready" ? currentDetail.data.name : "Project"
        }
        className="max-h-[min(80vh,48rem)] overflow-y-auto p-8 sm:max-w-2xl"
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
    <div className="space-y-5">
      <DialogHeader className="space-y-2 pr-8">
        <DialogTitle className="text-2xl font-semibold tracking-tight">
          {project.name}
        </DialogTitle>
        {project.clientName ? (
          <p className="text-sm text-muted-foreground">
            Client: {project.clientName}
          </p>
        ) : null}
        {project.role ? (
          <p className="text-sm text-muted-foreground">Role: {project.role}</p>
        ) : null}
        <DialogDescription className="text-sm leading-relaxed">
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
        <nav aria-label={`${project.name} links`} className="flex gap-4">
          {project.links.live ? (
            <a
              href={project.links.live}
              rel="noopener noreferrer"
              target="_blank"
            >
              Live site
            </a>
          ) : null}
          {project.links.repository ? (
            <a
              href={project.links.repository}
              rel="noopener noreferrer"
              target="_blank"
            >
              Repository
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
          <TabsList aria-label={`${project.name} Platforms`}>
            {project.parts.map((part) => (
              <TabsTab key={part.id} value={part.id}>
                {part.name}
              </TabsTab>
            ))}
          </TabsList>
          {project.parts.map((part) => (
            <TabsPanel key={part.id} value={part.id}>
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
    <section aria-label={part.name} className="space-y-5">
      <p className="text-sm leading-relaxed text-muted-foreground">
        {part.summary}
      </p>
      {part.description ? <Markdown>{part.description}</Markdown> : null}
      <SkillList label={`Skills used in ${part.name}`} skills={part.skills} />
      <ImageGallery images={toGalleryImages(part.images)} label={part.name} />
    </section>
  );
}
