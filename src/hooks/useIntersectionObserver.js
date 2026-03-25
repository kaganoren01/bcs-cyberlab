import { useEffect, useRef, useState } from 'react';

/**
 * Returns a [ref, isVisible] pair. Once the element enters the viewport
 * it stays "visible" (one-shot), triggering entrance animations.
 */
export function useInView(options = {}) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.disconnect();
      }
    }, { threshold: 0.1, ...options });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, isVisible];
}
