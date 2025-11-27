import { inject, Injectable } from '@angular/core';
import { UserCredentials } from '../interfaces/user-credentials';
import { AuthService } from '../services/auth/auth.service';
import { pipe, switchMap, tap } from 'rxjs';
import { AuthTokenStorageService } from '../services/auth/auth-token-storage.service';
import { LoggedInUserStoreService } from '../stores/logged-in-user-store.ts/logged-in-user-store.ts.service';
import { AuthTokenResponse } from '../interfaces/auth-token-response';

@Injectable({
  providedIn: 'root'
})
export class LoginFacadeService {

  private readonly authService = inject(AuthService)
  private readonly authTokenService = inject(AuthTokenStorageService)
  private readonly loggedInUserStoreService = inject(LoggedInUserStoreService);

  login(userCredentials: UserCredentials){
    return this.authService.login(userCredentials).pipe(this.createUserSection())
  }

  refreshToken(token: string){
  return this.authService.refreshToken(token).pipe(
    tap(res => this.authTokenService.set(res.token))
  );
}



  private createUserSection() {
    return pipe(
      tap((res: AuthTokenResponse) => this.authTokenService.set(res.token)),
      switchMap((res) => this.authService.getCurrentUser(res)),
      tap(user => this.loggedInUserStoreService.setUser(user))
    );
  }

  
}
