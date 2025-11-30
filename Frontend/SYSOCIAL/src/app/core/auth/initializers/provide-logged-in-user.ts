import { inject, provideAppInitializer } from "@angular/core";
import { AuthTokenStorageService } from "../services/auth/auth-token-storage.service";
import { of, tap } from "rxjs";
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
            tap(() => {
                // Recuperar usuário do localStorage ou do token
                const userData = localStorage.getItem('user-data');
                if (userData) {
                    try {
                        const user = JSON.parse(userData);
                        loggedInUserStoreService.setUser(user);
                    } catch (e) {
                        console.error('Erro ao restaurar usuário:', e);
                    }
                }
            })
        );
    });
}
