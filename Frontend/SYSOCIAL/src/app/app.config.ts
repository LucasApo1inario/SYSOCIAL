import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideLoggedInUser } from './core/auth/initializers/provide-logged-in-user';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { setAuthTokenInterceptor } from './core/auth/interceptors/set-auth-token-interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideLoggedInUser(),
    provideHttpClient(withInterceptors([setAuthTokenInterceptor]))
  ]
};
