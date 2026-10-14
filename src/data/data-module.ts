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

export type ExperienceEngagement = {
  id: string;
  heading: string;
  dateRange: string;
  location?: string;
  summary?: string;
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

export interface DataModuleOptions {
  baseUrl?: string;
  fetch?: typeof globalThis.fetch;
  queryClient: QueryClient;
  retries?: boolean;
}

export function createDataModule(options: DataModuleOptions) {
  const baseUrl =
    options.baseUrl ?? import.meta.env.VITE_CONTENT_BASE_URL ?? "/content/";
  const queryClient = options.queryClient;
  const retries = options.retries ?? true;
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
  const experienceView = createLiveQueryCollection((query) =>
    query
      .from({ engagement: engagementsCollection })
      .select(({ engagement }) => engagement),
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

  async function getExperience() {
    const retry = async () => {
      await engagementsCollection.utils.refetch({ throwOnError: true });
    };

    try {
      const rows = await experienceView.toArrayWhenReady();
      return {
        status: "ready" as const,
        data: buildExperienceView(rows),
        retry,
      };
    } catch (error) {
      return {
        status: "error" as const,
        message:
          error instanceof ContentError
            ? error.message
            : engagementsCollection.utils.lastError instanceof ContentError
              ? engagementsCollection.utils.lastError.message
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
      const rows = await skillsSectionView.toArrayWhenReady();
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
    highlightsCollection,
    highlightsView,
    getHighlights,
    skillCategoriesCollection,
    skillsCollection,
    skillsSectionView,
    getSkillsSection,
    retrySkillsSection,
    engagementsCollection,
    experienceView,
    getExperience,
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
  engagements: Array<Engagement & { documentOrder: number }>,
): ExperienceEngagement[] {
  return [...engagements]
    .sort((left, right) => {
      if (left.kind !== right.kind) return left.kind === "freelance" ? 1 : -1;
      if (left.kind === "freelance")
        return left.documentOrder - right.documentOrder;
      return (
        right.start.localeCompare(left.start) ||
        left.documentOrder - right.documentOrder
      );
    })
    .map((engagement) => ({
      id: engagement.id,
      heading:
        engagement.kind === "employment" ? engagement.companyName : "Freelance",
      dateRange: `${formatYearMonth(engagement.start)} – ${engagement.end ? formatYearMonth(engagement.end) : "Present"}`,
      ...(engagement.location ? { location: engagement.location } : {}),
      ...(engagement.summary ? { summary: engagement.summary } : {}),
    }));
}
