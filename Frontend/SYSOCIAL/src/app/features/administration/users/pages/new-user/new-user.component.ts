import { Component, inject } from '@angular/core';
import { UserCreateRequest } from '../../interfaces/UserCreateRequest.interface';
import { UsersService } from '../../services/new-user.service';
import { FormsModule } from '@angular/forms';

import {
  ZardFormMessageComponent,
  ZardFormFieldComponent,
  ZardFormControlComponent
} from "@shared/components/form/form.component";
import { ZardButtonComponent } from '@shared/components/button/button.component';
import { ZardInputDirective } from '@shared/components/input/input.directive';
import { ZardFormModule } from '@shared/components/form/form.module';

import { toast } from 'ngx-sonner';
import { Router } from '@angular/router';

@Component({
  selector: 'app-new-user',
  standalone: true,
  imports: [
    FormsModule,
    ZardButtonComponent,
    ZardInputDirective,
    ZardFormModule,
  ],
  templateUrl: './new-user.component.html',
  styleUrl: './new-user.component.css'
})
export class NewUserComponent {

  private router = inject(Router)
  private userService= inject(UsersService)

  idUsername = 'username';
  idNome = 'nome';
  idTelefone = 'telefone';
  idEmail = 'email';
  idSenha = 'senha';
  idTipo = 'tipo';

  model: UserCreateRequest = {
    username: '',
    nome: '',
    telefone: '',
    email: '',
    senha: '',
    tipo: 'user'
  };

  loading = false;


  onSubmit() {
    if (!this.model.username || !this.model.nome || !this.model.email || !this.model.senha) {
      toast.error('Preencha os campos obrigatórios.', {
        position: 'bottom-center',
      });
      return;
    }

    this.loading = true;

    this.userService.createUser(this.model).subscribe({
      next: () => {
        this.loading = false;

        toast.success('Usuário criado com sucesso!', {
          duration: 4000,
          position: 'bottom-center',
        });

        this.model = {
          username: '',
          nome: '',
          telefone: '',
          email: '',
          senha: '',
          tipo: 'user'
        };

        this.router.navigate(['administration/users'])
      },
      error: (err: any) => {
        this.loading = false;

        toast.error(err?.error?.error || 'Erro ao criar usuário.', {
          duration: 5000,
          position: 'bottom-center',
        });
      }
    });
  }

  reset() {
    this.model = {
      username: '',
      nome: '',
      telefone: '',
      email: '',
      senha: '',
      tipo: 'user'
    };

    toast('Formulário limpo!', {
      position: 'bottom-center'
    });
  }

  return(){
    this.router.navigate(['administration/users'])
  }
}
