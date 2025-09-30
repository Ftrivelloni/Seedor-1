import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabaseClient';

export async function GET() {
  try {
    console.log('🔍 Starting API diagnostic...');

    // Get workers
    const { data: workers, error: workersError } = await supabase
      .from('workers')
      .select('id, email, membership_id, status, created_at');

    // Get tenants
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select('id, name, created_by, created_at');

    const diagnostics = {
      timestamp: new Date().toISOString(),
      workers: {
        total: workers?.length || 0,
        data: workers || [],
        error: workersError,
        withoutMembershipId: workers?.filter((w: any) => !w.membership_id).length || 0,
        inactive: workers?.filter((w: any) => w.status !== 'active').length || 0
      },
      tenants: {
        total: tenants?.length || 0,
        data: tenants || [],
        error: tenantsError
      }
    };

    console.log('📊 Diagnostic results:', diagnostics);

    return NextResponse.json(diagnostics);
  } catch (error) {
    console.error('❌ Diagnostic API error:', error);
    return NextResponse.json({ error: 'Diagnostic failed' }, { status: 500 });
  }
}