"use client";

import { useState, useEffect } from "react";
import { authService } from "../../lib/supabaseAuth";
import { supabase } from "../../lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";

export default function DebugPage() {
  const [authUser, setAuthUser] = useState<any>(null);
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [tenants, setTenants] = useState<any[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDebugInfo();
  }, []);

  const loadDebugInfo = async () => {
    try {
      // Check current session
      const { data: session } = await supabase.auth.getSession();
      setSessionUser(session?.session?.user || null);

      // Check auth service user
      const currentUser = await authService.checkSession();
      setAuthUser(currentUser);

      // Load tenants
      const { data: tenantsData } = await supabase
        .from('tenants')
        .select('*')
        .order('created_at', { ascending: false });
      setTenants(tenantsData || []);

      // Load workers
      const { data: workersData } = await supabase
        .from('workers')
        .select('*, tenant:tenants(*)')
        .order('created_at', { ascending: false });
      setWorkers(workersData || []);

    } catch (error) {
      console.error('Debug load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const testLogin = async () => {
    if (workers.length > 0) {
      const worker = workers[0];
      console.log('Testing login with:', worker.email);
      
      const result = await authService.login(worker.email, 'password123');
      console.log('Login result:', result);
      
      if (result.user) {
        setAuthUser(result.user);
      }
    }
  };

  if (loading) {
    return <div className="p-8">Loading debug info...</div>;
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Debug Information</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Supabase Session User</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(sessionUser, null, 2)}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Auth Service User</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(authUser, null, 2)}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tenants ({tenants.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto max-h-40">
              {JSON.stringify(tenants, null, 2)}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Workers ({workers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto max-h-40">
              {JSON.stringify(workers, null, 2)}
            </pre>
            {workers.length > 0 && (
              <Button onClick={testLogin} className="mt-4">
                Test Login with First Worker
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button onClick={loadDebugInfo} variant="outline">
            Refresh Debug Info
          </Button>
          <Button 
            onClick={() => window.location.href = '/register-tenant'} 
            variant="outline"
          >
            Create New Tenant
          </Button>
          <Button 
            onClick={() => window.location.href = '/login'} 
            variant="outline"
          >
            Go to Login
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}