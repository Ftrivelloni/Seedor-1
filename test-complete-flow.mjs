import { authService } from './lib/supabaseAuth.js';

async function testCompleteFlow() {
  console.log('🏢 Testing complete tenant creation and login flow...');
  
  // Test data
  const testData = {
    tenantName: 'Test Farm Company',
    slug: 'test-farm-' + Date.now(),
    plan: 'basico',
    primaryCrop: 'manzanas',
    contactEmail: 'test@testfarm.com',
    adminFullName: 'Juan Test',
    adminEmail: 'test@testfarm.com',
    adminPassword: 'password123456',
    adminPhone: '+1234567890',
    adminDocumentId: '12345678'
  };
  
  console.log('1️⃣ Creating tenant with admin user...');
  
  try {
    // Create tenant
    const createResult = await authService.createTenantWithAdmin(testData);
    
    if (!createResult.success || createResult.error) {
      console.error('❌ Tenant creation failed:', createResult.error);
      return;
    }
    
    console.log('✅ Tenant created successfully!');
    console.log('Tenant:', createResult.tenant);
    
    // Wait a bit for the user to be created
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('2️⃣ Testing login...');
    
    // Test login
    const loginResult = await authService.login(testData.adminEmail, testData.adminPassword);
    
    if (loginResult.error) {
      console.error('❌ Login failed:', loginResult.error);
      return;
    }
    
    console.log('✅ Login successful!');
    console.log('User:', {
      nombre: loginResult.user.nombre,
      email: loginResult.user.email,
      rol: loginResult.user.rol,
      tenant: loginResult.user.tenant.name
    });
    
    console.log('3️⃣ Testing session check...');
    
    // Test session check
    const sessionUser = await authService.checkSession();
    
    if (!sessionUser) {
      console.error('❌ Session check failed');
      return;
    }
    
    console.log('✅ Session check successful!');
    console.log('Session user:', {
      nombre: sessionUser.nombre,
      email: sessionUser.email,
      rol: sessionUser.rol,
      tenant: sessionUser.tenant.name
    });
    
    console.log('🎉 Complete flow test successful!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testCompleteFlow();