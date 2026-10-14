import type { QueryClient } from "@tanstack/react-query";
import ky from "ky";
import { z } from "zod";

export const GENERIC_CONTENT_ERROR_MESSAGE = "Couldn't load this section.";

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

  queryClient.setDefaultOptions({ queries: { retry: retries } });

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
