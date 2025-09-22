import { inject, provideAppInitializer } from "@angular/core";
import { AuthTokenStorageService } from "../services/auth/auth-token-storage.service";
import { of } from "rxjs";
import { LoginFacadeService } from "../facades/login-facade/login-facade.service";

export function provideLoggedInUser() {
    return provideAppInitializer(() => {
        const authTokenService = inject(AuthTokenStorageService)
        
        
        if (!authTokenService.has()){
            return of()
        }
        
        const loginFacadeService = inject(LoginFacadeService)
        const token = authTokenService.get() as string;

        return loginFacadeService.refreshToken(token);


    });
}