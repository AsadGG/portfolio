import { useLiveQuery } from "@tanstack/react-db";
import { profileSchema } from "./data-module";
import { useDataModule } from "./data-module-provider";

export function useProfile() {
  const { profileView } = useDataModule();
  const profile = useLiveQuery(profileView);
  const record = profile.data?.[0];
  return record ? profileSchema.parse(record) : undefined;
}
