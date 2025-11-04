"use client";

import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from '@/lib/store';
import { startTaskEngine, stopTaskEngine } from '@/lib/store/taskEngine';

interface ReduxProviderProps {
  children: React.ReactNode;
}

function TaskEngineManager() {
  useEffect(() => {
    // ✅ FIXED: ReduxProvider no longer controls task engine
    // Task engine is controlled ONLY by taskWarmupService
    // This prevents double-start issues
    
    // Cleanup on unmount - stop engine if still running
    return () => {
      stopTaskEngine();
    };
  }, []);

  return null;
}

export function ReduxProvider({ children }: ReduxProviderProps) {
  return (
    <Provider store={store}>
      <TaskEngineManager />
      {children}
    </Provider>
  );
}
