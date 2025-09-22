import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function createCorrectSamplePallets() {
  console.log('Creating sample pallets with correct structure...');

  // First, get a tenant ID
  const { data: tenants, error: tenantError } = await supabase
    .from('tenants')
    .select('id')
    .limit(1);

  if (tenantError || !tenants || tenants.length === 0) {
    console.error('No tenants found or error:', tenantError);
    return;
  }

  const tenantId = tenants[0].id;
  console.log('Using tenant ID:', tenantId);

  const samplePallets = [
    {
      tenant_id: tenantId,
      semana: 38,
      fecha: '2024-09-20',
      num_pallet: 1001,
      producto: 'Naranjas Valencia',
      productor: 'Juan Pérez',
      categoria: 'Premium',
      cod_envase: 'ENV-001',
      destino: 'Supermercado Norte',
      kilos: 1200,
      cant_cajas: 48,
      peso: 1180
    },
    {
      tenant_id: tenantId,
      semana: 38,
      fecha: '2024-09-21',
      num_pallet: 1002,
      producto: 'Mandarinas',
      productor: 'María González',
      categoria: 'Primera',
      cod_envase: 'ENV-002',
      destino: 'Exportación Brasil',
      kilos: 900,
      cant_cajas: 36,
      peso: 880
    },
    {
      tenant_id: tenantId,
      semana: 39,
      fecha: '2024-09-22',
      num_pallet: 1003,
      producto: 'Limones',
      productor: 'Carlos López',
      categoria: 'Premium',
      cod_envase: 'ENV-003',
      destino: 'Mercado Central',
      kilos: 1500,
      cant_cajas: 60,
      peso: 1475
    },
    {
      tenant_id: tenantId,
      semana: 39,
      fecha: '2024-09-19',
      num_pallet: 1004,
      producto: 'Pomelos',
      productor: 'Ana Martínez',
      categoria: 'Primera',
      cod_envase: 'ENV-004',
      destino: 'Cliente Premium',
      kilos: 1260,
      cant_cajas: 42,
      peso: 1240
    },
    {
      tenant_id: tenantId,
      semana: 39,
      fecha: '2024-09-22',
      num_pallet: 1005,
      producto: 'Naranjas Navel',
      productor: 'Pedro Rodríguez',
      categoria: 'Segunda',
      cod_envase: 'ENV-001',
      destino: 'Distribuidora Sur',
      kilos: 1350,
      cant_cajas: 54,
      peso: 1330
    }
  ];

  const { data, error } = await supabase
    .from('pallets')
    .insert(samplePallets)
    .select();

  if (error) {
    console.error('Error creating pallets:', error);
  } else {
    console.log('Successfully created pallets:', data?.length);
    console.log('Sample pallets created with correct structure!');
  }
}

createCorrectSamplePallets();