import { Page, expect } from '@playwright/test';

/**
 * Realiza el inicio de sesión en la aplicación
 */
export async function login(page: Page, email: string = 'frantrivelloni@gmail.com', password: string = '12345678') {

  await page.goto('https://seedor-1.vercel.app/login');
  
  // Rellenar los campos de login
  await page.getByRole('textbox', { name: 'Email' }).click();
  await page.getByRole('textbox', { name: 'Email' }).fill(email);
  await page.getByRole('textbox', { name: 'Contraseña' }).click();
  await page.getByRole('textbox', { name: 'Contraseña' }).fill(password);
  
  // Hacer clic en el botón de login
  await page.getByRole('button', { name: 'Ingresar' }).click();
  
  try {
    await page.waitForURL(/.*dashboard.*|.*home.*/, { timeout: 10000 });
  } catch (error) {
    console.log('No se pudo detectar la redirección a dashboard o home, continuando de todos modos');
    await page.screenshot({ path: 'screenshots/login-error.png' });
  }
}