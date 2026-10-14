import { useSyncExternalStore } from "react";
import {
  getActiveSection,
  subscribeToActiveSection,
} from "./active-section-store";
import type { SectionId } from "./sections";

export function useActiveSection(): SectionId {
  return useSyncExternalStore(
    subscribeToActiveSection,
    getActiveSection,
    getActiveSection,
  );
}
