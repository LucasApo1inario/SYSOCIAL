export interface Course {
  id: string;
  nome: string;
  modalidade: 'Presencial' | 'Online' | 'Híbrido';
  cargaHoraria: number;
  dataInicio: string;
  status: 'Ativo' | 'Inativo';
  instrutor: string;
}
