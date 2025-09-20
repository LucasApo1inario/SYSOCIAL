import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { UserCredentials } from '../../interfaces/user-credentials';
import { AuthTokenResponse } from '../../interfaces/auth-token-response';

@Injectable({
  providedIn: 'root'
})
export class AuthService {


    login(payload: UserCredentials): Observable<AuthTokenResponse>{
      if(payload.email === 'admin' && payload.password === '123'){
        return of({token: 'fake-token'});
      }
      return throwError((()=> new HttpErrorResponse({
        status: 401,
        statusText: 'Unauthorized'
      })))
    } 
  
}
