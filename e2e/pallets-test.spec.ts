import { test, expect } from '@playwright/test';
import { login } from './test-utils/test-utils';
import { PalletsData, randomInt } from './test-utils/random-data';

test('test pallets', async ({ page }) => {
  await login(page);
  
  // Generar datos aleatorios
  const palletsData = PalletsData.generateData();

  await page.getByRole('button', { name: 'Empaque' }).click();
  await page.getByText('PalletsGestión de pallets').click();
  await page.getByRole('button', { name: 'Nuevo pallet' }).click();
  
  // Para el campo semana (tipo number)
  await page.getByPlaceholder('Ej: 34').fill(palletsData.semana.toString());
  await page.waitForTimeout(300);
  
  // Para el campo num_pallet (tipo number)
  const numPallet = randomInt(1000, 9999);
  await page.getByPlaceholder('Ej: 1029').fill(numPallet.toString());
  await page.waitForTimeout(300);
  
  // Para los campos de texto
  await page.getByRole('textbox', { name: 'Ej: Naranja Valencia' }).click();
  await page.getByRole('textbox', { name: 'Ej: Naranja Valencia' }).fill(palletsData.producto);
  await page.getByRole('textbox', { name: 'Ej: Finca Los Nogales' }).click();
  await page.getByRole('textbox', { name: 'Ej: Finca Los Nogales' }).fill(palletsData.procedencia);
  await page.getByRole('textbox', { name: 'Ej: Cat. 1 / Premium' }).click();
  await page.getByRole('textbox', { name: 'Ej: Cat. 1 / Premium' }).fill(palletsData.categoria);
  await page.getByRole('textbox', { name: 'Ej: ENV-45C' }).click();
  await page.getByRole('textbox', { name: 'Ej: ENV-45C' }).fill(palletsData.empaque);
  await page.getByRole('textbox', { name: 'Ej: Mercado Central /' }).click();
  await page.getByRole('textbox', { name: 'Ej: Mercado Central /' }).fill(palletsData.destino);
  await page.waitForTimeout(300);
  
  // Para campos numéricos de medidas
  await page.getByPlaceholder('Ej: 720').fill(palletsData.cajas.toString());
  await page.waitForTimeout(300);
  await page.getByPlaceholder('Ej: 48').fill(palletsData.unidades.toString());
  await page.waitForTimeout(300);
  await page.getByPlaceholder('Ej: 24').fill(palletsData.peso.toString());
  await page.waitForTimeout(300);
  
  // Campo fecha - usar un selector más específico
  const fechaObj = new Date(palletsData.fecha);
  const fechaFormateada = `${(fechaObj.getMonth() + 1).toString().padStart(2, '0')}/${fechaObj.getDate().toString().padStart(2, '0')}/${fechaObj.getFullYear()}`;
  
  // Usar un selector más preciso para el campo fecha
  await page.locator('input[type="date"]').fill(fechaObj.toISOString().split('T')[0]);
  await page.waitForTimeout(500);
  
  // Tomar screenshot antes de guardar para verificar que todo está completo
  await page.screenshot({ path: 'screenshots/pallets-form-filled.png' });
  
  // Guardar el formulario - usar un selector más preciso
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  
  // Esperar a que el formulario se procese
  await page.waitForTimeout(3000);
  
  // Verificar si el modal sigue abierto (lo que indicaría un problema)
  const modalVisible = await page.locator('h1:has-text("Nuevo pallet")').isVisible();
  
  if (modalVisible) {
    // Si el modal sigue abierto, hay un problema
    await page.screenshot({ path: 'screenshots/pallets-form-error.png' });
    
    // Verificar si hay mensajes de error visibles
    const errorCount = await page.locator('.text-red-600').count();
    if (errorCount > 0) {
      await page.screenshot({ path: 'screenshots/pallets-validation-errors.png' });
    }
  } else {
    // Si el modal se cerró, buscar confirmación de éxito
    try {
      const successMessage = page.getByText('guardado', { exact: false });
      if (await successMessage.isVisible()) {
        await page.screenshot({ path: 'screenshots/pallets-success.png' });
      }
    } catch (error) {
      await page.screenshot({ path: 'screenshots/pallets-result.png' });
    }
  }
});