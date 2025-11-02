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

 
  getCurrentUser(token: string): Observable<User>{

    return of({
      username: 'admin',
      type: 'admin'
    });
  }



  refreshToken(token: string){
    return of({token: 'nao implementado' })
  }

  logout(){
    return of({})
  }
}
