/**
 * Interface para representar uma Turma
 * Suporta ambos os padrões: snake_case (legado) e camelCase (novo)
 */
export interface Turma {
  id: number;
  // Fields legados (snake_case)
  nome?: string;
  curso_id?: number;
  dias_semana?: string;
  horario_inicio?: string;
  horario_fim?: string;
  vagas_totais?: number;
  vagas_restantes?: number;
  ativo?: boolean;
  // Fields novos (camelCase)
  nomeTurma?: string;
  cursoId?: number;
  diaSemana?: string;
  horaInicio?: string;
  horaFim?: string;
  vagasTurma?: number;
  descricao?: string;
  dataInicio?: string;
  dataFim?: string;
}
