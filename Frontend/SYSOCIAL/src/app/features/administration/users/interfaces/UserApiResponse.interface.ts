export interface UserApiResponse {
  id: number;
  username: string;
  nome: string;
  telefone: string;
  email: string;
  tipo: 'A' | 'U' | 'P'; // Admin, Usuario, Professor
  created_at: string;
  updated_at: string;
}
