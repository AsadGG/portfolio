import { useLiveQuery } from "@tanstack/react-db";
import {
  buildEducationView,
  ContentError,
  type EducationSectionData,
  GENERIC_CONTENT_ERROR_MESSAGE,
  type ViewState,
} from "./data-module";
import { useDataModule } from "./data-module-provider";

export function useEducation(): ViewState<EducationSectionData> {
  const { educationCollection, educationView } = useDataModule();
  const query = useLiveQuery(educationView);
  const retry = async () => {
    await educationCollection.utils.refetch({ throwOnError: true });
  };

  if (educationCollection.utils.isError || query.isError) {
    const error = educationCollection.utils.lastError ?? query.persistedError;
    return {
      status: "error",
      message:
        error instanceof ContentError
          ? error.message
          : GENERIC_CONTENT_ERROR_MESSAGE,
      retry,
    };
  }

  if (query.data?.[0]) {
    return {
      status: "ready",
      data: buildEducationView(query.data[0]),
      retry,
    };
  }

  return { status: "loading", retry };
}
