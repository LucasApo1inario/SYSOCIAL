import { Component, inject } from '@angular/core';
import { FormsModule } from "@angular/forms";
import { Z_MODAL_DATA } from "@shared/components/dialog/dialog.service";
import { UsersService } from 'src/app/features/administration/users/services/new-user.service';
import { toast } from "ngx-sonner";
import { of } from 'rxjs';
import { AuthService } from '../services/auth/auth.service';

@Component({
  selector: 'app-change-password-dialog',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="grid gap-4">

      <div>
        <label class="text-sm font-medium">Nova Senha</label>
        <input type="password" [(ngModel)]="password" class="input" />
      </div>

      <div>
        <label class="text-sm font-medium">Repetir Senha</label>
        <input type="password" [(ngModel)]="repeat" class="input" />
      </div>

      <p class="text-xs text-gray-500">
        Você deve alterar sua senha para continuar.
      </p>

    </div>
  `,
  styles: [`
    .input {
      @apply h-10 w-full rounded-md border px-3;
    }
  `]
})
export class ChangePasswordDialogComponent {

  private usersService = inject(UsersService);
  private auth = inject(AuthService);
  data = inject(Z_MODAL_DATA);

  password = "";
  repeat = "";

  async save(): Promise<boolean> {

    if (!this.password || this.password !== this.repeat) {
      toast.error("As senhas não coincidem!");
      return false;
    }

    return new Promise<boolean>((resolve) => {
      this.usersService.updateUser(this.data.userId, {
        senha: this.password,
        troca_senha: false
      }).subscribe({
        next: () => {
          toast.success("Senha alterada com sucesso!");
          this.auth.logout();
          
          resolve(true);
        },
        error: () => {
          toast.error("Erro ao alterar a senha.");
          resolve(false);
        }
      });
    });
}


}
