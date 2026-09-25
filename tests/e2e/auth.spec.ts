import { test, expect } from "@playwright/test";

test("login renderiza formulario", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Ingresar" })).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
});

for (const route of ["/dashboard", "/crm", "/horas", "/tickets", "/proyectos", "/usuarios", "/auditoria", "/perfil", "/documentos", "/notificaciones", "/servicio", "/reportes", "/ajustes", "/kb"]) {
  test(`${route} sin sesión redirige a /login`, async ({ page }) => {
    await page.goto(route);
    await expect(page).toHaveURL(/\/login/);
  });
}
