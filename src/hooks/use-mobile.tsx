import * as React from "react";
import { useHydrationSafe } from "./use-hydration-safe";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(false);
  const isHydrated = useHydrationSafe();

  React.useEffect(() => {
    if (!isHydrated) return;

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    
    // Set initial value
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    
    // Add listener
    mql.addEventListener("change", onChange);
    
    return () => mql.removeEventListener("change", onChange);
  }, [isHydrated]);

  // Return false during SSR and initial render to prevent hydration mismatch
  if (!isHydrated) {
    return false;
  }

  return isMobile;
}
