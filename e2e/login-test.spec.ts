import { test, expect } from '@playwright/test';
import { login } from './test-utils/test-utils';

test('login successful', async ({ page }) => {
  await login(page);
  
  await expect(page).toHaveURL(/.*home.*/);
});