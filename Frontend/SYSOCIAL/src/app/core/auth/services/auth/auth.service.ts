import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { environment } from 'src/environments/enviroment';
import { UserCredentials } from '../../interfaces/user-credentials';
import { AuthTokenResponse } from '../../interfaces/auth-token-response';
import { User } from '../../interfaces/user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private http: HttpClient) {}

  private apiUrl = environment.apiUrl;

  login(payload: UserCredentials): Observable<AuthTokenResponse> {
    return this.http.post<AuthTokenResponse>(`${this.apiUrl}/auth/login`, {
      username: payload.user,
      senha: payload.password
    });
  }

  /**
   * Decodifica o JWT e extrai dados do usuário.
   * O JWT contém "tipo" (não "type"), então mapeamos para "type".
   */
  getCurrentUser(res: AuthTokenResponse): Observable<User> {
    try {
      const decoded = this.decodeToken(res.token);
      return of({
        id: decoded.user_id || res.user?.id || 0,
        username: decoded.username || res.user?.username || '',
        type: decoded.tipo || res.user?.type || 'U', // JWT usa "tipo", mapeamos para "type"
        troca_senha: res.user?.troca_senha || false
      });
    } catch (e) {
      console.error('Erro ao decodificar JWT:', e);
      // Fallback: usa dados do res.user se JWT falhar
      return of({
        id: res.user?.id || 0,
        username: res.user?.username || '',
        type: res.user?.type || 'U',
        troca_senha: res.user?.troca_senha || false
      });
    }
  }

  /**
   * Decodifica um JWT manualmente (sem validação de assinatura).
   * Base64 decode da payload do JWT.
   */
  private decodeToken(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Token inválido');
      }
      const decoded = atob(parts[1]); // Decodifica a payload (parte 2)
      return JSON.parse(decoded);
    } catch (e) {
      throw new Error('Falha ao decodificar JWT: ' + e);
    }
  }

  refreshToken(token: string) {
    return of({ token: token });
  }

  logout() {
    return of({});
  }
}
