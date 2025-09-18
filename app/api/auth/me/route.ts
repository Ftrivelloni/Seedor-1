import { createClient } from '@supabase/supabase-js';
import { NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create a Supabase client with service role key for server-side operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: Request) {
  try {
    // Get the authorization header
    const authorization = request.headers.get('authorization');
    
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const token = authorization.split(' ')[1];

    // Verify the JWT token with Supabase
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    // Get worker profile with tenant info
    const { data: worker, error: workerError } = await supabase
      .from('workers')
      .select(`
        *,
        tenant:tenants(*)
      `)
      .eq('email', user.email)
      .eq('status', 'active')
      .single();

    if (workerError || !worker) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    // Map area_module to role
    const roleMap: { [key: string]: string } = {
      'administracion': 'Admin',
      'administración': 'Admin',
      'admin': 'Admin',
      'campo': 'Campo',
      'empaque': 'Empaque',
      'finanzas': 'Finanzas',
      'general': 'Admin',
      // English variations
      'administration': 'Admin',
      'field': 'Campo',
      'packaging': 'Empaque',
      'finance': 'Finanzas'
    };
    
    const normalizedAreaModule = worker.area_module.toLowerCase().trim();
    const authUser = {
      id: user.id,
      email: worker.email,
      nombre: worker.full_name,
      tenantId: worker.tenant_id,
      rol: roleMap[normalizedAreaModule] || 'Campo',
      activo: worker.status === 'active',
      tenant: worker.tenant,
      worker: worker,
    };
    
    return NextResponse.json({ user: authUser });
    
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}