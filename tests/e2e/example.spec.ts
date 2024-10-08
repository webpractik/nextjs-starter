import { expect, test } from '@playwright/test';

test('example', async ({ page }) => {
    await page.goto('http://localhost:3000/');

    await expect(page.getByRole('img', { name: 'logo' })).toBeVisible();

    await expect(page.getByRole('button', { name: 'Кнопка' }).first()).toBeVisible();

    await expect(page.getByRole('main')).toContainText(
        'Этот стартовый комплект нацелен на предоставление разработчикам надежной основы для создания приложений на Next.js, обеспечивая соблюдение лучших практик по качеству кода, стилю и эффективности рабочих процессов.'
    );
});
