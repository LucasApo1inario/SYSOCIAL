import { inject } from '@angular/core';
import { CanActivateFn, RedirectCommand, Router } from '@angular/router';

export const isAuthenticatedGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);

  const urlTree = router.parseUrl('/auth/login')

  return new RedirectCommand(urlTree)
  
};
