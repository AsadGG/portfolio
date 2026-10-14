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
  const {
    engagementsCollection,
    projectsCollection,
    skillsCollection,
    experienceView,
    experienceSkillsView,
    retryExperience,
  } = useDataModule();
  const query = useLiveQuery(experienceView);
  const skillsQuery = useLiveQuery(experienceSkillsView);
  const retry = retryExperience;

  if (
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
    return {
      status: "error",
      message:
        error instanceof ContentError
          ? error.message
          : GENERIC_CONTENT_ERROR_MESSAGE,
      retry,
    };
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
