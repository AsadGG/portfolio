import { useLiveQuery } from "@tanstack/react-db";
import {
  ContentError,
  GENERIC_CONTENT_ERROR_MESSAGE,
  type Profile,
  profileSchema,
  type ViewState,
} from "./data-module";
import { useDataModule } from "./data-module-provider";

export function useProfile(): ViewState<Profile> {
  const { profileCollection, profileView } = useDataModule();
  const query = useLiveQuery(profileView);
  const record = query.data?.[0];
  const retry = async () => {
    await profileCollection.utils.refetch({ throwOnError: true });
  };

  if (profileCollection.utils.isError || query.isError) {
    const error = profileCollection.utils.lastError ?? query.persistedError;
    return {
      status: "error",
      message:
        error instanceof ContentError
          ? error.message
          : GENERIC_CONTENT_ERROR_MESSAGE,
      retry,
    };
  }

  if (record) {
    return { status: "ready", data: profileSchema.parse(record), retry };
  }

  return { status: "loading", retry };
}
