import { test, expect } from '@playwright/test';

test.describe('Carrozzeria Motta - Test E2E', () => {
  test('Login come Admin e navigazione', async ({ page }) => {
    // Vai direttamente al login
    await page.goto('http://localhost:3000/auth/login');

    // Compila form di login
    await page.fill('input[type="email"]', 'admin@carrozzeriamotta.it');
    await page.fill('input[type="password"]', 'admin123');

    // Click su login
    await page.click('button[type="submit"]');

    // Attendi redirect a dashboard admin
    await page.waitForURL('**/admin', { timeout: 10000 });

    // Verifica che siamo nella dashboard
    await expect(page.locator('h1')).toContainText('Dashboard');
    
    // Test navigazione Clienti
    await page.click('a[href="/admin/clienti"]');
    await expect(page).toHaveURL(/.*clienti/);
    await expect(page.locator('h1')).toContainText('Gestione Clienti');
    
    // Test apertura modal Nuovo Cliente
    await page.click('button:has-text("Nuovo Cliente")');
    await expect(page.locator('h3:has-text("Nuovo Cliente")')).toBeVisible();

    // Chiudi modal
    await page.click('button:has-text("Annulla")');
    
    // Test navigazione Veicoli
    await page.click('a[href="/admin/veicoli"]');
    await expect(page).toHaveURL(/.*veicoli/);
    await expect(page.locator('h1')).toContainText('Gestione Veicoli');
    
    // Test navigazione Ordini di Lavoro
    await page.click('a[href="/admin/ordini-lavoro"]');
    await expect(page).toHaveURL(/.*ordini-lavoro/);
    await expect(page.locator('h1')).toContainText('Ordini di Lavoro');
    
    // Test navigazione Calendario
    await page.click('a[href="/admin/calendario"]');
    await expect(page).toHaveURL(/.*calendario/);
    await expect(page.locator('h1')).toContainText('Calendario');
    
    // Test navigazione Preventivi
    await page.click('a[href="/admin/preventivi"]');
    await expect(page).toHaveURL(/.*preventivi/);
    await expect(page.locator('h1')).toContainText('Preventivi');
    
    // Test navigazione Fatture
    await page.click('a[href="/admin/fatture"]');
    await expect(page).toHaveURL(/.*fatture/);
    await expect(page.locator('h1')).toContainText('Fatture');
  });

  test('Creazione nuovo cliente', async ({ page }) => {
    // Login
    await page.goto('http://localhost:3000/auth/login');
    await page.fill('input[type="email"]', 'admin@carrozzeriamotta.it');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin', { timeout: 10000 });

    // Vai a Clienti
    await page.click('a[href="/admin/clienti"]');
    await page.waitForURL('**/clienti', { timeout: 10000 });

    // Apri modal
    await page.click('button:has-text("Nuovo Cliente")');

    // Attendi che il modal sia visibile
    await page.waitForSelector('text=Nuovo Cliente', { timeout: 5000 });

    // Compila form - usa selettori più specifici
    const modal = page.locator('div.fixed');
    await modal.locator('input').nth(0).fill('Test');
    await modal.locator('input').nth(1).fill('Utente');

    // Salva
    await modal.locator('button[type="submit"]').click();

    // Verifica toast di successo
    await expect(page.locator('text=Cliente creato con successo')).toBeVisible({ timeout: 5000 });
  });

  test('Login come Dipendente', async ({ page }) => {
    // Vai al login
    await page.goto('http://localhost:3000/auth/login');
    
    // Login come dipendente
    await page.fill('input[type="email"]', 'dipendente@carrozzeriamotta.it');
    await page.fill('input[type="password"]', 'dipendente123');
    await page.click('button[type="submit"]');
    
    // Verifica redirect a dashboard employee
    await page.waitForURL('**/employee');
    await expect(page.locator('h1')).toContainText('Dashboard Dipendente');
    
    // Verifica che non ci sia accesso admin
    await expect(page.locator('a[href="/admin/clienti"]')).not.toBeVisible();
    
    // Test navigazione I Miei Ordini
    await page.click('a[href="/employee/ordini"]');
    await expect(page).toHaveURL(/.*employee\/ordini/);
    await expect(page.locator('h1')).toContainText('I Miei Ordini');
  });

  test('Visualizza dettagli ordine (Employee)', async ({ page }) => {
    // Login come dipendente
    await page.goto('http://localhost:3000/auth/login');
    await page.fill('input[type="email"]', 'dipendente@carrozzeriamotta.it');
    await page.fill('input[type="password"]', 'dipendente123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/employee', { timeout: 10000 });

    // Vai a I Miei Ordini
    await page.click('a[href="/employee/ordini"]');
    await page.waitForURL('**/ordini', { timeout: 10000 });

    // Verifica che ci siano ordini nella tabella
    await expect(page.locator('table')).toBeVisible();
  });

  test('Logout', async ({ page }) => {
    // Login
    await page.goto('http://localhost:3000/auth/login');
    await page.fill('input[type="email"]', 'admin@carrozzeriamotta.it');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin', { timeout: 10000 });

    // Click logout - cerca il bottone nel header
    await page.locator('button').filter({ hasText: 'Logout' }).click();

    // Verifica redirect a login
    await expect(page).toHaveURL(/.*login/, { timeout: 10000 });
  });
});
