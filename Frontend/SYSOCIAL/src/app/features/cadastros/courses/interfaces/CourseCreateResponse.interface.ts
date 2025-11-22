export interface CourseCreateResponse {
  id: string;
  nome: string;
  descricao: string;
  cargaHoraria: number;
  dataInicio: string;
  dataTermino: string;
  modalidade: 'Presencial' | 'Online' | 'Híbrido';
  status: 'Ativo' | 'Inativo';
  instrutor: string;
  vagas: number;
  createdAt?: string;
}
