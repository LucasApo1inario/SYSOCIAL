import { inject, provideAppInitializer } from "@angular/core";
import { AuthService } from "../services/auth/auth.service";
import { AuthTokenStorageService } from "../services/auth/auth-token-storage.service";
import { LoggedInUserStoreService } from "../stores/logged-in-user-store.ts/logged-in-user-store.ts.service";
import { of, switchMap, tap } from "rxjs";

export function provideLoggedInUser() {
    return provideAppInitializer(() => {
        const authTokenService = inject(AuthTokenStorageService)
        
        
        if (!authTokenService.has()){
            return of()
        }
        
        const authService = inject(AuthService)
        const loggedInUserStoreService = inject(LoggedInUserStoreService)

        const token = authTokenService.get() as string;

        return authService.refreshToken(token).pipe(
            tap(res => authTokenService.set(res.token)),
            switchMap(res => authService.getCurrentUser(res.token)),
            tap(user => loggedInUserStoreService.setUser(user)),
            );


    });
}