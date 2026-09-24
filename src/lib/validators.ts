import { z } from "zod";

export const companySchema = z.object({
  razon_social: z.string().trim().min(2, "Mínimo 2 caracteres").max(200),
  nit: z.string().trim().max(30).default(""),
  email: z.string().trim().max(200).default("").refine((v) => v === "" || /.+@.+\..+/.test(v), "Email inválido"),
  telefono: z.string().trim().max(40).default(""),
  ciudad: z.string().trim().max(120).default(""),
});

export const contactSchema = z.object({
  nombre: z.string().trim().min(2, "Mínimo 2 caracteres").max(120),
  email: z.string().trim().email("Email inválido").max(200).optional().or(z.literal("")),
  rol_cliente: z.enum(["administrador","tecnico","finanzas","gerente","comercial","usuario_final","lectura"]),
});

export const timeEntrySchema = z.object({
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
  descripcion: z.string().trim().min(3, "Agrega una descripción").max(2000),
});
