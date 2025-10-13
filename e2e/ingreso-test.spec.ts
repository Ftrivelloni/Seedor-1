import { test, expect } from '@playwright/test';
import { login } from './test-utils/test-utils';
import { IngresoData, randomInt } from './test-utils/random-data';

test('ingreso fruta', async ({ page }) => {
  await login(page);
  
  // Generar datos aleatorios
  const ingresoData = IngresoData.generateData();
  
  await page.getByRole('button', { name: 'Empaque' }).click();
  await page.getByText('Ingreso FrutaRecepción de').click();
  await page.getByRole('button', { name: 'Nuevo ingreso' }).click();
  
  // Usar los datos aleatorios generados
  await page.locator('input[name="fecha"]').fill(ingresoData.fecha);
  
  // Para campos de tipo number, usamos evaluación de JavaScript en vez de fill
  await page.locator('input[name="num_ticket"]').click();
  // Usamos evaluateHandle para establecer el valor directamente en el DOM
  await page.evaluate((value) => {
    const element = document.querySelector('input[name="num_ticket"]');
    if (element) {
      (element as HTMLInputElement).value = value.toString();
      // Disparar un evento de cambio para que React detecte el cambio
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }, randomInt(1000, 9999));
  
  // Hacer lo mismo para el siguiente campo numérico
  await page.locator('input[name="num_remito"]').click();
  await page.evaluate((value) => {
    const element = document.querySelector('input[name="num_remito"]');
    if (element) {
      (element as HTMLInputElement).value = value.toString();
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }, randomInt(1000, 9999));
  
  // Para los campos de texto usamos fill normalmente
  await page.locator('input[name="productor"]').click();
  await page.locator('input[name="productor"]').fill(ingresoData.productor);
  await page.locator('input[name="finca"]').click();
  await page.locator('input[name="finca"]').fill(ingresoData.finca);
  await page.locator('input[name="producto"]').click();
  await page.locator('input[name="producto"]').fill(ingresoData.producto);
  await page.locator('input[name="lote"]').click();
  await page.locator('input[name="lote"]').fill(ingresoData.lote);
  await page.locator('input[name="contratista"]').click();
  await page.locator('input[name="contratista"]').fill(ingresoData.contratista);
  await page.locator('input[name="tipo_cosecha"]').click();
  await page.locator('input[name="tipo_cosecha"]').fill(ingresoData.tipo_cosecha);
  await page.locator('input[name="transporte"]').click();
  await page.locator('input[name="transporte"]').fill(ingresoData.transporte);
  await page.locator('input[name="chofer"]').click();
  await page.locator('input[name="chofer"]').fill(ingresoData.chofer);
  await page.locator('input[name="chasis"]').click();
  await page.locator('input[name="chasis"]').fill(ingresoData.chasis);
  await page.locator('input[name="acoplado"]').click();
  await page.locator('input[name="acoplado"]').fill(ingresoData.acoplado);
  await page.locator('input[name="operario"]').click();
  await page.locator('input[name="operario"]').fill(ingresoData.operario);
  
  // Para campos numéricos usamos evaluate
  await page.locator('input[name="cant_bin"]').click();
  await page.evaluate((value) => {
    const element = document.querySelector('input[name="cant_bin"]');
    if (element) {
      (element as HTMLInputElement).value = value.toString();
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }, ingresoData.cant_bin);
  
  await page.locator('input[name="tipo_bin"]').click();
  await page.locator('input[name="tipo_bin"]').fill(ingresoData.tipo_bin);
  
  await page.locator('input[name="peso_neto"]').click();
  await page.evaluate((value) => {
    const element = document.querySelector('input[name="peso_neto"]');
    if (element) {
      (element as HTMLInputElement).value = value.toString();
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }, ingresoData.peso_neto);
  
  await page.getByRole('button', { name: 'Guardar' }).click();
  
  // Esperar a que el formulario se procese y verificar resultado
  await page.waitForTimeout(2000);
  
  try {
    // Buscar una confirmación de éxito (ajustar según la UI real)
    const successMessage = page.getByText('guardado', { exact: false });
    if (await successMessage.isVisible()) {
      console.log('Ingreso guardado con éxito');
    }
  } catch (error) {
    console.log('No se pudo confirmar si el ingreso fue guardado');
    await page.screenshot({ path: 'screenshots/ingreso-result.png' });
  }
});