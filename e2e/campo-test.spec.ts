import { test, expect } from '@playwright/test';
import { login } from './test-utils/test-utils';
import { randomInt, randomFromArray, randomString } from './test-utils/random-data';
import { fillFormField, clickElement } from './test-utils/form-helpers';

test('test campo', async ({ page }) => {
  // Realizar login
  await login(page);
  
  // Generar datos aleatorios para el campo
  const campoData = {
    nombre: `Campo ${randomFromArray(['Norte', 'Sur', 'Este', 'Oeste', 'Central'])} ${randomString(2)}`,
    ubicacion: `${randomFromArray(['Ruta Provincial', 'Camino Rural', 'Autovía', 'Carretera Nacional'])} ${randomInt(1, 99)}`,
    area: randomInt(50, 500),
    cultivo: randomFromArray(['Naranja', 'Limón', 'Mandarina', 'Pomelo', 'Lima', 'Manzana', 'Pera', 'Durazno']),
    notas: `Notas de prueba para ${randomString(5)}`
  };

  // Navegar a la sección de Campo
  await clickElement(page, 'button', { text: 'Campo', required: true });
  
  // Esperar a que la página se cargue completamente
  await page.waitForTimeout(1000);
  
  // Buscar y hacer clic en el botón para crear un nuevo campo
  // El título del modal es "Crear Nuevo Campo", así que buscamos botones con texto similar
  let buttonFound = await clickElement(page, 'button', { text: 'Crear Nuevo Campo' });
  if (!buttonFound) buttonFound = await clickElement(page, 'button', { text: 'Nuevo Campo' });
  if (!buttonFound) buttonFound = await clickElement(page, 'button', { text: 'Crear Campo' });
  if (!buttonFound) buttonFound = await clickElement(page, 'button', { text: 'Agregar' });
  if (!buttonFound) {
    // Si no encontramos el botón específico, intentamos buscar cualquier botón con un ícono de añadir
    await page.click('button:has([data-testid="AddIcon"])');
  }
  
  // Esperar a que el modal se abra
  await page.waitForTimeout(500);
  
  // Según la imagen, ahora rellenar los campos exactamente como se muestran
  // Campo de Nombre (requerido, tiene un asterisco)
  await page.locator('input[placeholder="Ej: Campo Norte, Finca San José"]').fill(campoData.nombre);
  
  // Campo de Ubicación
  await page.locator('input[placeholder="Ej: Ruta 5 Km 23, Mendoza"]').fill(campoData.ubicacion);
  
  // Campo de Área (hectáreas) - Numérico
  await page.evaluate((value) => {
    const input = document.querySelector('input[placeholder="Ej: 50.5"]') as HTMLInputElement;
    if (input) {
      input.value = value.toString();
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }, campoData.area);
  
  // Campo de Cultivo Principal
  await page.locator('input[placeholder="Ej: Manzanas, Uvas, Trigo"]').fill(campoData.cultivo);
  
  // Campo de Notas (opcional)
  await page.locator('textarea[placeholder="Información adicional sobre el campo..."]').fill(campoData.notas);
  
  // Hacer clic en el botón para guardar/crear
  // En el modal parece haber dos botones, probablemente "Cancelar" y "Crear"
  // Intentamos identificar el botón de crear por su posición (último) o color (primario)
  try {
    // Primero intentamos buscar un botón que diga "Crear" o similar
    const createButton = page.getByRole('button', { name: /crear|guardar|aceptar|añadir/i });
    if (await createButton.count() > 0) {
      await createButton.click();
    } else {
      // Si no lo encontramos, buscamos el último botón en el modal (probablemente el de confirmación)
      const modal = page.locator('div[role="dialog"]');
      const buttons = modal.locator('button');
      const count = await buttons.count();
      if (count > 0) {
        await buttons.nth(count - 1).click(); // Último botón
      } else {
        // Último recurso: hacer clic en cualquier botón con estilo de acción primaria
        await page.locator('button.primary, button[type="submit"]').click();
      }
    }
  } catch (e) {
    // Si todo falla, intentamos con JavaScript
    await page.evaluate(() => {
      const buttons = document.querySelectorAll('div[role="dialog"] button');
      const lastButton = buttons[buttons.length - 1];
      if (lastButton) {
        (lastButton as HTMLButtonElement).click();
      }
    });
  }
  
  // Esperar a que se procese la creación
  await page.waitForTimeout(2000);
  
  // Verificar que el campo se haya creado exitosamente
  let creationSuccessful = false;
  
  // Buscar el nombre del campo en la página (probablemente en una tabla o lista)
  try {
    const fieldElement = page.getByText(campoData.nombre, { exact: true });
    if (await fieldElement.count() > 0) {
      creationSuccessful = true;
    }
  } catch (e) {
    // Continuar con otras verificaciones
  }
  
  // Buscar cualquier mensaje de confirmación
  if (!creationSuccessful) {
    try {
      const successMessage = page.getByText(/creado|éxito|success|exitosamente|guardado/i);
      if (await successMessage.count() > 0 && await successMessage.isVisible({ timeout: 2000 })) {
        creationSuccessful = true;
      }
    } catch (e) {
      // No se encontró mensaje de éxito
    }
  }
  
  // Si no hay evidencia de éxito, hacer fallar el test
  if (!creationSuccessful) {
    throw new Error(`No se pudo confirmar la creación del campo ${campoData.nombre}`);
  }
});