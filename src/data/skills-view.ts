import { useLiveQuery } from "@tanstack/react-db";
import {
  ContentError,
  GENERIC_CONTENT_ERROR_MESSAGE,
  groupSkillsSection,
  type SkillGroup,
  type ViewState,
} from "./data-module";
import { useDataModule } from "./data-module-provider";

export function useSkillsSection(): ViewState<SkillGroup[]> {
  const {
    retrySkillsSection: retry,
    skillCategoriesCollection,
    skillsCollection,
    skillsSectionView,
  } = useDataModule();
  const query = useLiveQuery(skillsSectionView);

  if (
    skillCategoriesCollection.utils.isError ||
    skillsCollection.utils.isError ||
    query.isError
  ) {
    const error =
      skillCategoriesCollection.utils.lastError ??
      skillsCollection.utils.lastError ??
      query.persistedError;
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
    return { status: "ready", data: groupSkillsSection(query.data), retry };
  }

  return { status: "loading", retry };
}
