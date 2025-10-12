import { Routes } from '@angular/router';
import { UsersListComponent } from './users/pages/users-list/users-list.component';

export default [
  {
    path: 'users',             // <- apenas "users", não repetir "administration"
    component: UsersListComponent,
  },
] as Routes;
