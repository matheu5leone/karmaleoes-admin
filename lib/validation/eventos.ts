import { z } from "zod";

export const eventoSchema = z.object({
  nome: z.string().trim().min(1, "Informe o nome"),
  descricao: z.string().trim().optional().or(z.literal("")),
  categoria: z.string().trim().optional().or(z.literal("")),
  data: z.string().min(1, "Informe a data"),
  horario: z.string().optional().or(z.literal("")),
  local: z.string().trim().optional().or(z.literal("")),
  organizador: z.string().trim().optional().or(z.literal("")),
  link_externo: z.string().trim().optional().or(z.literal("")),
  status_id: z.string().uuid("Selecione o status"),
  prioridade: z.coerce.number().int().min(0).default(0),
  nova_data: z.string().optional().or(z.literal("")),
});
export type EventoInput = z.infer<typeof eventoSchema>;

export const encerramentoSchema = z.object({
  status_id: z.string().uuid("Selecione o status de encerramento"),
  obs_encerramento: z.string().trim().min(1, "Observação obrigatória"),
});
export type EncerramentoInput = z.infer<typeof encerramentoSchema>;

export const statusEventoSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(1, "Informe o nome")
    .refine((n) => n.toLowerCase() !== "expirado", "Nome reservado"),
  lifecycle: z.enum(["Em aberto", "Encerrado"]),
});
export type StatusEventoInput = z.infer<typeof statusEventoSchema>;

/** Sucesso só na data de referência ou depois (RN-EVENTO-014). Datas ISO yyyy-mm-dd. */
export function sucessoPermitido(dataReferencia: string, hoje: string): boolean {
  return hoje >= dataReferencia;
}

/** Data atual no fuso America/Sao_Paulo, em yyyy-mm-dd. */
export function hojeSaoPaulo(): string {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Sao_Paulo",
  });
}
