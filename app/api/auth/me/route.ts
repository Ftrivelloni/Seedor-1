import { createClient } from '@supabase/supabase-js';
import { NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: Request) {
  try {
    const authorization = request.headers.get('authorization');
    
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const token = authorization.split(' ')[1];

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    // Get user's tenant memberships instead of requiring worker record
    const { data: memberships, error: membershipError } = await supabase
      .from('tenant_memberships')
      .select(`
        *,
        tenant:tenants(*),
        profile:profiles!tenant_memberships_user_id_fkey(*)
      `)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (membershipError || !memberships) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const roleMap: { [key: string]: string } = {
      'admin': 'Admin',
      'campo': 'Campo',
      'empaque': 'Empaque',
      'finanzas': 'Finanzas'
    };
    
    const normalizedRole = memberships.role_code.toLowerCase().trim();
    const authUser = {
      id: user.id,
      email: user.email,
      nombre: memberships.profile?.full_name || user.user_metadata?.full_name || user.email,
      tenantId: memberships.tenant_id,
      rol: roleMap[normalizedRole] || 'Campo',
      activo: memberships.status === 'active',
      tenant: memberships.tenant,
      membership: memberships,
    };
    
    return NextResponse.json({ user: authUser });
    
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}