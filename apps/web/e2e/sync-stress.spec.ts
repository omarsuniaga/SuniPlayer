import { test, expect } from '@playwright/test';

test.describe('SyncEnsemble Exhaustive Stress Test', () => {
    test.setTimeout(90000);

    test('should synchronize instances', async ({ browser }) => {
        const leaderContext = await browser.newContext();
        const leaderPage = await leaderContext.newPage();
        const APP_URL = 'http://localhost:5173';

        console.log('--- [Stress Test] Cargando App ---');
        await leaderPage.goto(APP_URL);
        
        // Esperar al botón de Sync que es parte de nuestra feature
        const syncBtn = leaderPage.locator('.sync-btn');
        await syncBtn.waitFor({ state: 'visible', timeout: 45000 });
        console.log('--- [Stress Test] App Lista ---');

        await syncBtn.click();
        await leaderPage.click('text=CREAR NUEVA SESIÓN');
        
        const sessionIdElement = leaderPage.getByTestId('session-id-display');
        await expect(sessionIdElement).not.toBeEmpty();
        const sessionId = await sessionIdElement.textContent();
        console.log(`--- [Stress Test] Sala: ${sessionId} ---`);

        // Seguidor
        const followerContext = await browser.newContext();
        const followerPage = await followerContext.newPage();
        await followerPage.goto(APP_URL);
        await followerPage.locator('.sync-btn').click();
        await followerPage.fill('input[placeholder="CÓDIGO"]', sessionId!);
        await followerPage.click('button:has-text("OK")');

        console.log('--- [Stress Test] Esperando SYNCED ---');
        await expect(followerPage.getByTestId('sync-status-display')).toHaveText('SYNCED', { timeout: 45000 });
        
        console.log('--- [Stress Test] ¡ÉXITO! Sincronía alcanzada. ---');
        
        await leaderContext.close();
        await followerContext.close();
    });
});
