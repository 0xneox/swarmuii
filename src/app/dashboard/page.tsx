"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function DashboardRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to the root page which contains the dashboard
    router.replace("/");
  }, [router]);

  // Show loading spinner while redirecting
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <LoadingSpinner size="lg" />
      <span className="ml-3 text-gray-400">Redirecting to dashboard...</span>
    </div>
  );
}
