export interface UserCreateRequest {
  username: string;
  nome: string;
  telefone?: string;
  email: string;
  senha: string;
  tipo?: 'user' | 'admin' | string;
}

