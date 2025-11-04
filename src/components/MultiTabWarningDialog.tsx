"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface MultiTabWarningDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchHere: () => void;
  userPlan?: string;
}

export function MultiTabWarningDialog({
  isOpen,
  onClose,
  onSwitchHere,
  userPlan = "free",
}: MultiTabWarningDialogProps) {
  const isPaidPlan = userPlan !== "free";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border border-red-500/50 text-white max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-red-500" />
            <DialogTitle className="text-xl font-bold text-red-400">
              Session Already Running
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-gray-300 leading-relaxed">
            This device is already running in another browser tab.
          </p>

          <div className="bg-red-950/30 border border-red-500/30 rounded-lg p-4">
            <p className="text-sm text-red-300 font-medium mb-2">
              ⚠️ Warning:
            </p>
            <p className="text-sm text-gray-400">
              If you continue here, the session in the other tab will stop and{" "}
              <span className="text-red-400 font-semibold">
                all unclaimed task rewards will be lost
              </span>
              .
            </p>
          </div>

          {!isPaidPlan && (
            <div className="bg-blue-950/30 border border-blue-500/30 rounded-lg p-4">
              <p className="text-sm text-blue-300 font-medium mb-2">
                💡 Want to run multiple devices?
              </p>
              <p className="text-sm text-gray-400 mb-3">
                Upgrade to a higher plan to gain access to multi-device support!
              </p>
              <Button
                onClick={() => {
                  if (typeof window !== "undefined") {
                    window.open("https://app.neurolov.ai/", "_blank");
                  }
                }}
                size="sm"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                Upgrade Plan
              </Button>
            </div>
          )}

          {isPaidPlan && (
            <div className="bg-green-950/30 border border-green-500/30 rounded-lg p-4">
              <p className="text-sm text-green-300 font-medium mb-2">
                ✅ Multi-device support available
              </p>
              <p className="text-sm text-gray-400">
                You can run a different device from the dropdown menu instead!
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            onClick={onClose}
            variant="outline"
            className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              onSwitchHere();
              onClose();
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Okay, Switch Here
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
