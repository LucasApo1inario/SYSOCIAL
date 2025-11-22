export interface UserCreateResponse {
  id?: string | number;
  username: string;
  nome: string;
  telefone?: string;
  email: string;
  tipo: string;
  createdAt?: string;
}
