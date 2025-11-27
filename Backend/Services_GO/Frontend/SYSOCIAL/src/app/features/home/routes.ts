import { Routes } from "@angular/router";
import { HomeComponent } from "./home.component";
import { AboutComponent } from "../about/about.component";
import { ContactComponent } from "../contact/contact.component";
import { isAuthenticatedGuard } from "src/app/core/auth/guards/is-authenticated-guard";



export default [
    {
        path:'',
        component:HomeComponent,
        canActivate:[
            isAuthenticatedGuard
        ]
    },
    {
        path:'home',
        component:HomeComponent,
        canActivate: [
            isAuthenticatedGuard
        ],
    },
    {
        path:'sobre',
        component:AboutComponent
    },
    {
        path:'contato',
        component:ContactComponent
    }
  

] as Routes;