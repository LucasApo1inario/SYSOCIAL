import { inject } from '@angular/core';
import { CanActivateFn, RedirectCommand, Router } from '@angular/router';
import { LoggedInUserStoreService } from '../stores/logged-in-user-store.ts/logged-in-user-store.ts.service';

export const isAuthenticatedGuard: CanActivateFn = (route, state) => {
  
  const loggedInUserStoreService = inject(LoggedInUserStoreService)
  
  if (loggedInUserStoreService.isLoggdIn()){
    return true;
  }

  const router = inject(Router);

  const urlTree = router.parseUrl('/auth/login')

  return new RedirectCommand(urlTree)
  
};
