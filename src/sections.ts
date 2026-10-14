export const SECTION_IDS = [
  "hero",
  "about",
  "highlights",
  "skills",
  "experience",
  "education",
] as const;

export type SectionId = (typeof SECTION_IDS)[number];
