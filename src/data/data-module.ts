import { createLiveQueryCollection } from "@tanstack/db";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { createCollection } from "@tanstack/react-db";
import type { QueryClient } from "@tanstack/react-query";
import ky from "ky";
import { z } from "zod";

export const GENERIC_CONTENT_ERROR_MESSAGE = "Couldn't load this section.";

export const PROFILE_COLLECTION_KEY = "profile";

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

  async function fetchProfileDocument() {
    const envelopeSchema = itemEnvelopeSchema(profileSchema);
    return fetchDocument<Profile>(
      "profile.json",
      (value) =>
        envelopeSchema.parse(value) as { statusCode: number; data: unknown },
    );
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
