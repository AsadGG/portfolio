import type { SectionId } from "#/sections";

let activeSection: SectionId = "hero";
const listeners = new Set<() => void>();

export function getActiveSection(): SectionId {
  return activeSection;
}

export function subscribeToActiveSection(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setActiveSection(section: SectionId) {
  if (activeSection === section) return;
  activeSection = section;
  for (const listener of listeners) listener();
}
