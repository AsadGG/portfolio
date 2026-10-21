import { useLiveQuery } from "@tanstack/react-db";

import {
  ContentError,
  GENERIC_CONTENT_ERROR_MESSAGE,
  type ViewState,
} from "#/data/data-module";
import { useDataModule } from "#/data/data-module-provider";

export function useIntro(): ViewState<string> {
  const dataModule = useDataModule();
  const {
    engagementsCollection,
    engagementsView,
    profileCollection,
    profileView,
  } = dataModule;
  const profileQuery = useLiveQuery(profileView);
  const engagementQuery = useLiveQuery(engagementsView);
  const failedCollections = [
    ...(profileCollection.utils.isError || profileQuery.isError
      ? [profileCollection]
      : []),
    ...(engagementsCollection.utils.isError || engagementQuery.isError
      ? [engagementsCollection]
      : []),
  ];
  const retry = async () => {
    await Promise.all(
      failedCollections.map((collection) =>
        collection.utils.refetch({ throwOnError: true }),
      ),
    );
  };

  if (
    profileCollection.utils.isError ||
    profileQuery.isError ||
    engagementsCollection.utils.isError ||
    engagementQuery.isError
  ) {
    const error =
      profileCollection.utils.lastError ??
      engagementsCollection.utils.lastError ??
      profileQuery.persistedError ??
      engagementQuery.persistedError;
    return {
      status: "error",
      message:
        error instanceof ContentError
          ? error.message
          : GENERIC_CONTENT_ERROR_MESSAGE,
      retry,
    };
  }

  const profile = profileQuery.data?.[0];
  const engagements = engagementQuery.data;
  if (profile && engagements) {
    if (profile.intro.includes("{years}") && engagements.length === 0) {
      return {
        status: "error",
        message: GENERIC_CONTENT_ERROR_MESSAGE,
        retry: async () => {
          await engagementsCollection.utils.refetch({ throwOnError: true });
        },
      };
    }
    return {
      status: "ready",
      data: dataModule.resolveIntro(profile.intro, engagements),
      retry,
    };
  }

  return { status: "loading", retry };
}
