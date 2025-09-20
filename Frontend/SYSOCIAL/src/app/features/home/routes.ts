import { Routes } from "@angular/router";
import { HomeComponent } from "./home.component";
import { AboutComponent } from "../about/about.component";
import { ContactComponent } from "../contact/contact.component";



export default [
    {
        path:'',
        component:HomeComponent
    },
    {
        path:'home',
        component:HomeComponent
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