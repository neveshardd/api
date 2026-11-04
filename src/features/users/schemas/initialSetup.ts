import { z } from "zod";
import { emailSchema, passwordSchema } from "@/features/auth/schemas/password";

/** Dados do primeiro usuário (validação compartilhada entre cliente e servidor). */
export const initialSetupSchema = z
  .object({
    name: z.string().trim().min(2, "Informe o nome.").max(120),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "As senhas não conferem.",
  });

export type InitialSetupInput = z.infer<typeof initialSetupSchema>;
