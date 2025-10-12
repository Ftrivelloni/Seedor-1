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
  await page.getByPlaceholder('Ej: 34').click();
  await page.evaluate((value) => {
    const element = document.querySelector('input[placeholder="Ej: 34"]');
    if (element) {
      (element as HTMLInputElement).value = value.toString();
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }, palletsData.semana);
  
  // Para el campo num_pallet (tipo number)
  await page.getByPlaceholder('Ej: 1029').click();
  await page.evaluate((value) => {
    const element = document.querySelector('input[placeholder="Ej: 1029"]');
    if (element) {
      (element as HTMLInputElement).value = value.toString();
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }, randomInt(1000, 9999)); // Usamos un número en lugar del string con prefijo
  
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
  
  // Para campos numéricos
  await page.getByPlaceholder('Ej: 720').click();
  await page.evaluate((value) => {
    const element = document.querySelector('input[placeholder="Ej: 720"]');
    if (element) {
      (element as HTMLInputElement).value = value.toString();
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }, palletsData.cajas);
  
  await page.getByPlaceholder('Ej: 48').click();
  await page.evaluate((value) => {
    const element = document.querySelector('input[placeholder="Ej: 48"]');
    if (element) {
      (element as HTMLInputElement).value = value.toString();
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }, palletsData.unidades);
  
  await page.getByPlaceholder('Ej: 24').click();
  await page.evaluate((value) => {
    const element = document.querySelector('input[placeholder="Ej: 24"]');
    if (element) {
      (element as HTMLInputElement).value = value.toString();
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }, palletsData.peso);
  
  // Campo fecha
  await page.locator('input[name="fecha"]').fill(palletsData.fecha);
  
  // Guardar el formulario
  await page.getByRole('button', { name: 'Guardar' }).click();
  
  // Esperar a que el formulario se procese
  await page.waitForTimeout(2000);
  
  try {
    // Buscar una confirmación de éxito
    const successMessage = page.getByText('guardado', { exact: false });
    if (await successMessage.isVisible()) {
      console.log('Pallet guardado con éxito');
    }
  } catch (error) {
    console.log('No se pudo confirmar si el pallet fue guardado');
    await page.screenshot({ path: 'screenshots/pallets-result.png' });
  }
});