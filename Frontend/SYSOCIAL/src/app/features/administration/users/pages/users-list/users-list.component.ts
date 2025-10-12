import { Component, computed, Signal, signal, WritableSignal } from '@angular/core';
import { User } from '../../interfaces/user.interface';
import { ZardButtonComponent } from '@shared/components/button/button.component';
import { UserTableComponent } from '../../components/user-table/user-table.component';
import { UserPaginationComponent } from '../../components/user-pagination/user-pagination.component';
import { ZardInputDirective } from '@shared/components/input/input.directive';

import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-users-list',
  imports: [ZardButtonComponent, ZardInputDirective, UserTableComponent, FormsModule, UserPaginationComponent],
  templateUrl: './users-list.component.html',
  styleUrl: './users-list.component.css'
})
export class UsersListComponent {
  searchQuery = signal(''); // signal 
  users: WritableSignal<User[]> = signal([]); 

  // computed -> faz filtrar usuários automaticamente, sem precisar montar funcao para recalcular a tabela e tal
  displayedUsers = computed(() =>
    this.users().filter(u =>
      u.username.toLowerCase().includes(this.searchQuery().toLowerCase())
    )
  );

  pageSize = signal(7); // itens por página
  currentPage = signal(1);
  isMobile= signal(false);


  private checkScreen() {
    this.isMobile.set(window.innerWidth < 768); // breakpoint para mobile
    // ajustar pageSize para mobile:
    this.pageSize.set(this.isMobile() ? 5 : 7);
  }

  totalPages = computed(() =>
    Math.ceil(this.displayedUsers().length / this.pageSize())
  );

  pagedUsers = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.displayedUsers().slice(start, start + this.pageSize());
  });

  constructor() {
    this.checkScreen();
    window.addEventListener('resize', () => this.checkScreen());
    
    // inicializar usuários
    this.users.set([
      { id: '1', username: 'Lucas', type: 'Admin', status: 'Ativo' },
      { id: '2', username: 'Zezinho', type: 'Estudante', status: 'Desativado' },
      { id: '3', username: 'Zezinha', type: 'Professor', status: 'Ativo' },
      { id: '4', username: 'Ana', type: 'Estudante', status: 'Ativo' },
      { id: '5', username: 'Carlos', type: 'Admin', status: 'Desativado' },
      { id: '6', username: 'Beatriz', type: 'Professor', status: 'Ativo' },
      { id: '7', username: 'Diego', type: 'Estudante', status: 'Ativo' },
      { id: '8', username: 'Fernanda', type: 'Admin', status: 'Desativado' },
      { id: '9', username: 'Gustavo', type: 'Professor', status: 'Ativo' },
      { id: '10', username: 'Helena', type: 'Estudante', status: 'Ativo' },
      { id: '11', username: 'Igor', type: 'Admin', status: 'Desativado' },
      { id: '12', username: 'Júlia', type: 'Professor', status: 'Ativo' },
      { id: '13', username: 'Kleber', type: 'Estudante', status: 'Ativo' },
      { id: '14', username: 'Larissa', type: 'Admin', status: 'Desativado' },
      { id: '15', username: 'Marcos', type: 'Professor', status: 'Ativo' },
      { id: '16', username: 'Natália', type: 'Estudante', status: 'Ativo' },
      { id: '17', username: 'Otávio', type: 'Admin', status: 'Desativado' },
      { id: '18', username: 'Patrícia', type: 'Professor', status: 'Ativo' },
      { id: '19', username: 'Bruno', type: 'Estudante', status: 'Ativo' },
      { id: '20', username: 'Rafaela', type: 'Admin', status: 'Desativado' },
    ]);
  }


  addUser() {
    console.log('Adicionar novo usuário');
  }

  editUser(user: User) {
    console.log('Editar', user);
  }

  deleteUser(user: User) {
    this.users.set(this.users().filter(u => u.id !== user.id));
  }

  get search(): string {
    return this.searchQuery();
  }

  set search(value: string) {
    this.searchQuery.set(value);
  }

}