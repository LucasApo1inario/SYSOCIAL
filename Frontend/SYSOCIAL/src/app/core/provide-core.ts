import { makeEnvironmentProviders } from "@angular/core";
import { provideAuth } from "./auth/provide-auth";
import { provideHttpClient, withInterceptors } from "@angular/common/http";
import { setAuthTokenInterceptor } from "./auth/interceptors/set-auth-token-interceptor";

export function provideCore(){
    return makeEnvironmentProviders([
        provideAuth(),
        provideHttpClient(withInterceptors([setAuthTokenInterceptor]))
    ])
}