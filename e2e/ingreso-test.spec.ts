import { test, expect } from '@playwright/test';
import { login } from './test-utils/test-utils';
import { IngresoData, randomInt } from './test-utils/random-data';

// await page.screenshot({ path: 'screenshots/' });

test('ingreso fruta', async ({ page }) => {
  // Login al sistema
  await login(page);
  
  const ingresoData = IngresoData.generateData();
  
  await page.getByRole('button', { name: 'Empaque' }).click();
  await page.getByText('Ingreso FrutaRecepción de').click();
  await page.screenshot({ path: 'screenshots/ingreso-inicio.png' });
  const rowCountBefore = await page.locator('table tbody tr').count();
  await page.getByRole('button', { name: 'Nuevo ingreso' }).click();
  const fechaActual = new Date("2025-10-12");
  const fechaFormateada = `${fechaActual.getFullYear()}-${(fechaActual.getMonth() + 1).toString().padStart(2, '0')}-${fechaActual.getDate().toString().padStart(2, '0')}`;
  await page.locator('fieldset:has-text("Datos generales") input').first().fill(fechaFormateada);
  if (Math.random() > 0.5) {
    await page.locator('input[type="checkbox"]').click();
  }
  const numTicket = randomInt(10000, 99999);
  await page.locator('fieldset:has-text("Datos generales") input[name="num_ticket"]').fill(numTicket.toString());
  await page.waitForTimeout(300);
  const numRemito = randomInt(10000, 99999);
  await page.locator('fieldset:has-text("Datos generales") input[name="num_remito"]').fill(numRemito.toString());
  await page.waitForTimeout(300);
  await page.locator('fieldset:has-text("Datos generales") input[name="productor"]').fill(ingresoData.productor);
  await page.locator('fieldset:has-text("Datos generales") input[name="finca"]').fill(ingresoData.finca);
  
  await page.locator('fieldset:has-text("Datos generales") input[name="producto"]').fill(ingresoData.producto);
  
  await page.locator('fieldset:has-text("Datos generales") input[name="lote"]').fill(ingresoData.lote.toString());
  await page.waitForTimeout(300); 
  await page.locator('fieldset:has-text("Datos generales") input[name="contratista"]').fill(ingresoData.contratista);
  await page.locator('fieldset:has-text("Datos generales") input[name="tipo_cosecha"]').fill(ingresoData.tipo_cosecha);
  await page.locator('fieldset:has-text("Transporte") input[name="transporte"]').fill(ingresoData.transporte);
  await page.locator('fieldset:has-text("Transporte") input[name="chofer"]').fill(ingresoData.chofer);
  await page.locator('fieldset:has-text("Transporte") input[name="chasis"]').fill(ingresoData.chasis);
  await page.locator('fieldset:has-text("Transporte") input[name="acoplado"]').fill(ingresoData.acoplado);
  await page.locator('fieldset:has-text("Transporte") input[name="operario"]').fill(ingresoData.operario);
  const cantBins = randomInt(1, 50);
  await page.locator('fieldset:has-text("Bins y peso") input[name="cant_bin"]').fill(cantBins.toString());
  await page.waitForTimeout(300);
  await page.locator('fieldset:has-text("Bins y peso") input[name="tipo_bin"]').fill(ingresoData.tipo_bin);
  const pesoNeto = randomInt(500, 5000);
  await page.locator('fieldset:has-text("Bins y peso") input[name="peso_neto"]').fill(pesoNeto.toString());
  await page.waitForTimeout(300);

  try {
    // Verificar campo de bins
    const errorMsgBins = await page.locator('fieldset:has-text("Bins y peso") .text-red-600').count();
    if (errorMsgBins > 0) {
      console.log('⚠️ Hay errores en el campo de cantidad de bins');
      await page.screenshot({ path: 'screenshots/error-bins.png' });
    }
    
    // Verificar campo de peso
    const errorMsgPeso = await page.locator('fieldset:has-text("Bins y peso") .text-red-600').count();
    if (errorMsgPeso > 0) {
      console.log('⚠️ Hay errores en el campo de peso neto');
      await page.screenshot({ path: 'screenshots/error-peso.png' });
    }
  } catch (error) {
    console.log('Error al verificar mensajes de validación:', error);
  }
  
  await page.getByRole('button', { name: 'Guardar' }).click();
  await page.waitForTimeout(2000);
  
  const modalVisible = await page.locator('h1:has-text("Nuevo Ingreso de Fruta")').isVisible();
  if (!modalVisible) {
    console.log('Modal de ingreso cerrado exitosamente');
  } else {
    console.log('ALERTA: El modal de ingreso sigue abierto, verificar si hay errores');
    await page.screenshot({ path: 'screenshots/ingreso-modal-error.png' });
  }
  
  try {
    const successMessage = await page.getByText('guardado', { exact: false });
    if (await successMessage.isVisible()) {
      console.log('Mensaje de éxito encontrado: "guardado"');
    }
  } catch (error) {
    console.log('No se encontró mensaje de confirmación');
  }
  
  // Verificar que se haya agregado una fila en la tabla
  await page.waitForTimeout(1000);
  const rowCountAfter = await page.locator('table tbody tr').count();
  console.log(`Número de registros después: ${rowCountAfter}`);
  
  // Tomar captura de la tabla actualizada
  await page.screenshot({ path: 'screenshots/ingreso-tabla-resultado.png' });
  
  try {
    await page.waitForTimeout(1000);
    
    // Verificar datos en la tabla utilizando text selectors más flexibles
    // Buscamos el producto que acabamos de ingresar
    await page.waitForSelector(`tbody tr:has-text("${ingresoData.producto}")`, { timeout: 5000 });
    console.log(`✅ Producto '${ingresoData.producto}' encontrado en la tabla`);
    
    // Verificamos que también se muestre el productor
    await page.waitForSelector(`tbody tr:has-text("${ingresoData.productor}")`, { timeout: 5000 });
    console.log(`✅ Productor '${ingresoData.productor}' encontrado en la tabla`);
    
    // Verificamos el peso neto
    await page.waitForSelector(`tbody tr:has-text("${pesoNeto}")`, { timeout: 5000 });
    console.log(`✅ Peso neto '${pesoNeto}' encontrado en la tabla`);
    
    console.log('✅ Todos los datos fueron verificados correctamente en la tabla');
  } catch (error) {
    console.log('❌ No se pudieron verificar los datos en la tabla');
    console.error(error);
    
    // Tomamos una captura adicional para depuración
    await page.screenshot({ path: 'screenshots/verificacion-tabla-fallida.png' });
    throw new Error('Verificación de datos en tabla fallida: ' + error);
  }
  
  console.log('Test de ingreso completado.');
});