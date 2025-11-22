export interface Course {
  id: string;
  nome: string;
  vagas: number;
  status: 'Ativo' | 'Inativo';
}
