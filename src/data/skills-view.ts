import { useLiveQuery } from "@tanstack/react-db";
import { useMemo } from "react";
import {
  createContentErrorState,
  groupSkillsSection,
  type SkillGroup,
  type ViewState,
} from "#/data/data-module";
import { useDataModule } from "#/data/data-module-provider";
import { useCollectionError } from "#/data/use-collection-error";

export function useSkillsSection(): ViewState<SkillGroup[]> {
  const {
    retrySkillsSection: retry,
    skillCategoriesCollection,
    skillsCollection,
    skillsSectionView,
  } = useDataModule();
  const collections = useMemo(
    () => [skillCategoriesCollection, skillsCollection],
    [skillCategoriesCollection, skillsCollection],
  );
  const collectionError = useCollectionError(collections);
  const query = useLiveQuery(skillsSectionView);

  if (
    collectionError ||
    skillCategoriesCollection.utils.isError ||
    skillsCollection.utils.isError ||
    query.isError
  ) {
    const error =
      skillCategoriesCollection.utils.lastError ??
      skillsCollection.utils.lastError ??
      query.persistedError;
    return createContentErrorState(
      error,
      [
        skillCategoriesCollection.utils.lastError,
        skillsCollection.utils.lastError,
      ],
      retry,
    );
  }

  if (query.data) {
    return { status: "ready", data: groupSkillsSection(query.data), retry };
  }

  return { status: "loading", retry };
}
