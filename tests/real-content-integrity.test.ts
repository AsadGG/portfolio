import { readFileSync } from "node:fs";
import { basename, join } from "node:path";

import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vite-plus/test";

import {
  checkReferenceIntegrity,
  createDataModule,
  educationSchema,
  engagementSchema,
  highlightSchema,
  profileSchema,
  projectSchema,
  skillCategorySchema,
  skillSchema,
} from "../src/data/data-module";

const contentDirectory = join(process.cwd(), "public", "content");
const documents = new Set([
  "profile.json",
  "highlights.json",
  "skill-categories.json",
  "skills.json",
  "engagements.json",
  "projects.json",
  "education.json",
]);

function createRealContentModule() {
  return createDataModule({
    baseUrl: "http://content.test/",
    fetch: async (input) => {
      const fileName = basename(
        input instanceof Request ? input.url : String(input),
      );
      if (!documents.has(fileName)) {
        return new Response("Not found", { status: 404 });
      }
      return new Response(readFileSync(join(contentDirectory, fileName)), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    },
    queryClient: new QueryClient(),
    retries: false,
  });
}

describe("real content integrity", () => {
  it("loads every content document through envelope validation and has no dangling references", async () => {
    const module = createRealContentModule();
    const [
      profile,
      highlights,
      skillCategories,
      skills,
      engagements,
      projects,
      education,
    ] = await Promise.all([
      module.fetchItemDocument("profile.json", profileSchema),
      module.fetchListDocument("highlights.json", highlightSchema),
      module.fetchListDocument("skill-categories.json", skillCategorySchema),
      module.fetchListDocument("skills.json", skillSchema),
      module.fetchListDocument("engagements.json", engagementSchema),
      module.fetchListDocument("projects.json", projectSchema),
      module.fetchItemDocument("education.json", educationSchema),
    ]);

    expect(profile.name).toBe("Asad Ur Rahman");
    expect(education.institution).toContain("University of Karachi");
    expect(
      checkReferenceIntegrity({
        highlights,
        skillCategories,
        skills,
        engagements,
        projects,
      }),
    ).toEqual([]);
  });
});
