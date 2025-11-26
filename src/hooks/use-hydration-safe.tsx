import { useEffect, useState } from 'react';

/**
 * Hook to safely handle client-side only operations that might cause hydration mismatches
 * Returns true only after the component has mounted on the client side
 */
export function useHydrationSafe() {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  return isHydrated;
}

/**
 * Hook to safely access window object without causing hydration issues
 * Returns null during SSR and initial render, actual value after hydration
 */
export function useWindowSafe() {
  const [windowObj, setWindowObj] = useState<Window | null>(null);
  const isHydrated = useHydrationSafe();

  useEffect(() => {
    if (isHydrated) {
      setWindowObj(window);
    }
  }, [isHydrated]);

  return windowObj;
}

/**
 * Hook to safely access document object without causing hydration issues
 * Returns null during SSR and initial render, actual value after hydration
 */
export function useDocumentSafe() {
  const [documentObj, setDocumentObj] = useState<Document | null>(null);
  const isHydrated = useHydrationSafe();

  useEffect(() => {
    if (isHydrated) {
      setDocumentObj(document);
    }
  }, [isHydrated]);

  return documentObj;
}

/**
 * Hook to safely access navigator object without causing hydration issues
 * Returns null during SSR and initial render, actual value after hydration
 */
export function useNavigatorSafe() {
  const [navigatorObj, setNavigatorObj] = useState<Navigator | null>(null);
  const isHydrated = useHydrationSafe();

  useEffect(() => {
    if (isHydrated) {
      setNavigatorObj(navigator);
    }
  }, [isHydrated]);

  return navigatorObj;
}
