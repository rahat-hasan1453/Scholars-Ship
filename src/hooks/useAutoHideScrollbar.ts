import { useEffect, useRef } from 'react';

/**
 * Attach the returned ref to a scrollable element that also has the `scrollbar-autohide` class:
 * its scrollbar shows only while the user scrolls and fades 0.8s after they stop.
 */
export function useAutoHideScrollbar<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onScroll = () => {
      el.classList.add('is-scrolling');
      clearTimeout(timer);
      timer = setTimeout(() => el.classList.remove('is-scrolling'), 800);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', onScroll);
      clearTimeout(timer);
    };
  }, []);

  return ref;
}
