/**
 * Interface para representar uma Turma
 */
export interface Turma {
  id: number;
  nome: string;
  curso_id: number;
  dias_semana?: string;
  horario_inicio?: string;
  horario_fim?: string;
  vagas_totais?: number;
  vagas_restantes?: number;
  ativo: boolean;
}
