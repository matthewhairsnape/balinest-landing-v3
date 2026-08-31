import { useEffect } from "react";
import { useLocation } from "wouter";
import { trackGa4PageView } from "@/lib/analytics";

/** Sends GA4 page_view on wouter route changes (including first paint). */
export function Ga4PageViewTracker() {
  const [location] = useLocation();

  useEffect(() => {
    trackGa4PageView(location + window.location.search);
  }, [location]);

  return null;
}
