"use client";

import { Suspense, useEffect } from "react";
import { GlobalStatistics } from "@/components/GlobalStatistics";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
// TODO: Removed AuthGuard - no longer needed
import { usePageAnalytics } from "@/hooks/useAnalytics";

export default function GlobalStatisticsPage() {
  const { trackEvent } = usePageAnalytics("Global Statistics");

  // Track global statistics page view
  useEffect(() => {
    trackEvent("global_stats_view", "user_engagement", "global_statistics");
  }, [trackEvent]);

  return (
    <div className="min-h-screen">
      <Suspense fallback={<LoadingSpinner />}>
        <GlobalStatistics />
      </Suspense>
    </div>
  );
}
