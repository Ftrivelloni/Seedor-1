import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function createSamplePallets() {
  console.log('Creating sample pallets...');

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
      codigo: 'PLT-001',
      fechaCreacion: '2024-09-20',
      tipoFruta: 'Naranjas',
      cantidadCajas: 48,
      pesoTotal: 1200,
      loteOrigen: 'LT-2024-001',
      destino: 'Cliente A',
      ubicacion: 'Cámara 1 - A1',
      estado: 'en_camara',
      temperaturaAlmacen: 4,
      fechaVencimiento: '2024-10-20',
      observaciones: 'Calidad premium'
    },
    {
      tenant_id: tenantId,
      codigo: 'PLT-002',
      fechaCreacion: '2024-09-21',
      tipoFruta: 'Mandarinas',
      cantidadCajas: 36,
      pesoTotal: 900,
      loteOrigen: 'LT-2024-002',
      destino: 'Cliente B',
      ubicacion: 'Cámara 1 - B2',
      estado: 'listo_despacho',
      temperaturaAlmacen: 3,
      fechaVencimiento: '2024-10-25',
      observaciones: 'Listo para envío'
    },
    {
      tenant_id: tenantId,
      codigo: 'PLT-003',
      fechaCreacion: '2024-09-22',
      tipoFruta: 'Limones',
      cantidadCajas: 60,
      pesoTotal: 1500,
      loteOrigen: 'LT-2024-003',
      ubicacion: 'Cámara 2 - A1',
      estado: 'armado',
      temperaturaAlmacen: 5,
      fechaVencimiento: '2024-11-01',
      observaciones: 'Recién armado'
    },
    {
      tenant_id: tenantId,
      codigo: 'PLT-004',
      fechaCreacion: '2024-09-19',
      tipoFruta: 'Pomelos',
      cantidadCajas: 42,
      pesoTotal: 1260,
      loteOrigen: 'LT-2024-004',
      destino: 'Exportación',
      ubicacion: 'Cámara 3 - C1',
      estado: 'despachado',
      temperaturaAlmacen: 2,
      fechaVencimiento: '2024-10-30',
      observaciones: 'Despachado a exportación'
    },
    {
      tenant_id: tenantId,
      codigo: 'PLT-005',
      fechaCreacion: '2024-09-22',
      tipoFruta: 'Naranjas',
      cantidadCajas: 54,
      pesoTotal: 1350,
      loteOrigen: 'LT-2024-005',
      destino: 'Cliente C',
      ubicacion: 'Cámara 1 - C3',
      estado: 'en_camara',
      temperaturaAlmacen: 4,
      fechaVencimiento: '2024-10-18',
      observaciones: 'Próximo a vencer'
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
    console.log('Sample pallets created:', JSON.stringify(data, null, 2));
  }
}

createSamplePallets();