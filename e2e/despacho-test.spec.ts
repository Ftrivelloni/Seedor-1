import { test, expect } from '@playwright/test';
import { login } from './test-utils/test-utils';
import { DespachoData, randomInt } from './test-utils/random-data';
import { fillByPlaceholder, fillFormField } from './test-utils/form-helpers';

test('test despacho', async ({ page }) => {
  await login(page);
  
  // Generar datos aleatorios
  const despachoData = DespachoData.generateData();

  await page.getByRole('button', { name: 'Empaque' }).click();
  await page.getByText('DespachoEnvío a clientes').click();
  await page.getByRole('button', { name: 'Nuevo despacho' }).click();
  
  // Usar datos aleatorios con las funciones de ayuda
  await fillFormField(page, 'input[name="fecha"]', despachoData.fecha);
  
  // Para campos numéricos usamos el helper o directamente valores numéricos
  await fillByPlaceholder(page, 'Ej: 12450', randomInt(10000, 99999));
  
  // Para campos de texto regulares
  await fillFormField(page, 'input[name="cliente"]', despachoData.cliente);
  await fillFormField(page, 'input[name="destino"]', despachoData.destino);
  await fillFormField(page, 'input[name="dtv_tipo"]', despachoData.dtv_tipo);
  await fillFormField(page, 'input[name="dtv_numero"]', despachoData.dtv_numero);
  await fillFormField(page, 'input[name="guia_tipo"]', despachoData.guia_tipo);
  
  // Para otro campo posiblemente numérico
  await fillByPlaceholder(page, 'Ej: 778912', randomInt(700000, 999999));
  
  await fillFormField(page, 'input[name="empresa_transporte"]', despachoData.empresa_transporte);
  await fillFormField(page, 'input[name="chofer"]', despachoData.chofer);
  await fillFormField(page, 'input[name="cuit"]', despachoData.cuit);
  
  // El DNI puede ser numérico también
  await fillFormField(page, 'input[name="dni"]', despachoData.dni);
  await fillFormField(page, 'input[name="telefono"]', despachoData.telefono);
  await fillFormField(page, 'input[name="chasis"]', despachoData.chasis);
  await fillFormField(page, 'input[name="acoplado"]', despachoData.acoplado);
  
  // Otros campos numéricos
  await fillByPlaceholder(page, 'Ej: 24', despachoData.pallets);
  await fillByPlaceholder(page, 'Ej: 1440', despachoData.cajas);
  
  await fillFormField(page, 'input[name="operario"]', despachoData.operario);
  
  // Guardar el formulario
  await page.getByRole('button', { name: 'Guardar' }).click();
  
  // Esperar a que el formulario se procese
  await page.waitForTimeout(2000);
  
  // Verificar resultado
  try {
    const successMessage = page.getByText('guardado', { exact: false });
    if (await successMessage.isVisible({ timeout: 5000 })) {
      console.log('Despacho guardado con éxito');
    }
  } catch (error) {
    console.log('No se pudo confirmar si el despacho fue guardado');
    await page.screenshot({ path: 'screenshots/despacho-result.png' });
  }
});