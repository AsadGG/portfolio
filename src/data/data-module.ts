import { BasicIndex, createLiveQueryCollection, eq } from "@tanstack/db";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { createCollection } from "@tanstack/react-db";
import type { QueryClient } from "@tanstack/react-query";
import ky from "ky";
import { z } from "zod";

export const GENERIC_CONTENT_ERROR_MESSAGE = "Couldn't load this section.";

export const PROFILE_COLLECTION_KEY = "profile";
export const HIGHLIGHTS_COLLECTION_KEY = "highlights";
export const SKILL_CATEGORIES_COLLECTION_KEY = "skill-categories";
export const SKILLS_COLLECTION_KEY = "skills";
export const ENGAGEMENTS_COLLECTION_KEY = "engagements";
export const PROJECTS_COLLECTION_KEY = "projects";
export const EDUCATION_COLLECTION_KEY = "education";

export const profileSchema = z.object({
  name: z.string().min(1),
  headline: z.string().min(1),
  location: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  github: z.url(),
  linkedin: z.url(),
  intro: z.string().min(1),
});

export type Profile = z.infer<typeof profileSchema>;

export const highlightSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().min(1),
  text: z.string().min(1),
});

export type Highlight = z.infer<typeof highlightSchema>;
const storedHighlightSchema = highlightSchema.extend({
  documentOrder: z.number().int(),
});

export const skillCategorySchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().min(1),
});

export type SkillCategory = z.infer<typeof skillCategorySchema>;
const storedSkillCategorySchema = skillCategorySchema.extend({
  documentOrder: z.number().int(),
});

export const skillSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().min(1),
  categoryId: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  listed: z.boolean(),
});

export type Skill = z.infer<typeof skillSchema>;
const storedSkillSchema = skillSchema.extend({
  documentOrder: z.number().int(),
});

const engagementFields = {
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  start: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
  end: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/)
    .optional(),
  location: z.string().min(1).optional(),
  summary: z.string().min(1).optional(),
};

export const engagementSchema = z.discriminatedUnion("kind", [
  z
    .object({
      ...engagementFields,
      kind: z.literal("employment"),
      companyName: z.string().min(1),
    })
    .strict(),
  z
    .object({
      ...engagementFields,
      kind: z.literal("freelance"),
    })
    .strict(),
]);

export type Engagement = z.infer<typeof engagementSchema>;
const storedEngagementSchema = engagementSchema.and(
  z.object({ documentOrder: z.number().int() }),
);

export const imageSchema = z.object({
  src: z.string().min(1),
  alt: z.string().trim().min(1),
  caption: z.string().min(1).optional(),
});

export type ProjectImage = z.infer<typeof imageSchema>;

export const partSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    name: z.string().min(1),
    summary: z.string().min(1),
    description: z.string().min(1),
    skillIds: z.array(z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)),
    images: z.array(imageSchema),
  })
  .strict();

export type ProjectPart = z.infer<typeof partSchema>;

export const projectSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    engagementId: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    name: z.string().min(1),
    summary: z.string().min(1),
    description: z.string().min(1).optional(),
    skillIds: z.array(z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)),
    images: z.array(imageSchema),
    parts: z.array(partSchema),
    clientName: z.string().min(1).optional(),
    role: z.string().optional(),
    links: z
      .object({ live: z.url().optional(), repository: z.url().optional() })
      .strict()
      .optional(),
  })
  .strict()
  .refine((project) => project.parts.length > 0 || project.description, {
    message: "A Project without Parts must have a Description.",
    path: ["description"],
  });

export type Project = z.infer<typeof projectSchema>;
const storedProjectSchema = projectSchema.extend({
  documentOrder: z.number().int(),
});

export type ReferenceIntegrityContent = {
  highlights: Highlight[];
  skillCategories: SkillCategory[];
  skills: Skill[];
  engagements: Engagement[];
  projects: Project[];
};

export type ReferenceIntegrityProblem = {
  document: string;
  recordId: string;
  rule: string;
  message: string;
};

function findProjectReferenceProblems(
  project: Project,
  engagementIds: Set<string>,
  skillIds: Set<string>,
): ReferenceIntegrityProblem[] {
  const problems: ReferenceIntegrityProblem[] = [];
  if (!engagementIds.has(project.engagementId)) {
    problems.push({
      document: "projects.json",
      recordId: project.id,
      rule: "Project Engagement reference exists",
      message: `projects.json Project "${project.id}" has engagementId "${project.engagementId}" for a missing Engagement.`,
    });
  }
  for (const skillId of project.skillIds) {
    if (!skillIds.has(skillId)) {
      problems.push({
        document: "projects.json",
        recordId: project.id,
        rule: "Project and Part Skill references exist",
        message: `projects.json Project "${project.id}" refers to missing Skill "${skillId}" in skillIds.`,
      });
    }
  }
  for (const part of project.parts) {
    for (const skillId of part.skillIds) {
      if (!skillIds.has(skillId)) {
        problems.push({
          document: "projects.json",
          recordId: `${project.id}/${part.id}`,
          rule: "Project and Part Skill references exist",
          message: `projects.json Part "${part.id}" in Project "${project.id}" refers to missing Skill "${skillId}" in skillIds.`,
        });
      }
    }
  }
  return problems;
}

function findSkillCategoryReferenceProblems(
  skills: Skill[],
  categoryIds: Set<string>,
): ReferenceIntegrityProblem[] {
  return skills.flatMap((skill) =>
    categoryIds.has(skill.categoryId)
      ? []
      : [
          {
            document: "skills.json",
            recordId: skill.id,
            rule: "Skill category reference exists",
            message: `skills.json Skill "${skill.id}" refers to missing Skill Category "${skill.categoryId}" in categoryId.`,
          },
        ],
  );
}

export function checkReferenceIntegrity(
  content: ReferenceIntegrityContent,
): ReferenceIntegrityProblem[] {
  const problems: ReferenceIntegrityProblem[] = [];
  const lists: Array<[string, Array<{ id: string }>]> = [
    ["highlights.json", content.highlights],
    ["skill-categories.json", content.skillCategories],
    ["skills.json", content.skills],
    ["engagements.json", content.engagements],
    ["projects.json", content.projects],
  ];
  for (const [document, records] of lists) {
    const seen = new Set<string>();
    for (const { id } of records) {
      if (seen.has(id)) {
        problems.push({
          document,
          recordId: id,
          rule: "List document ids are unique",
          message: `${document} contains duplicate id "${id}".`,
        });
      }
      seen.add(id);
    }
  }
  const engagementIds = new Set(content.engagements.map(({ id }) => id));
  const engagementsById = new Map(
    content.engagements.map((engagement) => [engagement.id, engagement]),
  );
  const skillIds = new Set(content.skills.map(({ id }) => id));
  const categoryIds = new Set(content.skillCategories.map(({ id }) => id));

  for (const project of content.projects) {
    const partIds = new Set<string>();
    for (const part of project.parts) {
      if (partIds.has(part.id)) {
        problems.push({
          document: "projects.json",
          recordId: `${project.id}/${part.id}`,
          rule: "Part ids are unique within a Project",
          message: `projects.json Project "${project.id}" contains duplicate Part id "${part.id}".`,
        });
      }
      partIds.add(part.id);
    }
    problems.push(
      ...findProjectReferenceProblems(project, engagementIds, skillIds),
    );
    if (
      project.clientName &&
      engagementsById.get(project.engagementId)?.kind !== "freelance"
    ) {
      problems.push({
        document: "projects.json",
        recordId: project.id,
        rule: "Client names belong only to Freelance Projects",
        message: `projects.json Project "${project.id}" has clientName but its Engagement is not Freelance.`,
      });
    }
    if (project.parts.length === 0 && !project.description) {
      problems.push({
        document: "projects.json",
        recordId: project.id,
        rule: "Projects without Parts have a Description",
        message: `projects.json Project "${project.id}" has no Parts and is missing description.`,
      });
    }
  }
  problems.push(
    ...findSkillCategoryReferenceProblems(content.skills, categoryIds),
  );
  const freelanceEngagements = content.engagements.filter(
    ({ kind }) => kind === "freelance",
  );
  if (freelanceEngagements.length > 1) {
    for (const engagement of freelanceEngagements.slice(1)) {
      problems.push({
        document: "engagements.json",
        recordId: engagement.id,
        rule: "At most one Freelance Engagement exists",
        message: `engagements.json contains more than one Freelance Engagement; "${engagement.id}" is an additional record.`,
      });
    }
  }

  return problems;
}

function reportDanglingProjectReferences(
  projects: Array<Project & { documentOrder: number }>,
  engagementIds: Set<string>,
  skillIds: Set<string>,
  warn: (problem: ReferenceIntegrityProblem) => void,
) {
  for (const project of projects) {
    for (const problem of findProjectReferenceProblems(
      project,
      engagementIds,
      skillIds,
    )) {
      const skipMessage =
        problem.rule === "Project Engagement reference exists"
          ? "the Project is skipped"
          : "that Skill chip is skipped";
      warn({
        ...problem,
        message: `${problem.message.slice(0, -1)}; ${skipMessage}.`,
      });
    }
  }
}

function reportDanglingSkillCategories(
  skills: Array<Skill & { documentOrder: number }>,
  categoryIds: Set<string>,
  warn: (problem: ReferenceIntegrityProblem) => void,
) {
  for (const problem of findSkillCategoryReferenceProblems(
    skills,
    categoryIds,
  )) {
    warn({
      ...problem,
      message: `${problem.message.slice(0, -1)}; the Skill is skipped.`,
    });
  }
}

export const educationSchema = z.object({
  institution: z.string().min(1),
  degree: z.string().min(1),
  field: z.string().min(1),
  location: z.string().min(1),
  startYear: z.number().int().optional(),
  endYear: z.number().int().optional(),
});

export type Education = z.infer<typeof educationSchema>;
export type EducationSectionData = Education & { dateRange?: string };

export type ExperienceEngagement = {
  id: string;
  heading: string;
  dateRange: string;
  location?: string;
  summary?: string;
  projects: ExperienceProject[];
};

export type ExperienceProject = {
  id: string;
  name: string;
  summary: string;
  clientName?: string;
  skills: string[];
  thumbnail?: ProjectImage;
};

export type ProjectDetailPart = ProjectPart & {
  skills: string[];
};

export type ProjectDetail = {
  id: string;
  engagementId: string;
  name: string;
  summary: string;
  description?: string;
  clientName?: string;
  role?: string;
  links?: Project["links"];
  skillIds: string[];
  skills: string[];
  images: ProjectImage[];
  parts: ProjectDetailPart[];
};

export type SkillGroup = SkillCategory & { skills: Skill[] };

type SkillsSectionRow = {
  category: z.infer<typeof storedSkillCategorySchema>;
  skill?: z.infer<typeof storedSkillSchema> | null;
};

export function groupSkillsSection(rows: SkillsSectionRow[]): SkillGroup[] {
  const categories = new Map<string, SkillGroup>();
  const orderedRows = [...rows].sort(
    (left, right) =>
      left.category.documentOrder - right.category.documentOrder ||
      (left.skill?.documentOrder ?? -1) - (right.skill?.documentOrder ?? -1),
  );

  for (const { category, skill } of orderedRows) {
    let group = categories.get(category.id);
    if (!group) {
      group = { id: category.id, name: category.name, skills: [] };
      categories.set(category.id, group);
    }
    if (skill?.listed) {
      group.skills.push({
        id: skill.id,
        name: skill.name,
        categoryId: skill.categoryId,
        listed: skill.listed,
      });
    }
  }

  return [...categories.values()].filter(
    (category) => category.skills.length > 0,
  );
}

export type ViewState<T> =
  | { status: "loading"; retry: () => Promise<void> }
  | { status: "error"; message: string; retry: () => Promise<void> }
  | { status: "ready"; data: T; retry: () => Promise<void> };

const paginationSchema = z.object({
  currentPage: z.number().int(),
  lastPage: z.number().int(),
  nextPage: z.number().int().nullable(),
  pageSize: z.number().int(),
  previousPage: z.number().int().nullable(),
  total: z.number().int(),
});

export const errorEnvelopeSchema = z.object({
  statusCode: z.number().int(),
  message: z.string(),
  code: z.enum([
    "validation_failed",
    "invalid_credentials",
    "invalid_code",
    "unauthorized",
    "forbidden",
    "not_found",
    "conflict",
    "idempotency_in_progress",
    "idempotency_key_reused",
    "rate_limited",
    "overloaded",
    "shutting_down",
    "not_ready",
    "internal_error",
  ]),
  requestId: z.string(),
  details: z
    .array(z.object({ field: z.string(), message: z.string() }))
    .optional(),
  reason: z.enum(["shutting_down", "dependency_unavailable"]).optional(),
});

export function itemEnvelopeSchema<T extends z.ZodType>(recordSchema: T) {
  return z.object({
    statusCode: z.number().int(),
    message: z.string(),
    data: recordSchema,
  });
}

export function listEnvelopeSchema<T extends z.ZodType>(recordSchema: T) {
  return z.object({
    statusCode: z.number().int(),
    message: z.string(),
    data: z.array(recordSchema),
    pagination: paginationSchema,
    aggregates: z.record(z.string(), z.unknown()).optional(),
  });
}

export class ContentError extends Error {
  readonly cause: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "ContentError";
    this.cause = cause;
  }
}

type RetryableCollection = {
  utils: {
    isError: boolean;
    refetch: (options: { throwOnError: true }) => Promise<unknown>;
  };
};

type RetryAction = () => Promise<void>;

function createRetryAction(
  collections: ReadonlyArray<RetryableCollection>,
): RetryAction {
  return async () => {
    await Promise.all(
      collections
        .filter((collection) => collection.utils.isError)
        .map((collection) => collection.utils.refetch({ throwOnError: true })),
    );
  };
}

export function createContentErrorState(
  error: unknown,
  sourceErrors: ReadonlyArray<unknown>,
  retry: RetryAction,
) {
  const sourceError = sourceErrors.find(
    (candidate): candidate is ContentError => candidate instanceof ContentError,
  );
  return {
    status: "error" as const,
    message:
      error instanceof ContentError
        ? error.message
        : (sourceError?.message ?? GENERIC_CONTENT_ERROR_MESSAGE),
    retry,
  };
}

export interface DataModuleOptions {
  baseUrl?: string;
  fetch?: typeof globalThis.fetch;
  now?: () => Date;
  queryClient: QueryClient;
  retries?: boolean;
}

export function createDataModule(options: DataModuleOptions) {
  const baseUrl =
    options.baseUrl ?? import.meta.env.VITE_CONTENT_BASE_URL ?? "/content/";
  const contentBaseUrl = new URL(
    baseUrl,
    globalThis.location?.origin ?? "http://localhost",
  ).toString();
  const queryClient = options.queryClient;
  const retries = options.retries ?? true;
  const now = options.now ?? (() => new Date());
  const client = ky.create({
    prefix: baseUrl,
    fetch: options.fetch ?? globalThis.fetch,
    retry: { limit: 0 },
  });

  const retryCount = retries ? 1 : 0;
  queryClient.setDefaultOptions({ queries: { retry: retryCount } });

  const profileCollection = createCollection(
    queryCollectionOptions({
      queryKey: [PROFILE_COLLECTION_KEY],
      queryFn: async () => [await fetchProfileDocument()],
      getKey: () => PROFILE_COLLECTION_KEY,
      queryClient,
      retry: retryCount,
      schema: profileSchema,
    }),
  );
  const profileView = createLiveQueryCollection((query) =>
    query.from({ profile: profileCollection }).select(({ profile }) => profile),
  );
  const highlightsCollection = createCollection(
    queryCollectionOptions({
      queryKey: [HIGHLIGHTS_COLLECTION_KEY],
      queryFn: fetchHighlightsDocument,
      getKey: (highlight) => highlight.id,
      queryClient,
      retry: retryCount,
      schema: storedHighlightSchema,
    }),
  );
  const highlightsView = createLiveQueryCollection((query) =>
    query
      .from({ highlight: highlightsCollection })
      .orderBy(({ highlight }) => highlight.documentOrder)
      .select(({ highlight }) => ({
        id: highlight.id,
        title: highlight.title,
        text: highlight.text,
      })),
  );
  const skillCategoriesCollection = createCollection(
    queryCollectionOptions({
      queryKey: [SKILL_CATEGORIES_COLLECTION_KEY],
      queryFn: fetchSkillCategoriesDocument,
      getKey: (category) => category.id,
      queryClient,
      retry: retryCount,
      schema: storedSkillCategorySchema,
    }),
  );
  const skillsCollection = createCollection(
    queryCollectionOptions({
      queryKey: [SKILLS_COLLECTION_KEY],
      queryFn: fetchSkillsDocument,
      getKey: (skill) => skill.id,
      queryClient,
      retry: retryCount,
      schema: storedSkillSchema,
    }),
  );
  const engagementsCollection = createCollection(
    queryCollectionOptions({
      queryKey: [ENGAGEMENTS_COLLECTION_KEY],
      queryFn: fetchEngagementsDocument,
      getKey: (engagement) => engagement.id,
      queryClient,
      retry: retryCount,
      schema: storedEngagementSchema,
    }),
  );
  const projectsCollection = createCollection(
    queryCollectionOptions({
      queryKey: [PROJECTS_COLLECTION_KEY],
      queryFn: fetchProjectsDocument,
      getKey: (project) => project.id,
      queryClient,
      retry: retryCount,
      schema: storedProjectSchema,
    }),
  );
  projectsCollection.createIndex((project) => project.engagementId, {
    indexType: BasicIndex,
  });
  const educationCollection = createCollection(
    queryCollectionOptions({
      queryKey: [EDUCATION_COLLECTION_KEY],
      queryFn: async () => [await fetchEducationDocument()],
      getKey: () => EDUCATION_COLLECTION_KEY,
      queryClient,
      retry: retryCount,
      schema: educationSchema,
    }),
  );
  const educationView = createLiveQueryCollection((query) =>
    query
      .from({ education: educationCollection })
      .select(({ education }) => education),
  );
  const engagementsView = createLiveQueryCollection((query) =>
    query
      .from({ engagement: engagementsCollection })
      .select(({ engagement }) => engagement),
  );
  const experienceView = createLiveQueryCollection((query) =>
    query
      .from({ engagement: engagementsCollection })
      .leftJoin({ project: projectsCollection }, ({ engagement, project }) =>
        eq(engagement.id, project.engagementId),
      )
      .select(({ engagement, project }) => ({
        engagement,
        project: project ?? null,
      })),
  );
  const experienceSkillsView = createLiveQueryCollection((query) =>
    query.from({ skill: skillsCollection }).select(({ skill }) => skill),
  );
  const projectsReferenceView = createLiveQueryCollection((query) =>
    query
      .from({ project: projectsCollection })
      .select(({ project }) => project),
  );
  const skillCategoriesReferenceView = createLiveQueryCollection((query) =>
    query
      .from({ category: skillCategoriesCollection })
      .select(({ category }) => category),
  );
  const skillsReferenceView = createLiveQueryCollection((query) =>
    query.from({ skill: skillsCollection }).select(({ skill }) => skill),
  );
  skillsCollection.createIndex((skill) => skill.categoryId, {
    indexType: BasicIndex,
  });
  const skillsSectionView = createLiveQueryCollection((query) =>
    query
      .from({ category: skillCategoriesCollection })
      .leftJoin({ skill: skillsCollection }, ({ category, skill }) =>
        eq(category.id, skill.categoryId),
      )
      .where(({ skill }) => skill === undefined || skill.listed)
      .select(({ category, skill }) => ({ category, skill: skill ?? null })),
  );
  const reportedReferenceWarnings = new Set<string>();

  function warnOnce(problem: ReferenceIntegrityProblem) {
    if (reportedReferenceWarnings.has(problem.message)) return;
    reportedReferenceWarnings.add(problem.message);
    console.warn(problem.message);
  }

  async function fetchProfileDocument() {
    const envelopeSchema = itemEnvelopeSchema(profileSchema);
    return fetchDocument<Profile>(
      "profile.json",
      (value) =>
        envelopeSchema.parse(value) as { statusCode: number; data: unknown },
    );
  }

  async function fetchHighlightsDocument() {
    const envelopeSchema = listEnvelopeSchema(highlightSchema);
    const highlights = await fetchDocument<Highlight[]>(
      "highlights.json",
      (value) =>
        envelopeSchema.parse(value) as { statusCode: number; data: unknown },
    );
    return highlights.map((highlight, documentOrder) => ({
      ...highlight,
      documentOrder,
    }));
  }

  async function fetchSkillCategoriesDocument() {
    const categories = await fetchDocument<SkillCategory[]>(
      "skill-categories.json",
      (value) =>
        listEnvelopeSchema(skillCategorySchema).parse(value) as {
          statusCode: number;
          data: unknown;
        },
    );
    return categories.map((category, documentOrder) => ({
      ...category,
      documentOrder,
    }));
  }

  async function fetchSkillsDocument() {
    const skills = await fetchDocument<Skill[]>(
      "skills.json",
      (value) =>
        listEnvelopeSchema(skillSchema).parse(value) as {
          statusCode: number;
          data: unknown;
        },
    );
    return skills.map((skill, documentOrder) => ({ ...skill, documentOrder }));
  }

  async function fetchEngagementsDocument() {
    const engagements = await fetchDocument<Engagement[]>(
      "engagements.json",
      (value) =>
        listEnvelopeSchema(engagementSchema).parse(value) as {
          statusCode: number;
          data: unknown;
        },
    );
    return engagements.map((engagement, documentOrder) => ({
      ...engagement,
      documentOrder,
    }));
  }

  async function fetchProjectsDocument() {
    const projects = await fetchDocument<Project[]>(
      "projects.json",
      (value) =>
        listEnvelopeSchema(projectSchema).parse(value) as {
          statusCode: number;
          data: unknown;
        },
    );
    return projects.map((project, documentOrder) => ({
      ...project,
      images: project.images.map(resolveImageUrl),
      parts: project.parts.map((part) => ({
        ...part,
        images: part.images.map(resolveImageUrl),
      })),
      documentOrder,
    }));
  }

  function resolveImageUrl(image: ProjectImage): ProjectImage {
    return {
      ...image,
      src: new URL(image.src, contentBaseUrl).toString(),
    };
  }

  async function fetchEducationDocument() {
    const envelopeSchema = itemEnvelopeSchema(educationSchema);
    return fetchDocument<Education>(
      "education.json",
      (value) =>
        envelopeSchema.parse(value) as { statusCode: number; data: unknown },
    );
  }

  const retryExperience = createRetryAction([
    engagementsCollection,
    projectsCollection,
    skillsCollection,
  ]);

  async function getExperience() {
    try {
      const [rows, skills, projects] = await Promise.all([
        experienceView.toArrayWhenReady(),
        experienceSkillsView.toArrayWhenReady(),
        projectsReferenceView.toArrayWhenReady(),
      ]);
      reportDanglingProjectReferences(
        projects,
        new Set(rows.map(({ engagement }) => engagement.id)),
        new Set(skills.map(({ id }) => id)),
        warnOnce,
      );
      return {
        status: "ready" as const,
        data: buildExperienceView(rows, skills),
        retry: retryExperience,
      };
    } catch (error) {
      return createContentErrorState(
        error,
        [
          engagementsCollection.utils.lastError,
          projectsCollection.utils.lastError,
          skillsCollection.utils.lastError,
        ],
        retryExperience,
      );
    }
  }

  async function getProjectDetail(projectId: string) {
    const retry = createRetryAction([projectsCollection, skillsCollection]);

    try {
      const [projects, skills] = await Promise.all([
        projectsReferenceView.toArrayWhenReady(),
        experienceSkillsView.toArrayWhenReady(),
      ]);
      const project = projects.find(({ id }) => id === projectId);
      if (!project) return { status: "not-found" as const, retry };
      const skillsById = new Map(skills.map((skill) => [skill.id, skill.name]));
      const resolveSkillNames = (ids: string[]) =>
        ids.flatMap((id) => {
          const name = skillsById.get(id);
          return name ? [name] : [];
        });
      return {
        status: "ready" as const,
        data: {
          id: project.id,
          engagementId: project.engagementId,
          name: project.name,
          summary: project.summary,
          ...(project.description ? { description: project.description } : {}),
          ...(project.clientName ? { clientName: project.clientName } : {}),
          ...(project.role !== undefined ? { role: project.role } : {}),
          ...(project.links ? { links: project.links } : {}),
          skillIds: project.skillIds,
          skills: resolveSkillNames([
            ...new Set([
              ...project.skillIds,
              ...project.parts.flatMap((part) => part.skillIds),
            ]),
          ]),
          images: project.images,
          parts: project.parts.map((part) => ({
            ...part,
            skills: resolveSkillNames(part.skillIds),
          })),
        },
        retry,
      };
    } catch (error) {
      return createContentErrorState(
        error,
        [projectsCollection.utils.lastError, skillsCollection.utils.lastError],
        retry,
      );
    }
  }

  async function getEducation() {
    const retry = async () => {
      await educationCollection.utils.refetch({ throwOnError: true });
    };

    try {
      const [data] = await educationView.toArrayWhenReady();
      return {
        status: "ready" as const,
        data: buildEducationView(data),
        retry,
      };
    } catch (error) {
      return {
        status: "error" as const,
        message:
          error instanceof ContentError
            ? error.message
            : educationCollection.utils.lastError instanceof ContentError
              ? educationCollection.utils.lastError.message
              : GENERIC_CONTENT_ERROR_MESSAGE,
        retry,
      };
    }
  }

  async function getProfile() {
    const retry = async () => {
      await profileCollection.utils.refetch({ throwOnError: true });
    };

    try {
      const [data] = await profileView.toArrayWhenReady();
      return {
        status: "ready" as const,
        data: profileSchema.parse(data),
        retry,
      };
    } catch (error) {
      return {
        status: "error" as const,
        message:
          error instanceof ContentError
            ? error.message
            : profileCollection.utils.lastError instanceof ContentError
              ? profileCollection.utils.lastError.message
              : GENERIC_CONTENT_ERROR_MESSAGE,
        retry,
      };
    }
  }

  async function getIntro() {
    let profileFailed = false;
    let engagementsFailed = false;
    const retry = async () => {
      const failedCollections = [
        ...(profileFailed ? [profileCollection] : []),
        ...(engagementsFailed ? [engagementsCollection] : []),
      ];
      await Promise.all(
        failedCollections.map((collection) =>
          collection.utils.refetch({ throwOnError: true }),
        ),
      );
    };

    const [profileResult, engagementsResult] = await Promise.allSettled([
      profileView.toArrayWhenReady(),
      engagementsView.toArrayWhenReady(),
    ]);

    if (
      profileResult.status === "rejected" ||
      engagementsResult.status === "rejected"
    ) {
      profileFailed = profileResult.status === "rejected";
      engagementsFailed = engagementsResult.status === "rejected";
      const errors = [
        profileCollection.utils.lastError,
        engagementsCollection.utils.lastError,
      ];
      const contentError = errors.find(
        (error) => error instanceof ContentError,
      );
      return {
        status: "error" as const,
        message: contentError?.message ?? GENERIC_CONTENT_ERROR_MESSAGE,
        retry,
      };
    }

    const profile = profileResult.value[0];
    const engagements = engagementsResult.value;
    if (
      !profile ||
      (profile.intro.includes("{years}") && engagements.length === 0)
    ) {
      return {
        status: "error" as const,
        message: GENERIC_CONTENT_ERROR_MESSAGE,
        retry,
      };
    }
    return {
      status: "ready" as const,
      data: resolveIntroText(profile.intro, engagements, now()),
      retry,
    };
  }

  async function getHighlights() {
    const retry = async () => {
      await highlightsCollection.utils.refetch({ throwOnError: true });
    };

    try {
      const data = await highlightsView.toArrayWhenReady();
      return { status: "ready" as const, data, retry };
    } catch (error) {
      return {
        status: "error" as const,
        message:
          error instanceof ContentError
            ? error.message
            : highlightsCollection.utils.lastError instanceof ContentError
              ? highlightsCollection.utils.lastError.message
              : GENERIC_CONTENT_ERROR_MESSAGE,
        retry,
      };
    }
  }

  async function getSkillsSection() {
    try {
      const [rows, categories, skills] = await Promise.all([
        skillsSectionView.toArrayWhenReady(),
        skillCategoriesReferenceView.toArrayWhenReady(),
        skillsReferenceView.toArrayWhenReady(),
      ]);
      reportDanglingSkillCategories(
        skills,
        new Set(categories.map(({ id }) => id)),
        warnOnce,
      );
      return {
        status: "ready" as const,
        data: groupSkillsSection(rows),
        retry: retrySkillsSection,
      };
    } catch (error) {
      const contentError =
        error instanceof ContentError
          ? error
          : skillCategoriesCollection.utils.lastError instanceof ContentError
            ? skillCategoriesCollection.utils.lastError
            : skillsCollection.utils.lastError instanceof ContentError
              ? skillsCollection.utils.lastError
              : null;
      return {
        status: "error" as const,
        message: contentError?.message ?? GENERIC_CONTENT_ERROR_MESSAGE,
        retry: retrySkillsSection,
      };
    }
  }

  async function retrySkillsSection() {
    await Promise.all([
      skillCategoriesCollection.utils.refetch({ throwOnError: true }),
      skillsCollection.utils.refetch({ throwOnError: true }),
    ]);
  }

  async function fetchDocument<T>(
    path: string,
    parseEnvelope: (value: unknown) => { statusCode: number; data: unknown },
  ): Promise<T> {
    try {
      const response = await client.get(path, { throwHttpErrors: false });
      let body: unknown;
      try {
        body = await response.json();
      } catch (cause) {
        throw new ContentError(GENERIC_CONTENT_ERROR_MESSAGE, cause);
      }

      if (!response.ok) {
        const errorEnvelope = errorEnvelopeSchema.safeParse(body);
        if (
          errorEnvelope.success &&
          errorEnvelope.data.statusCode === response.status
        ) {
          throw new ContentError(errorEnvelope.data.message, body);
        }
        throw new ContentError(GENERIC_CONTENT_ERROR_MESSAGE, body);
      }

      const envelope = parseEnvelope(body);
      if (envelope.statusCode !== response.status) {
        throw new ContentError(GENERIC_CONTENT_ERROR_MESSAGE, body);
      }
      return envelope.data as T;
    } catch (cause) {
      if (cause instanceof ContentError) throw cause;
      throw new ContentError(GENERIC_CONTENT_ERROR_MESSAGE, cause);
    }
  }

  return {
    queryClient,
    retries,
    profileCollection,
    profileView,
    getProfile,
    getIntro,
    resolveIntro(intro: string, engagements: Engagement[]) {
      return resolveIntroText(intro, engagements, now());
    },
    highlightsCollection,
    highlightsView,
    getHighlights,
    skillCategoriesCollection,
    skillsCollection,
    skillsSectionView,
    getSkillsSection,
    retrySkillsSection,
    engagementsCollection,
    projectsCollection,
    engagementsView,
    experienceView,
    experienceSkillsView,
    retryExperience,
    getExperience,
    getProjectDetail,
    educationCollection,
    educationView,
    getEducation,
    fetchItemDocument<T extends z.ZodType>(path: string, recordSchema: T) {
      const envelopeSchema = itemEnvelopeSchema(recordSchema);
      return fetchDocument<z.output<T>>(
        path,
        (value) =>
          envelopeSchema.parse(value) as { statusCode: number; data: unknown },
      );
    },
    fetchListDocument<T extends z.ZodType>(path: string, recordSchema: T) {
      const envelopeSchema = listEnvelopeSchema(recordSchema);
      return fetchDocument<z.output<T>[]>(
        path,
        (value) =>
          envelopeSchema.parse(value) as { statusCode: number; data: unknown },
      );
    },
  };
}

export function buildEducationView(education: Education): EducationSectionData {
  const dateRange =
    education.startYear !== undefined && education.endYear !== undefined
      ? `${education.startYear} – ${education.endYear}`
      : education.endYear !== undefined
        ? String(education.endYear)
        : education.startYear !== undefined
          ? `${education.startYear} – Present`
          : undefined;
  return { ...education, ...(dateRange ? { dateRange } : {}) };
}

export function resolveIntroText(
  intro: string,
  engagements: Engagement[],
  now: Date,
) {
  if (!intro.includes("{years}")) return intro;
  const earliestStart = engagements.reduce(
    (earliest, engagement) =>
      engagement.start < earliest ? engagement.start : earliest,
    engagements[0]?.start ?? "",
  );
  if (!earliestStart) return intro;

  const [startYear, startMonth] = earliestStart.split("-").map(Number);
  let years = now.getUTCFullYear() - startYear;
  if (now.getUTCMonth() + 1 < startMonth) years -= 1;
  return intro.replaceAll("{years}", String(years));
}

const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function formatYearMonth(value: string) {
  const [year, month] = value.split("-");
  return `${monthNames[Number(month) - 1]} ${year}`;
}

export function buildExperienceView(
  rows: Array<{
    engagement: Engagement & { documentOrder: number };
    project?: (Project & { documentOrder: number }) | null;
  }>,
  skills: Array<Skill & { documentOrder: number }>,
): ExperienceEngagement[] {
  const skillsById = new Map(skills.map((skill) => [skill.id, skill]));
  const engagements = new Map<
    string,
    {
      engagement: Engagement & { documentOrder: number };
      projects: Map<
        string,
        {
          project: Project & { documentOrder: number };
        }
      >;
    }
  >();
  for (const { engagement, project } of rows) {
    let grouped = engagements.get(engagement.id);
    if (!grouped) {
      grouped = { engagement, projects: new Map() };
      engagements.set(engagement.id, grouped);
    }
    if (!project) continue;
    let projectGroup = grouped.projects.get(project.id);
    if (!projectGroup) {
      projectGroup = { project };
      grouped.projects.set(project.id, projectGroup);
    }
  }

  return [...engagements.values()]
    .sort((left, right) => {
      if (left.engagement.kind !== right.engagement.kind)
        return left.engagement.kind === "freelance" ? 1 : -1;
      if (left.engagement.kind === "freelance")
        return left.engagement.documentOrder - right.engagement.documentOrder;
      return (
        right.engagement.start.localeCompare(left.engagement.start) ||
        left.engagement.documentOrder - right.engagement.documentOrder
      );
    })
    .map(({ engagement, projects }) => ({
      id: engagement.id,
      heading:
        engagement.kind === "employment" ? engagement.companyName : "Freelance",
      dateRange: `${formatYearMonth(engagement.start)} – ${engagement.end ? formatYearMonth(engagement.end) : "Present"}`,
      ...(engagement.location ? { location: engagement.location } : {}),
      ...(engagement.summary ? { summary: engagement.summary } : {}),
      projects: [...projects.values()]
        .sort(
          (left, right) =>
            left.project.documentOrder - right.project.documentOrder,
        )
        .map(({ project }) => {
          const thumbnail =
            project.images[0] ??
            project.parts.find((part) => part.images.length > 0)?.images[0];
          const skillIds = new Set([
            ...project.skillIds,
            ...project.parts.flatMap((part) => part.skillIds),
          ]);

          return {
            id: project.id,
            name: project.name,
            summary: project.summary,
            ...(project.clientName ? { clientName: project.clientName } : {}),
            ...(thumbnail ? { thumbnail } : {}),
            skills: [...skillIds].flatMap((id) => {
              const skill = skillsById.get(id);
              return skill ? [skill.name] : [];
            }),
          };
        }),
    }));
}
