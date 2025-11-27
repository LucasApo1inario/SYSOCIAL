import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { LoggedInUserStoreService } from '../stores/logged-in-user-store.ts/logged-in-user-store.ts.service';
import { AuthTokenStorageService } from '../services/auth/auth-token-storage.service';

export const setAuthTokenInterceptor: HttpInterceptorFn = (req, next) => {
  const loggedInUserStoreService = inject(LoggedInUserStoreService);

  if (!loggedInUserStoreService.isLoggdIn) {
    return next(req);
  }

  const authTokenStorageService = inject(AuthTokenStorageService);
  const token = authTokenStorageService.get();

  const authReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });

  return next(authReq); // ✅ agora vai o clone com auth!
};
