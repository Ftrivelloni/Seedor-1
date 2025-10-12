import { test, expect } from '@playwright/test';
import { login } from './test-utils/test-utils';
import { PreprocesoData } from './test-utils/random-data';

test('test preproceso', async ({ page }) => {
  await login(page);
  
  // Generar datos aleatorios
  const preprocesoData = PreprocesoData.generateData();

  await page.getByRole('button', { name: 'Empaque' }).click();
  await page.getByText('PreprocesoPreparación y').click();
  await page.getByRole('button', { name: 'Nuevo preproceso' }).click();
  
  // Usar datos aleatorios
  await page.getByPlaceholder('Ej: 34').fill(preprocesoData.semana.toString());
  await page.getByRole('textbox').fill(preprocesoData.fecha);
  await page.getByPlaceholder('Ej: 3.5').click();
  await page.getByPlaceholder('Ej: 3.5').fill(preprocesoData.duracion.toString());
  await page.getByPlaceholder('Ej: 12').click();
  await page.getByPlaceholder('Ej: 12').fill(preprocesoData.ritmo_maquina.toString());
  await page.getByPlaceholder('Ej: 25').click();
  await page.getByPlaceholder('Ej: 25').fill(preprocesoData.bins_procesados.toString());
  await page.getByPlaceholder('Ej: 2', { exact: true }).click();
  await page.getByPlaceholder('Ej: 2', { exact: true }).fill(preprocesoData.merma.toString());
  await page.getByText('GeneralesSemana *Fecha *Duración (h) *Ritmo de máquina (bin/h) *ProcesoBins').click();
  await page.locator('input[name="bin_pleno"]').click();
  await page.locator('input[name="bin_pleno"]').fill(preprocesoData.bin_pleno.toString());
  await page.locator('input[name="bin_intermedio_I"]').click();
  await page.locator('input[name="bin_intermedio_I"]').fill(preprocesoData.bin_intermedio_I.toString());
  await page.locator('input[name="bin_intermedio_II"]').click();
  await page.locator('input[name="bin_intermedio_II"]').fill(preprocesoData.bin_intermedio_II.toString());
  await page.locator('input[name="bin_incipiente"]').click();
  await page.locator('input[name="bin_incipiente"]').fill(preprocesoData.bin_incipiente.toString());
  await page.locator('input[name="cant_personal"]').click();
  await page.locator('input[name="cant_personal"]').fill(preprocesoData.cant_personal.toString());
  await page.getByRole('button', { name: 'Guardar' }).click();
});