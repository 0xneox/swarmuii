import { Suspense } from "react";
import { GlobalStatistics } from "@/components/GlobalStatistics";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { AuthGuard } from "@/components/AuthGuard";

export default function GlobalStatisticsPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen ">
        <Suspense fallback={<LoadingSpinner />}>
          <GlobalStatistics />
        </Suspense>
      </div>
    </AuthGuard>

  );
}
