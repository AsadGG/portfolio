import { useEffect } from "react";
import { setActiveSection } from "../active-section-store";
import { SECTION_IDS } from "../sections";

const READING_LINE = 64;

export function ActiveSectionTracker() {
  useEffect(() => {
    const targets = new Map<Element, (typeof SECTION_IDS)[number]>();
    const intersecting = new Set<Element>();
    let observer: IntersectionObserver;

    const trackSections = () => {
      for (const id of SECTION_IDS) {
        const section = document.querySelector(`[data-section="${id}"]`);
        if (!section || targets.has(section)) continue;
        targets.set(section, id);
        observer.observe(section);
      }
    };

    const updateActiveSection = () => {
      const visible = [...intersecting]
        .map((element) => {
          const bounds = element.getBoundingClientRect();
          return {
            id: targets.get(element),
            top: bounds.top,
            bottom: bounds.bottom,
          };
        })
        .filter((section) => section.id !== undefined);
      const reading =
        visible.find(
          (section) =>
            section.top <= READING_LINE && section.bottom > READING_LINE,
        ) ??
        visible.sort(
          (left, right) =>
            Math.max(0, READING_LINE - left.bottom, left.top - READING_LINE) -
            Math.max(0, READING_LINE - right.bottom, right.top - READING_LINE),
        )[0];

      if (
        window.scrollY + window.innerHeight >=
        document.documentElement.scrollHeight - 1
      ) {
        setActiveSection("education");
      } else if (reading?.id) {
        setActiveSection(reading.id);
      } else {
        const about = document.querySelector('[data-section="about"]');
        setActiveSection(
          !about || about.getBoundingClientRect().top > READING_LINE
            ? "hero"
            : "about",
        );
      }
    };

    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) intersecting.add(entry.target);
          else intersecting.delete(entry.target);
        }
        updateActiveSection();
      },
      { rootMargin: `-${READING_LINE}px 0px -70% 0px` },
    );

    const mutations = new MutationObserver(trackSections);
    mutations.observe(document.body, { childList: true, subtree: true });
    trackSections();

    return () => {
      mutations.disconnect();
      observer.disconnect();
    };
  }, []);

  return null;
}
