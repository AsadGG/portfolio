import { useEffect, useState } from "react";
import type { ProjectDetail } from "../data/data-module";
import { useDataModule } from "../data/data-module-provider";
import { ImageGallery } from "./image-gallery";
import { Markdown } from "./markdown";
import { Badge } from "./ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

type DetailState =
  | { status: "loading"; projectId?: string }
  | { status: "not-found"; projectId: string }
  | { status: "error"; projectId: string; message: string }
  | { status: "ready"; projectId: string; data: ProjectDetail };

export function ProjectDialog({
  projectId,
  onClose,
  returnFocus,
}: {
  projectId?: string;
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
        className="max-h-[min(80vh,48rem)] max-w-2xl overflow-y-auto p-8"
      >
        {currentDetail.status === "ready" ? (
          <ProjectContents project={currentDetail.data} />
        ) : currentDetail.status === "error" ? (
          <p>{currentDetail.message}</p>
        ) : (
          <p aria-live="polite">Loading Project…</p>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ProjectContents({ project }: { project: ProjectDetail }) {
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
        images={project.images.map(({ src, alt, caption }) => ({
          url: src,
          alt,
          caption,
        }))}
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
      {project.skills.length > 0 ? (
        <ul
          aria-label={`Skills used in ${project.name}`}
          className="flex flex-wrap gap-2"
        >
          {project.skills.map((skill) => (
            <li key={skill}>
              <Badge variant="secondary">{skill}</Badge>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
