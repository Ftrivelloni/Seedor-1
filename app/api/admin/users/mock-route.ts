import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Create a mock implementation for the user management page to work with without requiring a database connection
export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/admin/users - Using mock implementation');
    
    // Get the authorization header (just for logging)
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      console.log('GET /api/admin/users - No authorization token provided');
      return NextResponse.json({ error: 'No authorization token' }, { status: 401 });
    }
    
    // Create mock users data
    const mockUsers = [
      {
        id: 'mock-admin-1',
        email: 'admin@example.com',
        full_name: 'Admin Usuario',
        area_module: 'admin',
        status: 'active',
        created_at: '2025-01-01T00:00:00.000Z',
        tenant_id: 'mock-tenant-1',
        membership: {
          role_code: 'admin',
          status: 'active',
          accepted_at: '2025-01-01T00:00:00.000Z'
        }
      },
      {
        id: 'mock-campo-1',
        email: 'campo@example.com',
        full_name: 'Usuario Campo',
        area_module: 'campo',
        status: 'active',
        created_at: '2025-01-02T00:00:00.000Z',
        tenant_id: 'mock-tenant-1',
        membership: {
          role_code: 'campo',
          status: 'active',
          accepted_at: '2025-01-02T00:00:00.000Z'
        }
      },
      {
        id: 'mock-empaque-1',
        email: 'empaque@example.com',
        full_name: 'Usuario Empaque',
        area_module: 'empaque',
        status: 'active',
        created_at: '2025-01-03T00:00:00.000Z',
        tenant_id: 'mock-tenant-1',
        membership: {
          role_code: 'empaque',
          status: 'active',
          accepted_at: '2025-01-03T00:00:00.000Z'
        }
      },
      {
        id: 'mock-finanzas-1',
        email: 'finanzas@example.com',
        full_name: 'Usuario Finanzas',
        area_module: 'finanzas',
        status: 'pending',
        created_at: '2025-01-04T00:00:00.000Z',
        tenant_id: 'mock-tenant-1',
        membership: {
          role_code: 'finanzas',
          status: 'pending'
        }
      }
    ];
    
    // Add the current user to the mock data
    // Extract the email from the token if possible (just for better mocks)
    let currentUserEmail = 'current@example.com';
    try {
      const token = authHeader.replace('Bearer ', '');
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.email) {
        currentUserEmail = payload.email;
      }
    } catch (e) {
      // Ignore token parsing errors
    }
    
    // Add the current user to the mock data
    mockUsers.unshift({
      id: 'current-user',
      email: currentUserEmail,
      full_name: 'Usuario Actual',
      area_module: 'admin',
      status: 'active',
      created_at: '2025-01-01T00:00:00.000Z',
      tenant_id: 'mock-tenant-1',
      membership: {
        role_code: 'admin',
        status: 'active',
        accepted_at: '2025-01-01T00:00:00.000Z'
      }
    });
    
    console.log(`GET /api/admin/users - Returning ${mockUsers.length} mock users`);
    
    return NextResponse.json({
      users: mockUsers,
      tenant: {
        id: 'mock-tenant-1',
        name: 'Empresa de Ejemplo',
        plan: 'profesional'
      }
    });
  } catch (error) {
    console.error('GET /api/admin/users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// These endpoints will also return mock data
export async function PUT(request: NextRequest) {
  try {
    console.log('PUT /api/admin/users - Using mock implementation');
    
    // For demonstration purposes, we'll parse the request body
    const body = await request.json();
    console.log('PUT /api/admin/users - Request body:', body);
    
    return NextResponse.json({ 
      success: true,
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('PUT /api/admin/users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('DELETE /api/admin/users - Using mock implementation');
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    console.log('DELETE /api/admin/users - Worker ID:', id);
    
    return NextResponse.json({ 
      success: true,
      message: 'User deactivated successfully'
    });
  } catch (error) {
    console.error('DELETE /api/admin/users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}