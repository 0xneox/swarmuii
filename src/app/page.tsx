"use client";

import { Suspense, useEffect } from "react";
import { NetworkStats } from "@/components/NetworkStats";
import { NodeControlPanel } from "@/components/NodeControlPanel";
import { TaskPipeline } from "@/components/TaskPipeline";
// TODO: Removed AuthGuard - no longer needed
import { HowItWorks } from "@/components/HowItWorks";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
// TODO: Replace with new auth system
import { usePageAnalytics } from "@/hooks/useAnalytics";

export default function Dashboard() {
  // TODO: Replace with new auth system
  const isLoggedIn = false;
  const { trackEvent } = usePageAnalytics("Dashboard", {
    user_logged_in: isLoggedIn,
  });

  // Track dashboard interactions
  useEffect(() => {
    if (isLoggedIn) {
      trackEvent("dashboard_view", "user_engagement", "logged_in_user");
    } else {
      trackEvent("dashboard_view", "user_engagement", "anonymous_user");
    }
  }, [isLoggedIn, trackEvent]);

  return (
    <div className="flex flex-col gap-6">
      {/* Public Network Stats - Always visible */}
      <Suspense fallback={<LoadingSpinner />}>
        <NetworkStats />
      </Suspense>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Node Control Panel */}
        <div>
          <Suspense fallback={<LoadingSpinner />}>
            <NodeControlPanel />
          </Suspense>
        </div>

        {/* Task Pipeline */}
        <div>
          <Suspense fallback={<LoadingSpinner />}>
            <TaskPipeline />
          </Suspense>
        </div>
      </div>

      {/* How It Works section - always shown since auth is disabled */}
      <div className="mt-8">
        <HowItWorks />
      </div>
    </div>
  );
}
