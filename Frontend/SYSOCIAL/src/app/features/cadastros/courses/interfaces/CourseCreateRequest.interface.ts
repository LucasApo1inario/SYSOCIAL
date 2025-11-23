import { TurmaCreateRequest } from "./TurmaCreateRequest.interface";

export interface CourseCreateRequest {
  nome: string;
  status: 'Ativo' | 'Inativo';
  vagas: number;
  turmas?: TurmaCreateRequest[];
}
