import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  console.log('🔍 Checking database tables...');
  
  try {
    // Check if tareas_campo table exists
    const { data: tareasData, error: tareasError } = await supabase
      .from('tareas_campo')
      .select('*')
      .limit(1);
    
    if (tareasError) {
      console.log('❌ tareas_campo table error:', tareasError.message);
      console.log('💡 This table likely doesn\'t exist yet');
    } else {
      console.log('✅ tareas_campo table exists');
      console.log('📊 Sample data:', tareasData);
    }
    
    // Check other empaque tables
    const tables = ['pallets', 'despachos', 'ingreso_fruta', 'egreso_fruta', 'preproceso'];
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
        
      if (error) {
        console.log(`❌ ${table} table error:`, error.message);
      } else {
        console.log(`✅ ${table} table exists`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkTables();