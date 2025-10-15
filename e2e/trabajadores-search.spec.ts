import { test, expect } from '@playwright/test';
import { login } from './test-utils/test-utils';

const empaqueEmail = process.env.E2E_EMPAQUE_EMAIL;
const empaquePassword = process.env.E2E_EMPAQUE_PASSWORD;

test.describe('Trabajadores - Empaque access', () => {
  test.skip(
    !empaqueEmail || !empaquePassword,
    'Configura E2E_EMPAQUE_EMAIL y E2E_EMPAQUE_PASSWORD para ejecutar este suite.'
  );

  test('empaque user can search workers and register attendance', async ({ page }) => {
    await login(page, empaqueEmail as string, empaquePassword as string);

    await page.getByRole('button', { name: 'Trabajadores' }).click();
    await expect(page).toHaveURL(/.*trabajadores.*/);

    const searchInput = page.getByPlaceholder('Buscar por nombre...');
    await expect(searchInput).toBeVisible();

    const workerCard = page.locator('[data-testid="worker-card"]').first();
    await workerCard.waitFor({ state: 'visible', timeout: 10000 });

    const workerName = (await workerCard.locator('h3').innerText()).trim();
    expect(workerName.length).toBeGreaterThan(0);

    const firstWord = workerName.split(/\s+/)[0] || workerName;
    const searchTerm = firstWord.slice(0, Math.min(firstWord.length, 3)) || workerName;

    await searchInput.fill(searchTerm);

    await expect(page.locator('[data-testid="worker-card"]').first().locator('h3')).toContainText(searchTerm, {
      ignoreCase: true,
      timeout: 10000,
    });

    await page.getByRole('tab', { name: 'Tomar Asistencia' }).click();

    const workerSelect = page.getByRole('combobox', { name: 'Trabajador' });
    await workerSelect.click();
    await page.getByRole('option', { name: new RegExp(workerName, 'i') }).click();

    const statusSelect = page.getByRole('combobox', { name: 'Estado de asistencia' });
    await statusSelect.click();
    await page.getByRole('option', { name: 'Presente' }).click();

    await page.getByRole('button', { name: /Asistencia/ }).click();

    await expect(page.getByText('Asistencia guardada correctamente')).toBeVisible();
  });
});
