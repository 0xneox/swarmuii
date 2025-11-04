import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { NodeState, HardwareInfo } from '../types';
import { STORAGE_KEYS, logger } from '../config';

// Initial state
const initialState: NodeState = {
  nodeId: null,
  isActive: false,
  isRegistered: false,
  hardwareInfo: null,
  startTime: null,
  lastActiveTime: null,
  totalUptime: 0,
  currentSessionStart: null,
};

// Load state from localStorage
const loadNodeState = (): NodeState => {
  if (typeof window === 'undefined') return initialState;
  
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.NODE_STATE);
    if (saved) {
      const parsed = JSON.parse(saved);
      
      // ✅ CRITICAL FIX: Always set isActive to false on load
      // Node should only be active if user explicitly starts it
      // Previous session may have expired or browser closed while node was running
      return {
        ...parsed,
        isActive: false, // Always inactive on app load
        startTime: null,
        currentSessionStart: null,
      };
    }
  } catch (error) {
    logger.error('Failed to load node state', error);
  }
  
  return initialState;
};

// Save state to localStorage
const saveNodeState = (state: NodeState) => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEYS.NODE_STATE, JSON.stringify(state));
  } catch (error) {
    logger.error('Failed to save node state', error);
  }
};

const nodeSlice = createSlice({
  name: 'node',
  initialState: loadNodeState(),
  reducers: {
    registerDevice: (state, action: PayloadAction<HardwareInfo>) => {
      state.hardwareInfo = action.payload;
      state.isRegistered = true;
      state.nodeId = `node_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      logger.log(`Device registered with tier: ${action.payload.rewardTier}`);
      saveNodeState(state);
    },
    
    startNode: (state) => {
      if (!state.isRegistered || !state.hardwareInfo) {
        logger.error('Cannot start node: Device not registered');
        return;
      }
      
      const now = new Date().toISOString();
      state.isActive = true;
      state.startTime = now; // Reset start time for new session
      state.currentSessionStart = now;
      state.lastActiveTime = now;
      
      // CRITICAL FIX: Reset totalUptime to 0 for countdown system
      // We track remaining time, not accumulated time
      state.totalUptime = 0;
      
      logger.log(`Node started: ${state.nodeId}`);
      saveNodeState(state);
    },
    
    stopNode: (state) => {
      if (!state.isActive) return;
      
      // For countdown system, we don't accumulate totalUptime
      // The remaining time is tracked in the database and synced before stopping
      
      state.isActive = false;
      state.currentSessionStart = null;
      state.lastActiveTime = new Date().toISOString();
      state.totalUptime = 0; // Reset for next session
      
      logger.log(`Node stopped`);
      saveNodeState(state);
    },
    
    updateUptime: (state) => {
      if (!state.isActive || !state.currentSessionStart) return;
      
      const now = Date.now();
      const sessionStart = new Date(state.currentSessionStart).getTime();
      const sessionUptime = Math.floor((now - sessionStart) / 1000);
      
      // Update last active time
      state.lastActiveTime = new Date().toISOString();
      
      // Don't modify totalUptime here, it's calculated on stop
      saveNodeState(state);
    },
    
    resetNode: (state) => {
      Object.assign(state, initialState);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEYS.NODE_STATE);
      }
      logger.log('Node reset');
    }
  }
});

export const { registerDevice, startNode, stopNode, updateUptime, resetNode } = nodeSlice.actions;

// Selectors
export const selectCurrentUptime = (state: { node: NodeState }): number => {
  const { node } = state;
  if (!node.isActive || !node.currentSessionStart) {
    return 0; // Not running, return 0
  }
  
  // For countdown system: only return current session elapsed time
  // Don't add totalUptime (always 0 in countdown system)
  const now = Date.now();
  const sessionStart = new Date(node.currentSessionStart).getTime();
  const sessionUptime = Math.floor((now - sessionStart) / 1000);
  
  return sessionUptime; // Only current session time
};

export const selectNode = (state: { node: NodeState }) => state.node;
export const selectNodeIsActive = (state: { node: NodeState }) => state.node.isActive;
export const selectNodeIsRegistered = (state: { node: NodeState }) => state.node.isRegistered;
export const selectNodeHardwareInfo = (state: { node: NodeState }) => state.node.hardwareInfo;

export default nodeSlice.reducer;
