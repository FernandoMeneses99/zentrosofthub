import { test, expect } from "@playwright/test";

test("login renderiza formulario", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByText("Ingresar al Hub")).toBeVisible();
});

for (const route of ["/dashboard", "/crm", "/horas", "/tickets", "/proyectos", "/usuarios", "/auditoria", "/perfil"]) {
  test(`${route} sin sesión redirige a /login`, async ({ page }) => {
    await page.goto(route);
    await expect(page).toHaveURL(/\/login/);
  });
}
