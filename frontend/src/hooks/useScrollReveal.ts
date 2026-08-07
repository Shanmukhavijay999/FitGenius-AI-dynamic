"use client";

import { useEffect, useRef, RefObject } from "react";

interface UseScrollRevealOptions {
  threshold?: number;
  rootMargin?: string;
}

/**
 * Returns a ref to attach to any DOM element.
 * When the element enters the viewport, the "visible" class is added,
 * triggering CSS transitions defined in globals.css (.reveal, .reveal-scale, etc.)
 */
export function useScrollReveal<T extends HTMLElement>(
  options: UseScrollRevealOptions = {}
): RefObject<T | null> {
  const ref = useRef<T | null>(null);
  const { threshold = 0.15, rootMargin = "0px 0px -60px 0px" } = options;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          // Once revealed, no need to keep observing
          observer.unobserve(entry.target);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return ref;
}
