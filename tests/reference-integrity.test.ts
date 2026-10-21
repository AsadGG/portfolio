import { describe, expect, it } from "vite-plus/test";

import {
  checkReferenceIntegrity,
  type Project,
  type ReferenceIntegrityContent,
} from "../src/data/data-module";

const validContent: ReferenceIntegrityContent = {
  highlights: [{ id: "highlight", title: "Highlight", text: "Text." }],
  skillCategories: [{ id: "engineering", name: "Engineering" }],
  skills: [
    {
      id: "typescript",
      name: "TypeScript",
      categoryId: "engineering",
      listed: true,
    },
  ],
  engagements: [
    {
      id: "employment",
      kind: "employment",
      companyName: "Company",
      start: "2024-01",
    },
    { id: "freelance", kind: "freelance", start: "2025-01" },
  ],
  projects: [
    {
      id: "project",
      engagementId: "employment",
      name: "Project",
      summary: "Summary.",
      description: "Description.",
      skillIds: ["typescript"],
      images: [],
      parts: [],
    },
  ],
};

describe("reference integrity check", () => {
  it("reports a Project whose Engagement does not exist", () => {
    const problems = checkReferenceIntegrity({
      ...validContent,
      projects: [{ ...validContent.projects[0], engagementId: "missing" }],
    });

    expect(problems).toHaveLength(1);
    expect(problems[0].message).toContain("project");
    expect(problems[0].message).toContain("engagementId");
  });

  it("reports missing Skills referenced by a Project or Part", () => {
    const project = {
      ...validContent.projects[0],
      skillIds: ["missing-project-skill"],
      parts: [
        {
          id: "part",
          name: "Part",
          summary: "Summary.",
          description: "Description.",
          skillIds: ["missing-part-skill"],
          images: [],
        },
      ],
    };
    const problems = checkReferenceIntegrity({
      ...validContent,
      projects: [project],
    });

    expect(problems).toHaveLength(2);
    expect(problems.map(({ message }) => message)).toEqual([
      expect.stringContaining("project"),
      expect.stringContaining("part"),
    ]);
  });

  it("reports a Skill whose category does not exist", () => {
    const problems = checkReferenceIntegrity({
      ...validContent,
      skills: [{ ...validContent.skills[0], categoryId: "missing-category" }],
    });

    expect(problems).toHaveLength(1);
    expect(problems[0].message).toContain("typescript");
    expect(problems[0].message).toContain("categoryId");
  });

  it("reports duplicate ids in a list document", () => {
    const problems = checkReferenceIntegrity({
      ...validContent,
      highlights: [
        validContent.highlights[0],
        { ...validContent.highlights[0], title: "Duplicate" },
      ],
    });

    expect(problems).toHaveLength(1);
    expect(problems[0].message).toContain("highlights.json");
    expect(problems[0].message).toContain("highlight");
  });

  it("reports duplicate Part ids within a Project", () => {
    const part = {
      id: "repeated-part",
      name: "Part",
      summary: "Summary.",
      description: "Description.",
      skillIds: [],
      images: [],
    };
    const problems = checkReferenceIntegrity({
      ...validContent,
      projects: [
        {
          ...validContent.projects[0],
          parts: [part, { ...part, name: "Another Part" }],
        },
      ],
    });

    expect(problems).toHaveLength(1);
    expect(problems[0].message).toContain("repeated-part");
    expect(problems[0].message).toContain("project");
  });

  it("reports a Client on a non-Freelance Project", () => {
    const problems = checkReferenceIntegrity({
      ...validContent,
      projects: [{ ...validContent.projects[0], clientName: "Client" }],
    });

    expect(problems).toHaveLength(1);
    expect(problems[0].message).toContain("project");
    expect(problems[0].message).toContain("clientName");
  });

  it("reports more than one Freelance Engagement", () => {
    const problems = checkReferenceIntegrity({
      ...validContent,
      engagements: [
        ...validContent.engagements,
        { id: "another-freelance", kind: "freelance", start: "2026-01" },
      ],
    });

    expect(problems).toHaveLength(1);
    expect(problems[0].message).toContain("another-freelance");
    expect(problems[0].message).toContain("freelance");
  });

  it("reports a Project without Parts or a Description", () => {
    const project = {
      ...validContent.projects[0],
      description: undefined,
    } as unknown as Project;
    const problems = checkReferenceIntegrity({
      ...validContent,
      projects: [project],
    });

    expect(problems).toHaveLength(1);
    expect(problems[0].message).toContain("project");
    expect(problems[0].message).toContain("description");
  });
});
