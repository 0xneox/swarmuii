"use client";

/**
 * Backend Connection Test Page
 * Comprehensive testing of all API integrations
 */

import { useState } from 'react';
import { BackendHealthCheck } from '@/components/BackendHealthCheck';
import { CheckCircle, XCircle, Loader2, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  authService,
  deviceService,
  sessionService,
  taskService,
  earningsService,
  analyticsService,
} from '@/lib/api';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message?: string;
  duration?: number;
}

export default function TestBackendConnectionPage() {
  const [tests, setTests] = useState<TestResult[]>([
    { name: '1. Health Check', status: 'pending' },
    { name: '2. User Signup', status: 'pending' },
    { name: '3. User Login', status: 'pending' },
    { name: '4. Get Profile', status: 'pending' },
    { name: '5. Register Device', status: 'pending' },
    { name: '6. List Devices', status: 'pending' },
    { name: '7. Start Session', status: 'pending' },
    { name: '8. Verify Session', status: 'pending' },
    { name: '9. Stop Session', status: 'pending' },
    { name: '10. Complete Task', status: 'pending' },
    { name: '11. Get Earnings', status: 'pending' },
    { name: '12. Claim Rewards', status: 'pending' },
    { name: '13. Analytics Dashboard', status: 'pending' },
  ]);

  const [isRunning, setIsRunning] = useState(false);
  const [testData, setTestData] = useState<any>({});

  const updateTest = (index: number, updates: Partial<TestResult>) => {
    setTests((prev) =>
      prev.map((test, i) => (i === index ? { ...test, ...updates } : test))
    );
  };

  const runAllTests = async () => {
    setIsRunning(true);
    const email = `test_${Date.now()}@example.com`;
    const username = `test_${Date.now()}`;
    const password = 'Test123456';

    try {
      // Test 1: Health Check
      updateTest(0, { status: 'running' });
      const healthStart = Date.now();
      const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || '';
      const healthRes = await fetch(`${baseUrl}/health`);
      const healthData = await healthRes.json();
      updateTest(0, {
        status: 'success',
        message: `v${healthData.version}`,
        duration: Date.now() - healthStart,
      });

      // Test 2: Signup (direct API call, bypass AuthContext)
      updateTest(1, { status: 'running' });
      const signupStart = Date.now();
      const signupResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, password }),
      });
      const signupData = await signupResponse.json();
      if (!signupResponse.ok) throw new Error(signupData.message || 'Signup failed');
      
      // Store token manually for subsequent tests
      localStorage.setItem('token', signupData.data.token);
      localStorage.setItem('user', JSON.stringify(signupData.data.user));
      
      setTestData((prev: any) => ({ ...prev, user: signupData.data.user, token: signupData.data.token }));
      updateTest(1, {
        status: 'success',
        message: `User: ${signupData.data.user.username}`,
        duration: Date.now() - signupStart,
      });

      // Test 3: Login (direct API call, bypass AuthContext)
      updateTest(2, { status: 'running' });
      // Clear storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      const loginStart = Date.now();
      const loginResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const loginData = await loginResponse.json();
      if (!loginResponse.ok) throw new Error(loginData.message || 'Login failed');
      
      // Store token manually
      localStorage.setItem('token', loginData.data.token);
      localStorage.setItem('user', JSON.stringify(loginData.data.user));
      
      updateTest(2, {
        status: 'success',
        message: `Token received`,
        duration: Date.now() - loginStart,
      });

      // Test 4: Get Profile
      updateTest(3, { status: 'running' });
      const profileStart = Date.now();
      const profile = await authService.getProfile();
      updateTest(3, {
        status: 'success',
        message: `Email: ${profile.email}`,
        duration: Date.now() - profileStart,
      });

      // Test 5: Register Device
      updateTest(4, { status: 'running' });
      const deviceStart = Date.now();
      const device = await deviceService.registerDevice({
        device_name: `Test Device ${Date.now()}`,
        hardware_fingerprint: `fp_${Date.now()}`,
        hardware_tier: 'webgpu',
        cpu_info: { cores: 8, model: 'Test CPU' },
        gpu_info: { model: 'Test GPU' },
        memory_gb: 16,
      });
      setTestData((prev: any) => ({ ...prev, device }));
      updateTest(4, {
        status: 'success',
        message: `Device ID: ${device.id.slice(0, 8)}...`,
        duration: Date.now() - deviceStart,
      });

      // Test 6: List Devices
      updateTest(5, { status: 'running' });
      const listStart = Date.now();
      const devices = await deviceService.getDevices();
      updateTest(5, {
        status: 'success',
        message: `Found ${devices.length} device(s)`,
        duration: Date.now() - listStart,
      });

      // Test 7: Start Session
      updateTest(6, { status: 'running' });
      const sessionStart = Date.now();
      const session = await sessionService.startSession({ device_id: device.id });
      setTestData((prev: any) => ({ ...prev, session }));
      updateTest(6, {
        status: 'success',
        message: `Session: ${session.id.slice(0, 8)}...`,
        duration: Date.now() - sessionStart,
      });

      // Test 8: Verify Session
      updateTest(7, { status: 'running' });
      const verifyStart = Date.now();
      const verified = await sessionService.verifySession(device.id);
      updateTest(7, {
        status: 'success',
        message: `Valid: ${verified.valid}`,
        duration: Date.now() - verifyStart,
      });

      // Test 9: Stop Session
      updateTest(8, { status: 'running' });
      const stopStart = Date.now();
      await sessionService.stopSession({
        device_id: device.id,
        session_token: session.session_token,
      });
      updateTest(8, {
        status: 'success',
        message: 'Session stopped',
        duration: Date.now() - stopStart,
      });

      // Test 10: Complete Task
      updateTest(9, { status: 'running' });
      const taskStart = Date.now();
      const taskResult = await taskService.completeTask({
        task_id: `task_${Date.now()}`,
        task_type: 'image',
        reward_amount: 50,
      });
      updateTest(9, {
        status: 'success',
        message: `Earned ${taskResult.unclaimed_reward} SP`,
        duration: Date.now() - taskStart,
      });

      // Test 11: Get Earnings
      updateTest(10, { status: 'running' });
      const earningsStart = Date.now();
      const earnings = await earningsService.getEarnings();
      updateTest(10, {
        status: 'success',
        message: `Unclaimed: ${earnings.total_unclaimed_reward} SP`,
        duration: Date.now() - earningsStart,
      });

      // Test 12: Claim Rewards
      updateTest(11, { status: 'running' });
      const claimStart = Date.now();
      const claimed = await earningsService.claimRewards();
      updateTest(11, {
        status: 'success',
        message: `Claimed ${claimed.claimed_amount} SP`,
        duration: Date.now() - claimStart,
      });

      // Test 13: Analytics Dashboard
      updateTest(12, { status: 'running' });
      const analyticsStart = Date.now();
      const dashboard = await analyticsService.getDashboard();
      updateTest(12, {
        status: 'success',
        message: `Tasks: ${dashboard.activity.tasksCompleted}`,
        duration: Date.now() - analyticsStart,
      });

      toast.success('All tests passed! 🎉');
    } catch (error: any) {
      const currentTest = tests.findIndex((t) => t.status === 'running');
      if (currentTest !== -1) {
        updateTest(currentTest, {
          status: 'error',
          message: error.message || 'Test failed',
        });
      }
      toast.error(`Test failed: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const resetTests = () => {
    setTests(
      tests.map((test) => ({
        ...test,
        status: 'pending',
        message: undefined,
        duration: undefined,
      }))
    );
    setTestData({});
  };

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Backend Connection Test</h1>
        <p className="text-muted-foreground">
          Verify all API integrations are working correctly
        </p>
      </div>

      <BackendHealthCheck />

      <div className="space-y-4">
        <div className="flex gap-3">
          <Button onClick={runAllTests} disabled={isRunning} className="flex items-center gap-2">
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Running Tests...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Run All Tests
              </>
            )}
          </Button>
          <Button onClick={resetTests} variant="outline" disabled={isRunning}>
            Reset
          </Button>
        </div>

        <div className="space-y-2">
          {tests.map((test, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 rounded-lg border bg-card"
            >
              {test.status === 'pending' && (
                <div className="h-5 w-5 rounded-full border-2 border-muted" />
              )}
              {test.status === 'running' && <Loader2 className="h-5 w-5 animate-spin text-blue-500" />}
              {test.status === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
              {test.status === 'error' && <XCircle className="h-5 w-5 text-red-500" />}

              <div className="flex-1">
                <p className="text-sm font-medium">{test.name}</p>
                {test.message && (
                  <p className="text-xs text-muted-foreground">{test.message}</p>
                )}
              </div>

              {test.duration && (
                <span className="text-xs text-muted-foreground">{test.duration}ms</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {Object.keys(testData).length > 0 && (
        <div className="p-4 rounded-lg border bg-card space-y-2">
          <h3 className="font-medium">Test Data (for debugging)</h3>
          <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-64">
            {JSON.stringify(testData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
