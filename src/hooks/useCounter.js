import { useEffect, useState, useRef } from 'react';

/**
 * Animates a number from 0 to `target` over `duration` ms.
 * Only starts counting once `enabled` flips to true.
 */
export function useCounter(target, duration = 1200, enabled = true) {
  const [count, setCount] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!enabled || typeof target !== 'number') return;

    const start = performance.now();
    const from = 0;

    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(from + (target - from) * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration, enabled]);

  return count;
}
