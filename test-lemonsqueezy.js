/**
 * Test LemonSqueezy API Connection
 * Run with: node test-lemonsqueezy.js
 */

require('dotenv').config({ path: '.env.local' });
const { lemonSqueezySetup, getProduct } = require('@lemonsqueezy/lemonsqueezy.js');

async function testConnection() {
  console.log('🍋 Testing LemonSqueezy Connection...\n');

  // Check environment variables
  console.log('📋 Environment Variables:');
  console.log('  API Key:', process.env.LEMONSQUEEZY_API_KEY ? '✅ Set' : '❌ Missing');
  console.log('  Store ID:', process.env.LEMONSQUEEZY_STORE_ID || '❌ Missing');
  console.log('  Variant Basic ID:', process.env.LEMONSQUEEZY_VARIANT_BASIC_ID || '❌ Missing');
  console.log('  Variant Pro ID:', process.env.LEMONSQUEEZY_VARIANT_PRO_ID || '❌ Missing');
  console.log('  Test Mode:', process.env.LEMONSQUEEZY_TEST_MODE || 'false');
  console.log('');

  if (!process.env.LEMONSQUEEZY_API_KEY) {
    console.error('❌ LEMONSQUEEZY_API_KEY is missing!');
    process.exit(1);
  }

  // Initialize SDK
  try {
    lemonSqueezySetup({
      apiKey: process.env.LEMONSQUEEZY_API_KEY,
      onError: (error) => {
        console.error('SDK Error:', error);
      },
    });
    console.log('✅ SDK initialized successfully\n');
  } catch (error) {
    console.error('❌ Failed to initialize SDK:', error.message);
    process.exit(1);
  }

  // Test variant access
  console.log('🔍 Testing Variant Access...\n');

  const variants = [
    { name: 'Basic', id: process.env.LEMONSQUEEZY_VARIANT_BASIC_ID },
    { name: 'Pro', id: process.env.LEMONSQUEEZY_VARIANT_PRO_ID },
  ];

  for (const variant of variants) {
    if (!variant.id) {
      console.log(`⚠️  ${variant.name}: No variant ID set`);
      continue;
    }

    try {
      console.log(`Testing ${variant.name} (ID: ${variant.id})...`);

      // Note: The SDK doesn't have a direct getVariant function
      // We're just testing if the API key works by trying to call the API
      const response = await fetch(`https://api.lemonsqueezy.com/v1/variants/${variant.id}`, {
        headers: {
          'Authorization': `Bearer ${process.env.LEMONSQUEEZY_API_KEY}`,
          'Accept': 'application/vnd.api+json',
          'Content-Type': 'application/vnd.api+json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`  ✅ ${variant.name}: Valid (${data.data.attributes.name})`);
        console.log(`     Status: ${data.data.attributes.status}`);
        console.log(`     Is Subscription: ${data.data.attributes.is_subscription ? 'Yes' : 'No'}`);
      } else {
        const error = await response.json();
        console.log(`  ❌ ${variant.name}: Error ${response.status}`);
        console.log(`     ${error.errors?.[0]?.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.log(`  ❌ ${variant.name}: ${error.message}`);
    }
    console.log('');
  }

  console.log('✨ Test complete!\n');

  console.log('💡 Next steps:');
  console.log('1. If variants are invalid, check they exist and are PUBLISHED in LemonSqueezy');
  console.log('2. If in test mode, make sure you\'re using TEST variant IDs, not live ones');
  console.log('3. Run the database migration if you haven\'t yet');
}

testConnection().catch(console.error);
