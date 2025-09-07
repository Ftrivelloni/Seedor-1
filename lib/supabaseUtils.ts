import { supabase } from './supabaseClient';

// Example function to fetch data from a table
export async function fetchFromTable(tableName: string) {
  const { data, error } = await supabase
    .from(tableName)
    .select('*');
  
  if (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
  
  return data;
}

// Example function to insert data into a table
export async function insertIntoTable(tableName: string, data: any) {
  const { data: result, error } = await supabase
    .from(tableName)
    .insert(data)
    .select();
  
  if (error) {
    console.error('Error inserting data:', error);
    throw error;
  }
  
  return result;
}

// Example function to update data in a table
export async function updateInTable(tableName: string, id: number, data: any) {
  const { data: result, error } = await supabase
    .from(tableName)
    .update(data)
    .eq('id', id)
    .select();
  
  if (error) {
    console.error('Error updating data:', error);
    throw error;
  }
  
  return result;
}

// Example function to delete data from a table
export async function deleteFromTable(tableName: string, id: number) {
  const { error } = await supabase
    .from(tableName)
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting data:', error);
    throw error;
  }
  
  return true;
}
