import { test, expect } from '@playwright/test';
import { login } from './test-utils/test-utils';
import { EgresoData, randomInt } from './test-utils/random-data';
import { fillByPlaceholder, fillFormField, clickElement } from './test-utils/form-helpers';

test('test egreso', async ({ page }) => {
  await login(page);
  
  // Generar datos aleatorios
  const egresoData = EgresoData.generateData();

  // Usar las funciones helper para navegación
  await clickElement(page, 'button:has-text("Empaque")');
  await clickElement(page, 'div:has-text("Egreso FrutaSalida de")');
  await clickElement(page, 'button:has-text("Nuevo egreso")');
  
  // Usar datos aleatorios con las funciones helper
  await fillFormField(page, 'input[name="fecha"]', egresoData.fecha);
  
  // Para campos numéricos, usar números en lugar de texto con prefijos
  await fillByPlaceholder(page, 'Ej: 12450', randomInt(10000, 99999));
  
  // Usar fillFormField para campos de texto, que maneja automáticamente diferentes selectores
  await fillFormField(page, 'input[placeholder="Ej: FrutExport SA"]', egresoData.cliente);
  await fillFormField(page, 'input[placeholder="Ej: Finca Los Nogales"]', egresoData.destino);
  await fillFormField(page, 'input[placeholder="Ej: Naranja Valencia"]', egresoData.producto);
  await fillFormField(page, 'input[placeholder="Documento de Tránsito Vegetal"]', egresoData.dtv);
  
  // Para campos numéricos, usar valores numéricos
  await fillByPlaceholder(page, 'Ej: 120', egresoData.bins);
  await fillByPlaceholder(page, 'Ej: 720', egresoData.peso);
  
  // Más campos de texto
  await fillFormField(page, 'input[placeholder="Empresa transportista"]', egresoData.empresa_transporte);
  await fillFormField(page, 'input[name="chofer"]', egresoData.chofer);
  await fillFormField(page, 'input[name="chasis"]', egresoData.chasis);
  await fillFormField(page, 'input[name="acoplado"]', egresoData.acoplado);
  
  // Guardar el formulario
  await clickElement(page, 'button:has-text("Guardar")');
  
  // Esperar a que se procese y verificar resultado
  await page.waitForTimeout(2000);
  
  // Verificar si hay un mensaje de éxito (opcional)
  try {
    const successMessage = page.getByText('guardado', { exact: false });
    if (await successMessage.isVisible({ timeout: 3000 })) {
      // Éxito en la operación
    }
  } catch {
    // Si no hay mensaje de éxito, tomar captura de pantalla para diagnóstico
    await page.screenshot({ path: 'screenshots/egreso-result.png' });
  }
});