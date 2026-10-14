import { useLiveQuery } from "@tanstack/react-db";
import {
  buildExperienceView,
  ContentError,
  type ExperienceEngagement,
  GENERIC_CONTENT_ERROR_MESSAGE,
  type ViewState,
} from "./data-module";
import { useDataModule } from "./data-module-provider";

export function useExperience(): ViewState<ExperienceEngagement[]> {
  const { engagementsCollection, experienceView } = useDataModule();
  const query = useLiveQuery(experienceView);
  const retry = async () => {
    await engagementsCollection.utils.refetch({ throwOnError: true });
  };

  if (engagementsCollection.utils.isError || query.isError) {
    const error = engagementsCollection.utils.lastError ?? query.persistedError;
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
    return { status: "ready", data: buildExperienceView(query.data), retry };
  }

  return { status: "loading", retry };
}
