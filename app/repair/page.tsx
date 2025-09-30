'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function RepairPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const createMissingWorkerProfile = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('🔧 Starting worker profile repair...');

      // Get current session
      const { data: session, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.session?.user) {
        throw new Error('No authenticated user found');
      }

      const user = session.session.user;
      console.log('🔧 Current user:', { id: user.id, email: user.email });

      // Check if worker already exists
      const { data: existingWorker } = await supabase
        .from('workers')
        .select('*')
        .eq('email', user.email)
        .single();

      if (existingWorker) {
        setResult({
          success: true,
          message: 'Worker profile already exists!',
          worker: existingWorker
        });
        return;
      }

      // Get the most recent tenant to associate with (or let user choose)
      const { data: tenants } = await supabase
        .from('tenants')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

      if (!tenants || tenants.length === 0) {
        throw new Error('No tenants found. Please create a tenant first.');
      }

      const selectedTenant = tenants[0];
      console.log('🔧 Using tenant:', selectedTenant.name);

      // Create the missing worker profile
      const workerData = {
        tenant_id: selectedTenant.id,
        full_name: user.email?.split('@')[0] || 'Usuario', // Use email prefix as name
        document_id: `DOC-${Date.now()}`, // Generate a temporary document ID
        email: user.email,
        phone: '+1234567890', // Default phone
        area_module: 'administracion',
        membership_id: user.id,
        status: 'active'
      };

      console.log('🔧 Creating worker with data:', workerData);

      const { data: newWorker, error: workerError } = await supabase
        .from('workers')
        .insert([workerData])
        .select()
        .single();

      if (workerError) {
        throw new Error(`Failed to create worker: ${workerError.message}`);
      }

      console.log('✅ Worker created successfully:', newWorker);

      setResult({
        success: true,
        message: 'Worker profile created successfully!',
        worker: newWorker,
        tenant: selectedTenant
      });

    } catch (err: any) {
      console.error('❌ Repair failed:', err);
      setError(err.message || 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const createNewTenantAndWorker = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('🔧 Creating new tenant and worker...');

      // Get current session
      const { data: session, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.session?.user) {
        throw new Error('No authenticated user found');
      }

      const user = session.session.user;

      // Create a new tenant
      const tenantData = {
        name: `${user.email?.split('@')[0]} Company`,
        slug: `${user.email?.split('@')[0]}-company`,
        plan: 'enterprise',
        primary_crop: 'General',
        contact_email: user.email,
        created_by: user.id
      };

      console.log('🔧 Creating tenant:', tenantData);

      const { data: newTenant, error: tenantError } = await supabase
        .from('tenants')
        .insert([tenantData])
        .select()
        .single();

      if (tenantError) {
        throw new Error(`Failed to create tenant: ${tenantError.message}`);
      }

      // Create the worker profile
      const workerData = {
        tenant_id: newTenant.id,
        full_name: user.email?.split('@')[0] || 'Usuario',
        document_id: `DOC-${Date.now()}`,
        email: user.email,
        phone: '+1234567890',
        area_module: 'administracion',
        membership_id: user.id,
        status: 'active'
      };

      console.log('🔧 Creating worker:', workerData);

      const { data: newWorker, error: workerError } = await supabase
        .from('workers')
        .insert([workerData])
        .select()
        .single();

      if (workerError) {
        throw new Error(`Failed to create worker: ${workerError.message}`);
      }

      console.log('✅ Tenant and worker created successfully');

      setResult({
        success: true,
        message: 'New tenant and worker profile created successfully!',
        worker: newWorker,
        tenant: newTenant
      });

    } catch (err: any) {
      console.error('❌ Creation failed:', err);
      setError(err.message || 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">🔧 Worker Profile Repair</h1>
      
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold text-yellow-800 mb-2">Problem Identified</h2>
        <p className="text-yellow-700">
          Your user account <code>admin10@empresa.com</code> exists in authentication but has no corresponding worker profile in the database.
        </p>
      </div>

      <div className="space-y-4">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3">Option 1: Join Existing Tenant</h3>
          <p className="text-gray-600 mb-4">
            This will create a worker profile for you and associate it with the most recent tenant in the database.
          </p>
          <button
            onClick={createMissingWorkerProfile}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Worker Profile'}
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3">Option 2: Create New Tenant</h3>
          <p className="text-gray-600 mb-4">
            This will create a new tenant company for you along with your worker profile.
          </p>
          <button
            onClick={createNewTenantAndWorker}
            disabled={loading}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create New Tenant & Worker'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800 font-semibold">Error</div>
          <div className="text-red-700">{error}</div>
        </div>
      )}

      {result && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-green-800 font-semibold mb-2">✅ Success!</div>
          <div className="text-green-700 mb-4">{result.message}</div>
          
          {result.worker && (
            <div className="bg-white rounded-lg p-4 mb-4">
              <h4 className="font-semibold mb-2">Worker Profile Created:</h4>
              <div className="text-sm space-y-1">
                <p><strong>Name:</strong> {result.worker.full_name}</p>
                <p><strong>Email:</strong> {result.worker.email}</p>
                <p><strong>Role:</strong> {result.worker.area_module}</p>
                <p><strong>Status:</strong> {result.worker.status}</p>
              </div>
            </div>
          )}

          {result.tenant && (
            <div className="bg-white rounded-lg p-4 mb-4">
              <h4 className="font-semibold mb-2">Tenant:</h4>
              <div className="text-sm space-y-1">
                <p><strong>Name:</strong> {result.tenant.name}</p>
                <p><strong>Plan:</strong> {result.tenant.plan}</p>
                <p><strong>Primary Crop:</strong> {result.tenant.primary_crop}</p>
              </div>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-blue-800 font-medium">Next Steps:</p>
            <ol className="text-blue-700 text-sm mt-2 space-y-1">
              <li>1. Go back to the main application</li>
              <li>2. Refresh the page</li>
              <li>3. You should now be able to log in successfully!</li>
            </ol>
          </div>
        </div>
      )}

      <div className="mt-8">
        <a 
          href="/" 
          className="text-blue-600 hover:text-blue-800 underline"
        >
          ← Back to Application
        </a>
      </div>
    </div>
  );
}