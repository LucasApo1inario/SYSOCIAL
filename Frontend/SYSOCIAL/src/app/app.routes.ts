import { Routes } from '@angular/router';
import { isAuthenticatedGuard } from './core/auth/guards/is-authenticated-guard';

export const routes: Routes = [
     {
        path: '',
        loadChildren: () => import('./features/home/routes')
    },
    {
        path:'auth',
        loadChildren:() => import('./core/auth/pages/routes')
    },
    {
        path: 'administration',
        loadChildren: () => import('./features/administration/routes'), // módulo filho
        canActivate: [isAuthenticatedGuard],
    },
];
