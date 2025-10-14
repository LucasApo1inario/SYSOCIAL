export interface User{
    id: string;
    username: string;
    type: string;
    status: 'Ativo' | 'Desativado';
}