import { z } from "zod";

export const companySchema = z.object({
  razon_social: z.string().trim().min(2, "Mínimo 2 caracteres").max(200),
  nombre_comercial: z.string().trim().max(200).default(""),
  nit: z.string().trim().max(30).default(""),
  tipo: z.string().trim().max(80).default(""),
  industria: z.string().trim().max(120).default(""),
  direccion: z.string().trim().max(300).default(""),
  ciudad: z.string().trim().max(120).default(""),
  pais: z.string().trim().max(120).default(""),
  telefono: z.string().trim().max(40).default(""),
  email: z.string().trim().max(200).default("").refine((v) => v === "" || /.+@.+\..+/.test(v), "Email inválido"),
  website: z.string().trim().max(200).default(""),
  notas: z.string().trim().max(2000).default(""),
});

export const contactSchema = z.object({
  nombre: z.string().trim().min(2, "Mínimo 2 caracteres").max(120),
  apellido: z.string().trim().max(120).default(""),
  email: z.string().trim().max(200).default("").refine((v) => v === "" || /.+@.+\..+/.test(v), "Email inválido"),
  telefono: z.string().trim().max(40).default(""),
  cargo: z.string().trim().max(120).default(""),
  estado: z.enum(["activo", "inactivo", "potencial"]).default("activo"),
  notas: z.string().trim().max(2000).default(""),
  rol_cliente: z.enum(["administrador","tecnico","finanzas","gerente","comercial","usuario_final","lectura"]),
});

export const timeEntrySchema = z.object({
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
  descripcion: z.string().trim().min(3, "Agrega una descripción").max(2000),
});
