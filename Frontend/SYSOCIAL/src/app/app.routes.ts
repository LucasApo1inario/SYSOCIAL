import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path:'',
        loadChildren:() => import('./features/home/routes')
    },
    {
        path:'auth',
        loadChildren:() => import('./core/auth/pages/routes')
    }
];
