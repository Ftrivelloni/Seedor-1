import { authService } from './lib/supabaseAuth.js';

async function testLogin() {
  console.log('🔐 Testing login...');
  
  const email = 'admin@empresa.com';
  const password = 'password123';
  
  console.log(`Attempting to login with: ${email}`);
  
  try {
    const result = await authService.login(email, password);
    
    if (result.error) {
      console.error('❌ Login failed:', result.error);
    } else {
      console.log('✅ Login successful!');
      console.log('User:', result.user);
    }
    
  } catch (error) {
    console.error('❌ Login error:', error);
  }
}

testLogin();