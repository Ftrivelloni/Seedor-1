'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function DiagnosticPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDiagnosticData() {
      try {
        console.log('🔍 Starting diagnostic...');
        
        // Get current session
        const { data: session, error: sessionError } = await supabase.auth.getSession();
        
        const diagnosticData = {
          timestamp: new Date().toISOString(),
          session: {
            exists: !!session?.session,
            user: session?.session?.user ? {
              id: session.session.user.id,
              email: session.session.user.email,
              created_at: session.session.user.created_at
            } : null,
            error: sessionError
          },
          workers: { data: [], error: null, attempted: false },
          tenants: { data: [], error: null, attempted: false }
        };

        // Try to fetch workers
        try {
          console.log('🔍 Attempting to fetch workers...');
          const { data: workers, error: workersError } = await supabase
            .from('workers')
            .select('*');
          
          diagnosticData.workers = {
            data: workers || [],
            error: workersError,
            attempted: true
          };
          
          console.log('🔍 Workers query result:', { workers, workersError });
        } catch (workersErr) {
          console.error('🔍 Workers query failed:', workersErr);
          diagnosticData.workers = {
            data: [],
            error: workersErr,
            attempted: true
          };
        }

        // Try to fetch tenants
        try {
          console.log('🔍 Attempting to fetch tenants...');
          const { data: tenants, error: tenantsError } = await supabase
            .from('tenants')
            .select('*');
          
          diagnosticData.tenants = {
            data: tenants || [],
            error: tenantsError,
            attempted: true
          };
          
          console.log('🔍 Tenants query result:', { tenants, tenantsError });
        } catch (tenantsErr) {
          console.error('🔍 Tenants query failed:', tenantsErr);
          diagnosticData.tenants = {
            data: [],
            error: tenantsErr,
            attempted: true
          };
        }

        setData(diagnosticData);
        console.log('🔍 Complete diagnostic data:', diagnosticData);
        
      } catch (err: any) {
        console.error('🔍 Diagnostic failed:', err);
        setError(err.message || 'Diagnostic failed');
      } finally {
        setLoading(false);
      }
    }

    fetchDiagnosticData();
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Database Diagnostic</h1>
        <p>Loading diagnostic information...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Database Diagnostic</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Error:</strong> {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Database Diagnostic Results</h1>
      
      <div className="space-y-6">
        {/* Session Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-3">🔐 Session Information</h2>
          <div className="space-y-2 text-sm">
            <p><strong>Session exists:</strong> {data?.session?.exists ? '✅ Yes' : '❌ No'}</p>
            {data?.session?.user && (
              <div>
                <p><strong>User ID:</strong> {data.session.user.id}</p>
                <p><strong>Email:</strong> {data.session.user.email}</p>
                <p><strong>Created:</strong> {data.session.user.created_at}</p>
              </div>
            )}
            {data?.session?.error && (
              <p className="text-red-600"><strong>Session Error:</strong> {JSON.stringify(data.session.error)}</p>
            )}
          </div>
        </div>

        {/* Workers Info */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-3">👥 Workers Table</h2>
          <div className="space-y-2 text-sm">
            <p><strong>Query attempted:</strong> {data?.workers?.attempted ? '✅ Yes' : '❌ No'}</p>
            <p><strong>Total workers:</strong> {data?.workers?.data?.length || 0}</p>
            
            {data?.workers?.error && (
              <div className="text-red-600">
                <p><strong>Error:</strong> {data.workers.error.message || 'Unknown error'}</p>
                <p><strong>Code:</strong> {data.workers.error.code}</p>
              </div>
            )}
            
            {data?.workers?.data && data.workers.data.length > 0 && (
              <div>
                <p className="font-medium">Workers found:</p>
                <div className="max-h-40 overflow-y-auto">
                  {data.workers.data.map((worker: any, index: number) => (
                    <div key={index} className="border-l-2 border-gray-300 pl-2 my-2">
                      <p><strong>Email:</strong> {worker.email}</p>
                      <p><strong>Membership ID:</strong> {worker.membership_id || 'None'}</p>
                      <p><strong>Status:</strong> {worker.status}</p>
                      <p><strong>Area:</strong> {worker.area_module}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tenants Info */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-3">🏢 Tenants Table</h2>
          <div className="space-y-2 text-sm">
            <p><strong>Query attempted:</strong> {data?.tenants?.attempted ? '✅ Yes' : '❌ No'}</p>
            <p><strong>Total tenants:</strong> {data?.tenants?.data?.length || 0}</p>
            
            {data?.tenants?.error && (
              <div className="text-red-600">
                <p><strong>Error:</strong> {data.tenants.error.message || 'Unknown error'}</p>
                <p><strong>Code:</strong> {data.tenants.error.code}</p>
              </div>
            )}
            
            {data?.tenants?.data && data.tenants.data.length > 0 && (
              <div>
                <p className="font-medium">Tenants found:</p>
                <div className="max-h-40 overflow-y-auto">
                  {data.tenants.data.map((tenant: any, index: number) => (
                    <div key={index} className="border-l-2 border-gray-300 pl-2 my-2">
                      <p><strong>Name:</strong> {tenant.name}</p>
                      <p><strong>Plan:</strong> {tenant.plan}</p>
                      <p><strong>Created by:</strong> {tenant.created_by}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Raw Data */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-3">📊 Raw Diagnostic Data</h2>
          <pre className="text-xs bg-white p-3 rounded border overflow-auto max-h-96">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      </div>

      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-semibold text-yellow-800 mb-2">🔧 Next Steps</h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• Check the browser console for detailed logs</li>
          <li>• Share this diagnostic information to help resolve the issue</li>
          <li>• If you see workers but no matching membership_id, we can fix that</li>
        </ul>
      </div>
    </div>
  );
}