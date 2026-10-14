import { type ComponentProps, useLayoutEffect, useRef, useState } from "react";

type RevealState = "pending" | "waiting" | "visible" | "revealed";

export function SectionReveal({
  children,
  className,
  ...props
}: ComponentProps<"div">) {
  const elementRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<RevealState>("pending");

  useLayoutEffect(() => {
    const element = elementRef.current;
    if (!element) {
      setState("visible");
      return;
    }

    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      typeof IntersectionObserver === "undefined"
    ) {
      setState("visible");
      return;
    }

    const bounds = element.getBoundingClientRect();
    if (bounds.top < window.innerHeight && bounds.bottom > 0) {
      setState("visible");
      return;
    }

    setState("waiting");
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setState("revealed");
          observer.unobserve(element);
        }
      },
      { threshold: 0 },
    );
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      {...props}
      className={[
        className,
        state === "pending" || state === "waiting"
          ? "translate-y-3 opacity-0"
          : "translate-y-0 opacity-100",
        state === "revealed"
          ? "transition-[opacity,transform] duration-500 ease-out"
          : "transition-none",
        "motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none",
      ]
        .filter(Boolean)
        .join(" ")}
      ref={elementRef}
    >
      {children}
    </div>
  );
}
