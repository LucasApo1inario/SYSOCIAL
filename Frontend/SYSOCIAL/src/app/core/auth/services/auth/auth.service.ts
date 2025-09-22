import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { UserCredentials } from '../../interfaces/user-credentials';
import { AuthTokenResponse } from '../../interfaces/auth-token-response';
import { User } from '../../interfaces/user';


// utils/jwt.util.ts
export function generateFakeJwt(length: number = 20): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let token = '';

  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return token;
}


@Injectable({
  providedIn: 'root'
})
export class AuthService {


  login(payload: UserCredentials): Observable<AuthTokenResponse>{
    if(payload.email === 'admin' && payload.password === '123'){
      return of({token: generateFakeJwt()});
    }
    return throwError((()=> new HttpErrorResponse({
      status: 401,
      statusText: 'Unauthorized'
    })))
  }   



  getCurrentUser(token: string): Observable<User>{
    return of({
      username: 'admin'
    });
  }



  refreshToken(token: string){
    return of({token: generateFakeJwt()})
  }

  logout(){
    return of({})
  }

}
