export interface CourseCreateRequest {
  nome: string;
  vagasTotais: number;
  ativo: boolean;
  vagasRestantes?: number;
}
