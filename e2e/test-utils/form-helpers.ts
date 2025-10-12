import { Page } from '@playwright/test';

/**
 * Rellena un campo de formulario, detectando automáticamente si es un campo numérico o de texto
 * @param page - La instancia de Page de Playwright
 * @param selector - El selector CSS o el localizador para el campo
 * @param value - El valor a ingresar (puede ser texto o número)
 * @param options - Opciones adicionales
 * @returns Promise<boolean> - True si se pudo rellenar el campo, false en caso contrario
 */
export async function fillFormField(
  page: Page, 
  selector: string, 
  value: string | number,
  options: { 
    timeout?: number,
    takeScreenshot?: boolean,
    screenshotPrefix?: string,
    required?: boolean
  } = {}
): Promise<boolean> {
  const { 
    timeout = 5000, 
    takeScreenshot = true,
    screenshotPrefix = 'form-field',
    required = false
  } = options;

  // Verificar si el elemento existe
  const exists = await page.locator(selector).count() > 0;
  
  if (!exists) {
    if (required) {
      if (takeScreenshot) {
        const fileName = `screenshots/${screenshotPrefix}-not-found-${new Date().getTime()}.png`;
        await page.screenshot({ path: fileName });
      }
      throw new Error(`Elemento requerido no encontrado: ${selector}`);
    }
    return false;
  }

  try {
    // Intentar hacer visible y clickeable el elemento
    try {
      // Desplazarse hasta el elemento
      await page.evaluate((sel) => {
        const element = document.querySelector(sel);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, selector);
      
      // Esperar un momento para que termine el desplazamiento
      await page.waitForTimeout(300);
    } catch (e) {
      // Error al desplazarse - continuar de todos modos
    }
    
    // Intento 1: Método estándar
    try {
      await page.locator(selector).click({ timeout: timeout / 3 });
      await page.locator(selector).fill(value.toString());
      return true;
    } catch (e) {
      // Intento 2: Método con force: true
      try {
        await page.locator(selector).click({ force: true, timeout: timeout / 3 });
        await page.locator(selector).fill(value.toString());
        return true;
      } catch (e2) {
        // Intento 3: Método JavaScript directo
        try {
          await page.evaluate((sel, val) => {
            const element = document.querySelector(sel) as HTMLInputElement;
            if (element) {
              // Verificar si es un input de tipo number
              const isNumberInput = element.type === 'number';
              
              // Para inputs numéricos, asegurarse de que el valor sea numérico
              if (isNumberInput) {
                const numVal = parseFloat(val);
                if (!isNaN(numVal)) {
                  element.value = numVal.toString();
                } else {
                  element.value = '0'; // Valor predeterminado si no es numérico
                }
              } else {
                element.value = val;
              }
              
              // Disparar eventos para que React detecte el cambio
              element.dispatchEvent(new Event('input', { bubbles: true }));
              element.dispatchEvent(new Event('change', { bubbles: true }));
              return true;
            }
            return false;
          }, selector, value.toString());
          
          return true;
        } catch (e3) {
          if (takeScreenshot) {
            const fileName = `screenshots/${screenshotPrefix}-error-${new Date().getTime()}.png`;
            await page.screenshot({ path: fileName });
          }
          
          if (required) {
            throw new Error(`No se pudo rellenar el campo requerido: ${selector}`);
          }
          return false;
        }
      }
    }
  } catch (error) {
    if (takeScreenshot) {
      const fileName = `screenshots/${screenshotPrefix}-general-error-${new Date().getTime()}.png`;
      await page.screenshot({ path: fileName });
    }
    
    if (required) {
      throw new Error(`Error al rellenar campo requerido: ${selector}`);
    }
    return false;
  }
}

/**
 * Rellena un campo por su placeholder
 * @param page - La instancia de Page de Playwright
 * @param placeholder - El texto del placeholder
 * @param value - El valor a ingresar
 * @param options - Opciones adicionales
 * @returns Promise<boolean> - True si se pudo rellenar el campo, false en caso contrario
 */
export async function fillByPlaceholder(
  page: Page, 
  placeholder: string, 
  value: string | number,
  options: { 
    timeout?: number,
    takeScreenshot?: boolean,
    screenshotPrefix?: string,
    required?: boolean
  } = {}
): Promise<boolean> {
  const { 
    timeout = 5000, 
    takeScreenshot = true,
    screenshotPrefix = 'placeholder-field',
    required = false
  } = options;

  // Verificar si el elemento existe
  const exists = await page.getByPlaceholder(placeholder).count() > 0;
  
  if (!exists) {
    if (required) {
      if (takeScreenshot) {
        const fileName = `screenshots/${screenshotPrefix}-not-found-${new Date().getTime()}.png`;
        await page.screenshot({ path: fileName });
      }
      throw new Error(`Elemento con placeholder requerido no encontrado: "${placeholder}"`);
    }
    return false;
  }

  try {
    // Intentar hacer visible y clickeable el elemento
    try {
      // Desplazarse hasta el elemento
      await page.evaluate((ph) => {
        const element = document.querySelector(`input[placeholder="${ph}"]`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, placeholder);
      
      // Esperar un momento para que termine el desplazamiento
      await page.waitForTimeout(300);
    } catch (e) {
      // Error al desplazarse - continuar de todos modos
    }
    
    // Intento 1: Método estándar
    try {
      await page.getByPlaceholder(placeholder).click({ timeout: timeout / 3 });
      await page.getByPlaceholder(placeholder).fill(value.toString());
      return true;
    } catch (e) {
      // Intento 2: Método con force: true
      try {
        await page.getByPlaceholder(placeholder).click({ force: true, timeout: timeout / 3 });
        await page.getByPlaceholder(placeholder).fill(value.toString());
        return true;
      } catch (e2) {
        // Intento 3: Método JavaScript directo
        try {
          await page.evaluate((ph, val) => {
            const element = document.querySelector(`input[placeholder="${ph}"]`) as HTMLInputElement;
            if (element) {
              // Verificar si es un input de tipo number
              const isNumberInput = element.type === 'number';
              
              // Para inputs numéricos, asegurarse de que el valor sea numérico
              if (isNumberInput) {
                const numVal = parseFloat(val);
                if (!isNaN(numVal)) {
                  element.value = numVal.toString();
                } else {
                  element.value = '0'; // Valor predeterminado si no es numérico
                }
              } else {
                element.value = val;
              }
              
              // Disparar eventos para que React detecte el cambio
              element.dispatchEvent(new Event('input', { bubbles: true }));
              element.dispatchEvent(new Event('change', { bubbles: true }));
              return true;
            }
            return false;
          }, placeholder, value.toString());
          
          return true;
        } catch (e3) {
          if (takeScreenshot) {
            const fileName = `screenshots/${screenshotPrefix}-error-${new Date().getTime()}.png`;
            await page.screenshot({ path: fileName });
          }
          
          if (required) {
            throw new Error(`No se pudo rellenar el campo con placeholder requerido: "${placeholder}"`);
          }
          return false;
        }
      }
    }
  } catch (error) {
    if (takeScreenshot) {
      const fileName = `screenshots/${screenshotPrefix}-general-error-${new Date().getTime()}.png`;
      await page.screenshot({ path: fileName });
    }
    
    if (required) {
      throw new Error(`Error al rellenar campo con placeholder requerido: "${placeholder}"`);
    }
    return false;
  }
}

/**
 * Hace clic en un elemento identificado por su selector
 * @param page - La instancia de Page de Playwright
 * @param selector - El selector CSS o el localizador para el elemento
 * @param options - Opciones adicionales
 * @returns Promise<boolean> - True si se pudo hacer clic en el elemento, false en caso contrario
 */
export async function clickElement(
  page: Page, 
  selector: string,
  options: { 
    timeout?: number,
    takeScreenshot?: boolean,
    screenshotPrefix?: string,
    required?: boolean,
    text?: string
  } = {}
): Promise<boolean> {
  const { 
    timeout = 5000, 
    takeScreenshot = true,
    screenshotPrefix = 'click-element',
    required = false,
    text
  } = options;

  // Verificar si el elemento existe
  let locator;
  if (text) {
    locator = page.locator(selector, { hasText: text });
  } else {
    locator = page.locator(selector);
  }
  
  const exists = await locator.count() > 0;
  
  if (!exists) {
    if (required) {
      if (takeScreenshot) {
        const fileName = `screenshots/${screenshotPrefix}-not-found-${new Date().getTime()}.png`;
        await page.screenshot({ path: fileName });
      }
      throw new Error(`Elemento requerido no encontrado: ${selector}${text ? ` con texto "${text}"` : ''}`);
    }
    return false;
  }

  try {
    // Intentar hacer visible y clickeable el elemento
    try {
      // Desplazarse hasta el elemento
      await page.evaluate((sel, txt) => {
        let element;
        if (txt) {
          const elements = Array.from(document.querySelectorAll(sel));
          element = elements.find(el => el.textContent && el.textContent.includes(txt));
        } else {
          element = document.querySelector(sel);
        }
        
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, selector, text);
      
      // Esperar un momento para que termine el desplazamiento
      await page.waitForTimeout(300);
    } catch (e) {
      // Error al desplazarse - continuar de todos modos
    }
    
    // Intento 1: Método estándar
    try {
      await locator.click({ timeout: timeout / 3 });
      return true;
    } catch (e) {
      // Intento 2: Método con force: true
      try {
        await locator.click({ force: true, timeout: timeout / 3 });
        return true;
      } catch (e2) {
        // Intento 3: Método JavaScript directo
        try {
          await page.evaluate((sel, txt) => {
            let element;
            if (txt) {
              const elements = Array.from(document.querySelectorAll(sel));
              element = elements.find(el => el.textContent && el.textContent.includes(txt));
            } else {
              element = document.querySelector(sel);
            }
            
            if (element) {
              (element as HTMLElement).click();
              return true;
            }
            return false;
          }, selector, text);
          
          return true;
        } catch (e3) {
          if (takeScreenshot) {
            const fileName = `screenshots/${screenshotPrefix}-error-${new Date().getTime()}.png`;
            await page.screenshot({ path: fileName });
          }
          
          if (required) {
            throw new Error(`No se pudo hacer clic en el elemento requerido: ${selector}${text ? ` con texto "${text}"` : ''}`);
          }
          return false;
        }
      }
    }
  } catch (error) {
    if (takeScreenshot) {
      const fileName = `screenshots/${screenshotPrefix}-general-error-${new Date().getTime()}.png`;
      await page.screenshot({ path: fileName });
    }
    
    if (required) {
      throw new Error(`Error al hacer clic en elemento requerido: ${selector}${text ? ` con texto "${text}"` : ''}`);
    }
    return false;
  }
}