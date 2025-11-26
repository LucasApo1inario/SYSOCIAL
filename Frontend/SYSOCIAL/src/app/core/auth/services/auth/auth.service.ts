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

 
  getCurrentUser(res: AuthTokenResponse): Observable<User> {
  return of({
    id: res.user.id,
    username: res.user.username,
    type: 'A',
    troca_senha: res.user.troca_senha
  });
}




  refreshToken(token: string){
    return of({token: token })
  }

  logout(){
    return of({})
  }
}
