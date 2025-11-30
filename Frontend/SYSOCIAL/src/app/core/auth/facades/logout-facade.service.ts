import { inject, Injectable } from '@angular/core';
import { AuthService } from '../services/auth/auth.service';
import { AuthTokenStorageService } from '../services/auth/auth-token-storage.service';
import { LoggedInUserStoreService } from '../stores/logged-in-user-store.ts/logged-in-user-store.ts.service';
import { tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LogoutFacadeService {
  
  authService = inject(AuthService)
  authTokenStorageService = inject(AuthTokenStorageService)
  loggedInUserStoreService = inject(LoggedInUserStoreService)

  logout(){
    return this.authService.logout()
    .pipe(
      tap(()=> this.authTokenStorageService.remove()),
      tap(()=> this.loggedInUserStoreService.logout()),
      tap(()=> localStorage.removeItem('user-data'))
    )    
  }


}
