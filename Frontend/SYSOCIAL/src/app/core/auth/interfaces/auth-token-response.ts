export interface AuthTokenResponse {
  token: string;
  user: {
    id: number;
    username: string;
    type: string;
    troca_senha: boolean;
  };
}
