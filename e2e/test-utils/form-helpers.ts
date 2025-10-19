import { Page } from '@playwright/test';

export async function fillFormField(
  page: Page,
  selector: string,
  value: string | number,
  options: {
    timeout?: number;
    takeScreenshot?: boolean;
    screenshotPrefix?: string;
    required?: boolean;
  } = {}
): Promise<boolean> {
  const {
    timeout = 5000,
    takeScreenshot = true,
    screenshotPrefix = 'form-field',
    required = false
  } = options;

  const exists = await page.locator(selector).count() > 0;
  if (!exists) {
    if (required) {
      if (takeScreenshot) await page.screenshot({ path: `screenshots/${screenshotPrefix}-not-found-${Date.now()}.png` });
      throw new Error(`Elemento requerido no encontrado: ${selector}`);
    }
    return false;
  }

  try {
    try {
      await page.evaluate((opts: any) => {
        const sel = opts.sel as string;
        const element = document.querySelector(sel);
        if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, { sel: selector });
      await page.waitForTimeout(300);
    } catch (e) {
      // ignore
    }

    try {
      await page.locator(selector).click({ timeout: timeout / 3 });
      await page.locator(selector).fill(value.toString());
      return true;
    } catch (e) {
      try {
        await page.locator(selector).click({ force: true, timeout: timeout / 3 });
        await page.locator(selector).fill(value.toString());
        return true;
      } catch (e2) {
        try {
          await page.evaluate((opts: any) => {
            const sel = opts.sel as string;
            const val = opts.val;
            const element = document.querySelector(sel) as HTMLInputElement | null;
            if (!element) return false;
            const isNumberInput = element.type === 'number';
            if (isNumberInput) {
              const numVal = parseFloat(val);
              element.value = !isNaN(numVal) ? numVal.toString() : '0';
            } else {
              element.value = val;
            }
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));
            return true;
          }, { sel: selector, val: value.toString() });
          return true;
        } catch (e3) {
          if (takeScreenshot) await page.screenshot({ path: `screenshots/${screenshotPrefix}-error-${Date.now()}.png` });
          if (required) throw new Error(`No se pudo rellenar el campo requerido: ${selector}`);
          return false;
        }
      }
    }
  } catch (err) {
    if (takeScreenshot) await page.screenshot({ path: `screenshots/${screenshotPrefix}-general-error-${Date.now()}.png` });
    if (required) throw new Error(`Error al rellenar campo requerido: ${selector}`);
    return false;
  }
}

export async function fillByPlaceholder(
  page: Page,
  placeholder: string,
  value: string | number,
  options: {
    timeout?: number;
    takeScreenshot?: boolean;
    screenshotPrefix?: string;
    required?: boolean;
  } = {}
): Promise<boolean> {
  const {
    timeout = 5000,
    takeScreenshot = true,
    screenshotPrefix = 'placeholder-field',
    required = false
  } = options;

  const exists = await page.getByPlaceholder(placeholder).count() > 0;
  if (!exists) {
    if (required) {
      if (takeScreenshot) await page.screenshot({ path: `screenshots/${screenshotPrefix}-not-found-${Date.now()}.png` });
      throw new Error(`Elemento con placeholder requerido no encontrado: "${placeholder}"`);
    }
    return false;
  }

  try {
    try {
      await page.evaluate((opts: any) => {
        const ph = opts.ph as string;
        const element = document.querySelector(`input[placeholder="${ph}"]`);
        if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, { ph: placeholder });
      await page.waitForTimeout(300);
    } catch (e) {}

    try {
      await page.getByPlaceholder(placeholder).click({ timeout: timeout / 3 });
      await page.getByPlaceholder(placeholder).fill(value.toString());
      return true;
    } catch (e) {
      try {
        await page.getByPlaceholder(placeholder).click({ force: true, timeout: timeout / 3 });
        await page.getByPlaceholder(placeholder).fill(value.toString());
        return true;
      } catch (e2) {
        try {
          await page.evaluate((opts: any) => {
            const ph = opts.ph as string;
            const val = opts.val;
            const element = document.querySelector(`input[placeholder="${ph}"]`) as HTMLInputElement | null;
            if (!element) return false;
            const isNumberInput = element.type === 'number';
            if (isNumberInput) {
              const numVal = parseFloat(val);
              element.value = !isNaN(numVal) ? numVal.toString() : '0';
            } else {
              element.value = val;
            }
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));
            return true;
          }, { ph: placeholder, val: value.toString() });
          return true;
        } catch (e3) {
          if (takeScreenshot) await page.screenshot({ path: `screenshots/${screenshotPrefix}-error-${Date.now()}.png` });
          if (required) throw new Error(`No se pudo rellenar el campo con placeholder requerido: "${placeholder}"`);
          return false;
        }
      }
    }
  } catch (err) {
    if (takeScreenshot) await page.screenshot({ path: `screenshots/${screenshotPrefix}-general-error-${Date.now()}.png` });
    if (required) throw new Error(`Error al rellenar campo con placeholder requerido: "${placeholder}"`);
    return false;
  }
}

export async function clickElement(
  page: Page,
  selector: string,
  options: {
    timeout?: number;
    takeScreenshot?: boolean;
    screenshotPrefix?: string;
    required?: boolean;
    text?: string;
  } = {}
): Promise<boolean> {
  const {
    timeout = 5000,
    takeScreenshot = true,
    screenshotPrefix = 'click-element',
    required = false,
    text
  } = options;

  let locator;
  if (text) locator = page.locator(selector, { hasText: text }); else locator = page.locator(selector);
  const exists = await locator.count() > 0;
  if (!exists) {
    if (required) {
      if (takeScreenshot) await page.screenshot({ path: `screenshots/${screenshotPrefix}-not-found-${Date.now()}.png` });
      throw new Error(`Elemento requerido no encontrado: ${selector}${text ? ` con texto "${text}"` : ''}`);
    }
    return false;
  }

  try {
    try {
      await page.evaluate((opts: any) => {
        const sel = opts.sel as string;
        const txt = opts.txt as string | undefined;
        let element: Element | undefined;
        if (txt) {
          const elements = Array.from(document.querySelectorAll(sel));
          element = elements.find(el => el.textContent && el.textContent.includes(txt));
        } else {
          element = document.querySelector(sel) || undefined;
        }
        if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, { sel: selector, txt: text });
      await page.waitForTimeout(300);
    } catch (e) {}

    try {
      await locator.click({ timeout: timeout / 3 });
      return true;
    } catch (e) {
      try {
        await locator.click({ force: true, timeout: timeout / 3 });
        return true;
      } catch (e2) {
        try {
          await page.evaluate((opts: any) => {
            const sel = opts.sel as string;
            const txt = opts.txt as string | undefined;
            let element: Element | undefined;
            if (txt) {
              const elements = Array.from(document.querySelectorAll(sel));
              element = elements.find(el => el.textContent && el.textContent.includes(txt));
            } else {
              element = document.querySelector(sel) || undefined;
            }
            if (element) {
              (element as HTMLElement).click();
              return true;
            }
            return false;
          }, { sel: selector, txt: text });
          return true;
        } catch (e3) {
          if (takeScreenshot) await page.screenshot({ path: `screenshots/${screenshotPrefix}-error-${Date.now()}.png` });
          if (required) throw new Error(`No se pudo hacer clic en el elemento requerido: ${selector}${text ? ` con texto "${text}"` : ''}`);
          return false;
        }
      }
    }
  } catch (err) {
    if (takeScreenshot) await page.screenshot({ path: `screenshots/${screenshotPrefix}-general-error-${Date.now()}.png` });
    if (required) throw new Error(`Error al hacer clic en elemento requerido: ${selector}${text ? ` con texto "${text}"` : ''}`);
    return false;
  }
}