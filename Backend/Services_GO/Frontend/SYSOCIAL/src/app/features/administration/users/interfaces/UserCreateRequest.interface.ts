export interface UserCreateRequest {
  username: string;
  nome: string;
  telefone?: string;
  email: string;
  senha: string;
  troca_senha: boolean;
  tipo?: 'user' | 'admin' | string;
}

