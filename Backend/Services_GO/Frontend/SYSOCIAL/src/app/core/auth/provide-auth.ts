import { makeEnvironmentProviders } from "@angular/core";
import { provideLoggedInUser } from "./initializers/provide-logged-in-user";


export function provideAuth(){
    return makeEnvironmentProviders([ provideLoggedInUser()])
}