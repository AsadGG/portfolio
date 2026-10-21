import { useLiveQuery } from "@tanstack/react-db";
import { useMemo } from "react";

import {
  buildExperienceView,
  createContentErrorState,
  type ExperienceEngagement,
  type ViewState,
} from "#/data/data-module";
import { useDataModule } from "#/data/data-module-provider";
import { useCollectionError } from "#/data/use-collection-error";

export function useExperience(): ViewState<ExperienceEngagement[]> {
  const {
    engagementsCollection,
    projectsCollection,
    skillsCollection,
    experienceView,
    experienceSkillsView,
    retryExperience,
  } = useDataModule();
  const collections = useMemo(
    () => [engagementsCollection, projectsCollection, skillsCollection],
    [engagementsCollection, projectsCollection, skillsCollection],
  );
  const collectionError = useCollectionError(collections);
  const query = useLiveQuery(experienceView);
  const skillsQuery = useLiveQuery(experienceSkillsView);
  const retry = retryExperience;

  if (
    collectionError ||
    engagementsCollection.utils.isError ||
    projectsCollection.utils.isError ||
    skillsCollection.utils.isError ||
    query.isError ||
    skillsQuery.isError
  ) {
    const error =
      engagementsCollection.utils.lastError ??
      projectsCollection.utils.lastError ??
      skillsCollection.utils.lastError ??
      query.persistedError ??
      skillsQuery.persistedError;
    return createContentErrorState(
      error,
      [
        engagementsCollection.utils.lastError,
        projectsCollection.utils.lastError,
        skillsCollection.utils.lastError,
        query.persistedError,
        skillsQuery.persistedError,
      ],
      retry,
    );
  }

  if (query.data && skillsQuery.data) {
    return {
      status: "ready",
      data: buildExperienceView(query.data, skillsQuery.data),
      retry,
    };
  }

  return { status: "loading", retry };
}
