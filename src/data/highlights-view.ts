import { useLiveQuery } from "@tanstack/react-db";
import {
  ContentError,
  GENERIC_CONTENT_ERROR_MESSAGE,
  type Highlight,
  highlightSchema,
  type ViewState,
} from "#/data/data-module";
import { useDataModule } from "#/data/data-module-provider";

export function useHighlights(): ViewState<Highlight[]> {
  const { highlightsCollection, highlightsView } = useDataModule();
  const query = useLiveQuery(highlightsView);
  const retry = async () => {
    await highlightsCollection.utils.refetch({ throwOnError: true });
  };

  if (highlightsCollection.utils.isError || query.isError) {
    const error = highlightsCollection.utils.lastError ?? query.persistedError;
    return {
      status: "error",
      message:
        error instanceof ContentError
          ? error.message
          : GENERIC_CONTENT_ERROR_MESSAGE,
      retry,
    };
  }

  if (query.data) {
    return {
      status: "ready",
      data: query.data.map((highlight) => highlightSchema.parse(highlight)),
      retry,
    };
  }

  return { status: "loading", retry };
}
