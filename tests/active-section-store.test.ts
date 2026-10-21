import { afterEach, describe, expect, it, vi } from "vite-plus/test";

import {
  getActiveSection,
  setActiveSection,
  subscribeToActiveSection,
} from "../src/active-section-store";

afterEach(() => {
  setActiveSection("hero");
});

describe("active section store", () => {
  it("can be read and subscribed to without React", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToActiveSection(listener);

    expect(getActiveSection()).toBe("hero");
    setActiveSection("skills");

    expect(getActiveSection()).toBe("skills");
    expect(listener).toHaveBeenCalledOnce();

    unsubscribe();
    setActiveSection("education");
    expect(listener).toHaveBeenCalledOnce();
  });
});
