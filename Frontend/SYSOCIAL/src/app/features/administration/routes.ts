import { Routes } from '@angular/router';
import { UsersListComponent } from './users/pages/users-list/users-list.component';
import { NewUserComponent } from './users/pages/new-user/new-user.component';

export default [
  {
    path: 'users',            
    component: UsersListComponent,
  },
  {
    path: 'new-user',
    component: NewUserComponent
  }
] as Routes;
