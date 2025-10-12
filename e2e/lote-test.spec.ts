import { test, expect } from '@playwright/test';
import { login } from './test-utils/test-utils';
import { randomInt, randomFromArray, randomString, randomDate } from './test-utils/random-data';
import { fillFormField, clickElement } from './test-utils/form-helpers';

test('test lote', async ({ page }) => {
  // Realizar login
  await login(page);
  
  // Generar datos aleatorios para el lote
  const loteData = {
    codigo: `Lote ${randomString(1)}-${randomInt(10, 99)}`,
    cultivo: randomFromArray(['Naranja', 'Limón', 'Mandarina', 'Pomelo', 'Uva', 'Manzana', 'Pera']),
    variedad: randomFromArray(['Valencia', 'Eureka', 'Nova', 'Star Ruby', 'Malbec', 'Red Delicious', 'Williams']),
    area: randomInt(5, 50),
    fechaPlantacion: `0${randomInt(1,9)}/0${randomInt(1,9)}/${randomInt(2020, 2025)}`, // formato mm/dd/yyyy
    estado: 'Activo'
  };

  // Navegar a la sección de Campo
  await page.getByRole('button', { name: 'Campo' }).click();
  
  // Esperar a que la página se cargue completamente
  await page.waitForTimeout(1000);
  
  // Intentar hacer clic en el primer campo visible
  try {
    // Buscar cualquier elemento que parezca un campo y hacer clic
    await page.locator('div').filter({ hasText: /Campo/ }).first().click();
    await page.waitForTimeout(1000);
  } catch (e) {
    // Si falla, intentar otra estrategia - buscar cualquier elemento clickeable
    try {
      const clickables = await page.$$('div[role="button"], button, a, tr');
      if (clickables.length > 0) {
        await clickables[0].click();
        await page.waitForTimeout(1000);
      }
    } catch (e2) {
      // Ignorar error y continuar
    }
  }
  
  // Buscar y hacer clic en el botón para agregar un lote usando enfoque más directo
  try {
    // Buscar botones con texto "Agregar" o "Crear" o con ícono +
    await page.locator('button:has-text("Agregar"), button:has-text("Crear"), button:has-text("+")').first().click();
  } catch (e) {
    // Si falla, buscar cualquier botón que parezca ser de acción
    try {
      const addButtons = await page.$$('button.primary, button.add, button[aria-label*="agregar"]');
      if (addButtons.length > 0) {
        await addButtons[0].click();
      } else {
        // Último recurso: buscar el primer botón visible que no sea de navegación
        const buttons = await page.$$('button');
        if (buttons.length > 0) {
          await buttons[buttons.length - 1].click(); // Probar con el último botón
        }
      }
    } catch (e2) {
      // Ignorar y continuar
    }
  }
  
  // Esperar a que el modal se abra
  await page.waitForTimeout(1000);
  
  // Verificar si el modal está abierto buscando elementos del formulario
  const formVisible = await page.locator('input[placeholder], select, textarea').count() > 0;
  
  if (!formVisible) {
    // Si el formulario no está visible, intentar abrir el modal nuevamente usando JavaScript
    await page.evaluate(() => {
      // Buscar cualquier botón que podría abrir el modal
      const buttons = Array.from(document.querySelectorAll('button'));
      let clicked = false;
      
      for (const button of buttons) {
        if (button.textContent && 
            (button.textContent.includes('Agregar') || 
             button.textContent.includes('Nuevo') ||
             button.textContent.includes('Crear') ||
             button.textContent.includes('+'))) {
          (button as HTMLButtonElement).click();
          clicked = true;
          break;
        }
      }
      
      return clicked;
    });
    
    // Esperar a que aparezca el modal
    await page.waitForTimeout(1000);
  }
  
  // Ahora intentamos rellenar el formulario directamente usando el modelo de datos
  // en lugar de confiar en los selectores específicos
  
  try {
    // Intentar identificar los campos por su orden (1°, 2°, 3°, etc.)
    const inputs = await page.$$('input');
    
    // Si encontramos suficientes campos, rellenarlos en orden
    if (inputs.length >= 3) {
      // Primer campo - Código
      await inputs[0].fill(loteData.codigo);
      
      // Segundo campo - Cultivo
      await inputs[1].fill(loteData.cultivo);
      
      // Tercer campo - Variedad (si existe)
      if (inputs.length >= 3) {
        await inputs[2].fill(loteData.variedad);
      }
      
      // Cuarto campo - Área (si existe)
      if (inputs.length >= 4) {
        // Para campos numéricos, usar evaluateHandle
        await page.evaluateHandle((el, val) => {
          (el as HTMLInputElement).value = val.toString();
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        }, inputs[3], loteData.area);
      }
      
      // Quinto campo - Fecha (si existe)
      if (inputs.length >= 5) {
        await inputs[4].fill(loteData.fechaPlantacion);
      }
    }
  } catch (e) {
    // Si falla el enfoque por orden, intentamos el enfoque basado en placeholders/etiquetas
    // Intentar rellenar el formulario usando JavaScript directamente
    await page.evaluate((data) => {
      // Buscar inputs por sus placeholders o etiquetas cercanas
      const allInputs = document.querySelectorAll('input, textarea, select');
      
      for (const input of allInputs) {
        // Obtener el placeholder o la etiqueta cercana
        const placeholder = (input as HTMLInputElement).placeholder || '';
        const nearbyLabel = input.previousElementSibling?.textContent || 
                          input.parentElement?.previousElementSibling?.textContent || '';
        
        // Determinar qué campo es basado en el placeholder o etiqueta
        if (placeholder.includes('Lote') || nearbyLabel.includes('Código') || nearbyLabel.includes('Lote')) {
          (input as HTMLInputElement).value = data.codigo;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        } 
        else if (placeholder.includes('Manzanas') || nearbyLabel.includes('Cultivo')) {
          (input as HTMLInputElement).value = data.cultivo;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
        else if (placeholder.includes('Delicious') || nearbyLabel.includes('Variedad')) {
          (input as HTMLInputElement).value = data.variedad;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
        else if (placeholder.includes('5.5') || nearbyLabel.includes('Área') || nearbyLabel.includes('Area')) {
          (input as HTMLInputElement).value = data.area.toString();
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
        else if (placeholder.includes('mm/dd') || nearbyLabel.includes('Fecha')) {
          (input as HTMLInputElement).value = data.fechaPlantacion;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
      
      // Para el estado (dropdown), buscar selects
      const selects = document.querySelectorAll('select');
      for (const select of selects) {
        if (select.parentElement?.textContent?.includes('Estado')) {
          select.value = 'Activo';
          select.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
    }, loteData);
  }
  
  // Buscar el botón para guardar en el modal
  try {
    // Buscar el botón con texto "Cargar Lote" (es el texto exacto que se ve en la imagen)
    await page.getByRole('button', { name: 'Cargar Lote' }).click();
  } catch (e) {
    try {
      // Alternativa: buscar otros textos comunes para botones de guardar
      await page.getByRole('button', { name: /guardar|crear|aceptar/i }).click();
    } catch (e2) {
      // Último recurso: hacer clic en el último botón del modal
      await page.evaluate(() => {
        const modal = document.querySelector('div[role="dialog"]');
        if (modal) {
          const buttons = modal.querySelectorAll('button');
          if (buttons.length > 0) {
            (buttons[buttons.length - 1] as HTMLButtonElement).click();
          }
        }
      });
    }
  }
  
  // Esperar a que se procese la creación
  await page.waitForTimeout(2000);
  
  // Verificar que el lote se haya creado exitosamente
  let creationSuccessful = false;
  
  // Buscar el código del lote en la página
  try {
    const loteElement = page.getByText(loteData.codigo, { exact: true });
    if (await loteElement.count() > 0) {
      creationSuccessful = true;
    }
  } catch (e) {
    // Continuar con otras verificaciones
  }
  
  // Buscar cualquier mensaje de confirmación
  if (!creationSuccessful) {
    try {
      const successMessage = page.getByText(/creado|éxito|success|exitosamente|guardado|cargado/i);
      if (await successMessage.count() > 0 && await successMessage.isVisible({ timeout: 2000 })) {
        creationSuccessful = true;
      }
    } catch (e) {
      // No se encontró mensaje de éxito
    }
  }
  
  // Si no hay evidencia de éxito, hacer fallar el test
  if (!creationSuccessful) {
    throw new Error(`No se pudo confirmar la creación del lote ${loteData.codigo}`);
  }
});