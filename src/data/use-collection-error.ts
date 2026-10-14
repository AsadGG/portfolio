import { useCallback, useSyncExternalStore } from "react";

type StatusAwareCollection = {
  readonly status: string;
  on: (event: "status:change", callback: () => void) => () => void;
};

export function useCollectionError(
  collections: ReadonlyArray<StatusAwareCollection>,
): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const unsubscribe = collections.map((collection) =>
        collection.on("status:change", onChange),
      );
      return () => {
        for (const removeListener of unsubscribe) removeListener();
      };
    },
    [collections],
  );
  const getSnapshot = useCallback(
    () => collections.some((collection) => collection.status === "error"),
    [collections],
  );

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
