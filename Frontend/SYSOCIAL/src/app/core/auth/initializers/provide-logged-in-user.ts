import { inject, provideAppInitializer } from "@angular/core";
import { AuthTokenStorageService } from "../services/auth/auth-token-storage.service";
import { of, tap, switchMap } from "rxjs";
import { LoginFacadeService } from "../facades/login-facade.service";
import { LoggedInUserStoreService } from "../stores/logged-in-user-store.ts/logged-in-user-store.ts.service";
import { AuthService } from "../services/auth/auth.service";

export function provideLoggedInUser() {
    return provideAppInitializer(() => {
        const authTokenService = inject(AuthTokenStorageService)
        const loginFacadeService = inject(LoginFacadeService)
        const authService = inject(AuthService)
        const loggedInUserStoreService = inject(LoggedInUserStoreService)
        
        if (!authTokenService.has()){
            return of()
        }
        
        const token = authTokenService.get() as string;

        return loginFacadeService.refreshToken(token).pipe(
            switchMap(() => authService.getCurrentUser({ token } as any)),
            tap(user => {
                loggedInUserStoreService.setUser(user);
                // Salvar dados atualizados do usuário no localStorage
                localStorage.setItem('user-data', JSON.stringify(user));
            })
        );
    });
}
