import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
}

// Create admin client with service role for direct database access
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// GET /api/admin/users - Get all users for the admin's tenant
export async function GET(request: NextRequest) {
  try {
    // Only log in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log('GET /api/admin/users - Request received');
    }
    
    // Get the authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      if (process.env.NODE_ENV === 'development') {
        console.log('GET /api/admin/users - No authorization token provided');
      }
      return NextResponse.json({ error: 'No authorization token' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    if (process.env.NODE_ENV === 'development') {
      console.log('GET /api/admin/users - Token received, verifying user');
    }

    // Verify the user with the token
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      console.error('GET /api/admin/users - Invalid token:', userError);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`GET /api/admin/users - User verified: ${user.email}`);
    }

    // Get user's memberships directly
    const { data: memberships, error: membershipError } = await supabaseAdmin
      .from('tenant_memberships')
      .select('*, tenants(*)')
      .eq('user_id', user.id)
      .eq('status', 'active');

    if (membershipError || !memberships || memberships.length === 0) {
      console.error('GET /api/admin/users - No active memberships found:', membershipError);
      return NextResponse.json({ error: 'No active memberships found' }, { status: 403 });
    }
    
    // Find admin membership
    const adminMembership = memberships.find(m => m.role_code === 'admin' || m.role_code === 'owner');
    
    if (!adminMembership) {
      console.error(`GET /api/admin/users - Access denied. User is not admin: ${user.email}`);
      return NextResponse.json({ error: 'Access denied. Admin role required.' }, { status: 403 });
    }
    
    const tenantId = adminMembership.tenant_id;
    if (process.env.NODE_ENV === 'development') {
      console.log(`GET /api/admin/users - Admin access verified for user: ${user.email} in tenant: ${tenantId}`);
      console.log(`GET /api/admin/users - Fetching memberships for tenant: ${tenantId}`);
    }
    
    // First, get all memberships for the tenant
    const { data: tenantMemberships, error: membershipsError } = await supabaseAdmin
      .from('tenant_memberships')
      .select(`
        id,
        role_code,
        status,
        user_id,
        invited_by,
        accepted_at,
        tenants:tenant_id(
          name,
          plan
        )
      `)
      .eq('tenant_id', tenantId)
      .order('accepted_at', { ascending: false });

    if (membershipsError) {
      console.error('Error fetching memberships:', membershipsError);
      // Only log detailed error in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Membership error details:', JSON.stringify(membershipsError));
      }
      return NextResponse.json({ 
        error: 'Failed to fetch users', 
        details: membershipsError.message || 'Database query error' 
      }, { status: 500 });
    }
    
    if (!tenantMemberships) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`GET /api/admin/users - No memberships found for tenant: ${tenantId}`);
      }
      return NextResponse.json({ 
        users: [], 
        tenant: adminMembership.tenants,
        message: 'No memberships found for this tenant'
      });
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`GET /api/admin/users - Found ${tenantMemberships.length} memberships for tenant: ${tenantId}`);
      console.log(`GET /api/admin/users - Fetching workers for tenant: ${tenantId}`);
    }
    
    // Also get workers data if available
    const { data: workers, error: workersError } = await supabaseAdmin
      .from('workers')
      .select('*')
      .eq('tenant_id', tenantId);
      
    if (workersError) {
      console.error('Error fetching workers:', workersError);
      // Continue without worker data, just log the error
    }
      
    // Combine data from memberships and auth.users
    if (process.env.NODE_ENV === 'development') {
      console.log(`GET /api/admin/users - Processing ${tenantMemberships.length} membership records`);
    }
    
    // Safety check for tenantMemberships structure
    if (!Array.isArray(tenantMemberships)) {
      console.error('Tenant memberships is not an array:', tenantMemberships);
      return NextResponse.json({ 
        error: 'Invalid data structure from database', 
        details: 'Memberships is not an array'
      }, { status: 500 });
    }
    
    // Now fetch user data for these memberships separately
    if (process.env.NODE_ENV === 'development') {
      console.log('Fetching user data for memberships...');
    }
    
    // Extract all user IDs from memberships
    const userIds = tenantMemberships
      .map(membership => membership.user_id)
      .filter(id => id); // Filter out null/undefined IDs
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`Found ${userIds.length} user IDs to fetch`);
    }
    
    // Start processing timestamp for performance tracking
    const startTime = process.env.NODE_ENV === 'development' ? Date.now() : 0;
    
    // Fetch user data using admin API instead of direct table access
    // This avoids the schema cache relationship issue
    
    // Initialize map to store user data
    interface UserData {
      id: string;
      email?: string;
      raw_user_meta_data?: any;
    }
    const authUsersMap = new Map<string, UserData>();
    let authUsers: UserData[] = [];
    let authUsersError: Error | null = null;
    
      // Batch process users to avoid hitting API limits
    try {
      // Use admin API to get user data - more reliable than direct table access
      if (process.env.NODE_ENV === 'development') {
        console.log('Using admin API to fetch user data...');
      }
      
      // Process users in batches for better performance
      const batchSize = 25; // Increased batch size for better throughput
      const batches: string[][] = [];
      
      // Create a simple in-memory cache for this request
      // In production, consider using a real caching solution
      const requestCache = new Map<string, UserData>();
      
      // Build batches of user IDs
      for (let i = 0; i < userIds.length; i += batchSize) {
        batches.push(userIds.slice(i, i + batchSize));
      }
      
      // Process batches with controlled concurrency
      const concurrencyLimit = 3; // Increased to 3 for better performance but avoiding rate limits
      
      // Process batches in chunks to control memory usage
      for (let i = 0; i < batches.length; i += concurrencyLimit) {
        const batchesToProcess = batches.slice(i, i + concurrencyLimit);
        const batchResults = await Promise.all(batchesToProcess.map(async (batch) => {
          // For each batch, fetch users in parallel but within batch
          const userResults: UserData[] = [];
          
          await Promise.all(batch.map(async (userId) => {
            try {
              // Check request cache first
              if (requestCache.has(userId)) {
                const cachedData = requestCache.get(userId);
                if (cachedData) {
                  authUsersMap.set(userId, cachedData);
                  userResults.push(cachedData);
                }
                return;
              }
              
              const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);
              if (!error && data && data.user) {
                const userData: UserData = {
                  id: data.user.id,
                  email: data.user.email,
                  raw_user_meta_data: data.user.user_metadata
                };
                // Store in both maps
                authUsersMap.set(userId, userData);
                requestCache.set(userId, userData);
                userResults.push(userData);
              }
            } catch (e) {
              if (process.env.NODE_ENV === 'development') {
                console.error(`Error fetching user ${userId}:`, e);
              }
            }
          }));
          
          return userResults;
        }));
        
        // Combine results from all batches
        for (const results of batchResults) {
          authUsers = [...authUsers, ...results];
        }
      }
      
      if (process.env.NODE_ENV === 'development') {
        const endTime = Date.now();
        const processingTime = endTime - startTime;
        console.log(`Successfully retrieved ${authUsersMap.size} users in ${processingTime}ms`);
      }
    } catch (e) {
      console.error('Error fetching users with admin API:', e);
      authUsersError = e instanceof Error ? e : new Error(String(e));
    }
    
    if (authUsersError) {
      console.error('Error fetching auth users:', authUsersError);
      // Continue with whatever data we have already
      console.log('Continuing with partial user data...');
    }
    
    console.log(`Retrieved ${authUsers?.length || 0} auth users`);
    
    // Now map the memberships with user data
    let users;
    try {
      // Pre-process workers lookup for better performance
      const workersByMembershipId: Record<string, any> = {};
      const workersByEmail: Record<string, any> = {};
      
      if (workers && workers.length > 0) {
        workers.forEach(worker => {
          if (worker.membership_id) {
            workersByMembershipId[worker.membership_id] = worker;
          }
          if (worker.email) {
            workersByEmail[worker.email] = worker;
          }
        });
      }
      
      users = tenantMemberships.map(membership => {
        try {
          if (!membership) {
            if (process.env.NODE_ENV === 'development') {
              console.warn('Empty membership object encountered');
            }
            return null;
          }
          
          // Get user data from our map
          const userData = authUsersMap.get(membership.user_id);
          const userMetadata = userData?.raw_user_meta_data || {};
          
          // Find matching worker using pre-processed lookups
          const worker = workersByMembershipId[membership.id] || 
            (userData?.email ? workersByEmail[userData.email] : undefined);
          
          return {
            id: worker?.id || `mem-${membership.id}`,
            email: userData?.email || worker?.email || 'unknown',
            full_name: userMetadata?.full_name || userMetadata?.name || worker?.full_name || 'Usuario',
            role_code: membership.role_code || 'unknown',
            status: membership.status || 'unknown',
            created_at: worker?.created_at || membership.accepted_at || new Date().toISOString(),
            tenant_id: tenantId,
            area_module: worker?.area_module || membership.role_code || 'unknown',
            membership: {
              id: membership.id,
              role_code: membership.role_code || 'unknown',
              status: membership.status || 'unknown',
              accepted_at: membership.accepted_at
            }
          };
        } catch (mapError) {
          console.error('Error mapping membership to user:', mapError, membership);
          return null;
        }
      }).filter(user => user !== null); // Filter out any failed mappings
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`GET /api/admin/users - Successfully mapped ${users.length} users`);
        const totalEndTime = Date.now();
        const totalProcessingTime = totalEndTime - startTime;
        console.log(`GET /api/admin/users - Total processing time: ${totalProcessingTime}ms`);
      }
      
      return NextResponse.json({
        users: users || [],
        tenant: adminMembership.tenants
      });
      
    } catch (mapError) {
      console.error('Error during user mapping:', mapError);
      return NextResponse.json({ 
        error: 'Error processing user data', 
        details: mapError instanceof Error ? mapError.message : 'Unknown mapping error'
      }, { status: 500 });
    }
    

    // This log will be handled inside the try block

  } catch (error) {
    console.error('GET /api/admin/users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/admin/users - Update a user's role or status
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization token' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const body = await request.json();
    const { workerId, role, status } = body;

    if (!workerId) {
      return NextResponse.json({ error: 'Worker ID or Member ID is required' }, { status: 400 });
    }

    console.log(`PUT /api/admin/users - Updating user ${workerId}, role: ${role}, status: ${status}`);

    // Verify the requesting user
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      console.error('PUT /api/admin/users - Invalid token:', userError);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get user's memberships directly
    const { data: memberships, error: membershipError } = await supabaseAdmin
      .from('tenant_memberships')
      .select('*, tenants(*)')
      .eq('user_id', user.id)
      .eq('status', 'active');

    if (membershipError || !memberships || memberships.length === 0) {
      console.error('PUT /api/admin/users - No active memberships found:', membershipError);
      return NextResponse.json({ error: 'No active memberships found' }, { status: 403 });
    }
    
    // Find admin membership
    const adminMembership = memberships.find(m => m.role_code === 'admin' || m.role_code === 'owner');
    
    if (!adminMembership) {
      console.error(`PUT /api/admin/users - Access denied. User is not admin: ${user.email}`);
      return NextResponse.json({ error: 'Access denied. Admin role required.' }, { status: 403 });
    }
    
    const tenantId = adminMembership.tenant_id;
    console.log(`PUT /api/admin/users - Admin verified: ${user.email}, tenant: ${tenantId}`);
    
    // Check if workerId refers to a membership ID (format: mem-[id])
    let membershipId = null;
    let actualWorkerId = workerId;
    
    if (workerId.startsWith('mem-')) {
      membershipId = workerId.replace('mem-', '');
      actualWorkerId = null;
      console.log(`PUT /api/admin/users - Updating membership ID: ${membershipId}`);
    } else {
      // Get the worker to update
      const { data: targetWorker, error: targetWorkerError } = await supabaseAdmin
        .from('workers')
        .select('*')
        .eq('id', workerId)
        .eq('tenant_id', tenantId)
        .single();

      if (targetWorkerError || !targetWorker) {
        console.error('PUT /api/admin/users - Target worker not found:', targetWorkerError);
        return NextResponse.json({ error: 'Target worker not found' }, { status: 404 });
      }
      
      membershipId = targetWorker.membership_id;
      console.log(`PUT /api/admin/users - Updating worker ID: ${workerId}, membership ID: ${membershipId}`);
    }

    // Update worker status if provided and we have a worker ID
    if (status && actualWorkerId) {
      console.log(`PUT /api/admin/users - Updating worker status to ${status}`);
      const { error: updateWorkerError } = await supabaseAdmin
        .from('workers')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', actualWorkerId);

      if (updateWorkerError) {
        console.error('PUT /api/admin/users - Failed to update worker status:', updateWorkerError);
        return NextResponse.json({ error: 'Failed to update worker status' }, { status: 500 });
      }
    }

    // Update membership role and status if provided and we have a membership ID
    if (membershipId) {
      const updates: any = {};
      
      if (role) {
        updates.role_code = role;
      }
      
      if (status) {
        updates.status = status;
      }
      
      if (Object.keys(updates).length > 0) {
        console.log(`PUT /api/admin/users - Updating membership with:`, updates);
        const { error: updateMembershipError } = await supabaseAdmin
          .from('tenant_memberships')
          .update(updates)
          .eq('id', membershipId)
          .eq('tenant_id', tenantId);

        if (updateMembershipError) {
          console.error('PUT /api/admin/users - Failed to update membership:', updateMembershipError);
          return NextResponse.json({ error: 'Failed to update user role or status' }, { status: 500 });
        }
      }

      // Also update area_module in worker to match role if we have a worker ID
      if (role && actualWorkerId) {
        console.log(`PUT /api/admin/users - Also updating worker area_module to ${role}`);
        await supabaseAdmin
          .from('workers')
          .update({ area_module: role })
          .eq('id', actualWorkerId);
      }
    }

    console.log(`PUT /api/admin/users - User updated successfully`);
    return NextResponse.json({ 
      success: true,
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('PUT /api/admin/users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/users - Deactivate a user
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization token' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { searchParams } = new URL(request.url);
    const workerId = searchParams.get('id');

    if (!workerId) {
      return NextResponse.json({ error: 'Worker ID is required' }, { status: 400 });
    }

    console.log(`DELETE /api/admin/users - Deactivating user ${workerId}`);

    // Verify the requesting user
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      console.error('DELETE /api/admin/users - Invalid token:', userError);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get user's memberships directly
    const { data: memberships, error: membershipError } = await supabaseAdmin
      .from('tenant_memberships')
      .select('*, tenants(*)')
      .eq('user_id', user.id)
      .eq('status', 'active');

    if (membershipError || !memberships || memberships.length === 0) {
      console.error('DELETE /api/admin/users - No active memberships found:', membershipError);
      return NextResponse.json({ error: 'No active memberships found' }, { status: 403 });
    }
    
    // Find admin membership
    const adminMembership = memberships.find(m => m.role_code === 'admin' || m.role_code === 'owner');
    
    if (!adminMembership) {
      console.error(`DELETE /api/admin/users - Access denied. User is not admin: ${user.email}`);
      return NextResponse.json({ error: 'Access denied. Admin role required.' }, { status: 403 });
    }
    
    const tenantId = adminMembership.tenant_id;
    console.log(`DELETE /api/admin/users - Admin verified: ${user.email}, tenant: ${tenantId}`);
    
    // Check if workerId refers to a membership ID (format: mem-[id])
    let membershipId = null;
    
    if (workerId.startsWith('mem-')) {
      membershipId = workerId.replace('mem-', '');
      console.log(`DELETE /api/admin/users - Deactivating membership ID: ${membershipId}`);
      
      // Deactivate the membership directly
      const { error: deactivateError } = await supabaseAdmin
        .from('tenant_memberships')
        .update({ status: 'inactive' })
        .eq('id', membershipId)
        .eq('tenant_id', tenantId);

      if (deactivateError) {
        console.error('DELETE /api/admin/users - Failed to deactivate membership:', deactivateError);
        return NextResponse.json({ error: 'Failed to deactivate membership' }, { status: 500 });
      }
    } else {
      console.log(`DELETE /api/admin/users - Deactivating worker ID: ${workerId}`);
      
      // Deactivate the worker
      const { error: deactivateError } = await supabaseAdmin
        .from('workers')
        .update({ status: 'inactive', updated_at: new Date().toISOString() })
        .eq('id', workerId)
        .eq('tenant_id', tenantId);

      if (deactivateError) {
        console.error('DELETE /api/admin/users - Failed to deactivate worker:', deactivateError);
        return NextResponse.json({ error: 'Failed to deactivate user' }, { status: 500 });
      }

      // Get membership ID from worker and deactivate it too
      const { data: targetWorker } = await supabaseAdmin
        .from('workers')
        .select('membership_id')
        .eq('id', workerId)
        .single();

      if (targetWorker?.membership_id) {
        console.log(`DELETE /api/admin/users - Also deactivating membership ID: ${targetWorker.membership_id}`);
        await supabaseAdmin
          .from('tenant_memberships')
          .update({ status: 'inactive' })
          .eq('id', targetWorker.membership_id);
      }
    }
    
    // Decrement the tenant's current_users count
    const { data: tenant } = await supabaseAdmin
      .from('tenants')
      .select('current_users')
      .eq('id', tenantId)
      .single();
      
    if (tenant && tenant.current_users > 0) {
      await supabaseAdmin
        .from('tenants')
        .update({ current_users: tenant.current_users - 1 })
        .eq('id', tenantId);
    }
    
    console.log(`DELETE /api/admin/users - User deactivated successfully`);
    return NextResponse.json({ 
      success: true,
      message: 'User deactivated successfully'
    });

  } catch (error) {
    console.error('DELETE /api/admin/users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
