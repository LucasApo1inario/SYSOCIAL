import { Component, computed, inject, signal, WritableSignal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { User } from '../../interfaces/user.interface';
import { UsersService } from '../../services/new-user.service';

import { ZardButtonComponent } from '@shared/components/button/button.component';
import { UserTableComponent } from '../../components/user-table/user-table.component';
import { UserPaginationComponent } from '../../components/user-pagination/user-pagination.component';
import { ZardInputDirective } from '@shared/components/input/input.directive';
import { ZardDialogService } from '@shared/components/dialog/dialog.service';
import { UserViewDialogComponent } from '../dialogs/UserViewDialog.component';


@Component({
  selector: 'app-users-list',
  imports: [
    ZardButtonComponent,
    ZardInputDirective,
    UserTableComponent,
    FormsModule,
    UserPaginationComponent
  ],
  templateUrl: './users-list.component.html',
  styleUrl: './users-list.component.css'
})
export class UsersListComponent {
  private router = inject(Router);
  private usersService = inject(UsersService);
  private dialog = inject(ZardDialogService);


  searchQuery = signal('');
  users: WritableSignal<User[]> = signal([]);

  displayedUsers = computed(() =>
    this.users().filter(u =>
      u.username.toLowerCase().includes(this.searchQuery().toLowerCase())
    )
  );

  pageSize = signal(7);
  currentPage = signal(1);
  isMobile = signal(false);

  constructor() {
    this.checkScreen();
    window.addEventListener('resize', () => this.checkScreen());

    this.loadUsers();
  }

  private checkScreen() {
    this.isMobile.set(window.innerWidth < 768);
    this.pageSize.set(this.isMobile() ? 5 : 7);
  }

  private loadUsers() {
    this.usersService.getUsers(50, 0).subscribe({
      next: (response) => {
        this.users.set(
          response.data.map(user => ({
            ...user,
            id: user.id.toString() // garantir string
          }))
        );
      },
      error: (err) => console.error('Erro ao carregar usuários:', err)
    });
  }

  totalPages = computed(() =>
    Math.ceil(this.displayedUsers().length / this.pageSize())
  );

  pagedUsers = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.displayedUsers().slice(start, start + this.pageSize());
  });

  addUser() {
    this.router.navigate(['administration/new-user']);
  }

  editUser(user: User) {
    const ref = this.dialog.create({
      zTitle: 'Editar Usuário',
      zWidth: '600px',
      zContent: UserViewDialogComponent,
      zData: user,
      zOkText: "Salvar",
      zCancelText: "Cancelar",
      zOnOk: async (componentInstance) => {
        const updated = await componentInstance.save();
        if (updated) {
          this.loadUsers();
        }
      }

    });
  }




  deleteUser(user: User) {
    this.users.set(this.users().filter(u => u.id !== user.id));
  }

  get search(): string {
    return this.searchQuery();
  }

  set search(value: string) {
    this.searchQuery.set(value);
    this.currentPage.set(1);
  }

}
