'use client';

import { useEffect } from 'react';

// Figma design canvas size
const DESIGN_WIDTH = 1728;
const DESIGN_HEIGHT = 1043;
// Below this width the responsive (tablet/mobile) layout takes over instead of scaling
const SCALE_BREAKPOINT = 1024;

function computeScale(): number {
  const { innerWidth: w, innerHeight: h } = window;
  if (w < SCALE_BREAKPOINT) return 1;
  const scale = Math.min(w / DESIGN_WIDTH, h / DESIGN_HEIGHT);
  // No lower limit: the whole shell shrinks proportionally so laptops keep the desktop layout
  return Math.min(1, scale);
}

// Shrinks the whole app shell proportionally on smaller screens so the layout
// matches the Figma design. Writes the value to the `--app-scale` CSS variable.
export function useDesignScale() {
  useEffect(() => {
    const root = document.documentElement;
    const update = () => root.style.setProperty('--app-scale', String(computeScale()));
    update();
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('resize', update);
      root.style.removeProperty('--app-scale');
    };
  }, []);
}
