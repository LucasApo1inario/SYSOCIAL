import { TurmaResponse } from "./TurmaCreateResponse.interface";

export interface CourseCreateResponse {
  id: string;
  nome: string;
  status: 'Ativo' | 'Inativo';
  vagas: number;
  turmas: TurmaResponse[];
}
