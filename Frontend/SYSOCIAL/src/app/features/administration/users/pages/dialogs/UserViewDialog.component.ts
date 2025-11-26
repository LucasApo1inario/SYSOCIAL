import { Component, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";

import { Z_MODAL_DATA } from "@shared/components/dialog/dialog.service";
import { ZardInputDirective } from "@shared/components/input/input.directive";
import { ZardButtonComponent } from "@shared/components/button/button.component";

import { UsersService } from "../../services/new-user.service";
import { toast } from "ngx-sonner";

@Component({
  selector: 'app-user-view-dialog',
  standalone: true,
  imports: [
    FormsModule,
    ZardInputDirective,
  ],
  template: `
    <div class="dialog-wrapper">

      <h2 class="text-lg font-semibold">Editar Usuário</h2>

      <!-- USERNAME -->
      <div>
        <label class="text-sm font-medium">Username</label>
        <input z-input type="text" [(ngModel)]="form.username" disabled />
      </div>

      <!-- NOME -->
      <div>
        <label class="text-sm font-medium">Nome</label>
        <input z-input type="text" [(ngModel)]="form.nome" />
      </div>

      <!-- TELEFONE -->
      <div>
        <label class="text-sm font-medium">Telefone</label>
        <input z-input type="text" [(ngModel)]="form.telefone" />
      </div>

      <!-- EMAIL -->
      <div>
        <label class="text-sm font-medium">Email</label>
        <input z-input type="text" [(ngModel)]="form.email" />
      </div>

      <!-- TIPO -->
      <div>
        <label class="text-sm font-medium">Tipo</label>
        <input z-input type="text" [(ngModel)]="form.tipo" />
      </div>

      <!-- TROCAR SENHA -->
      <div class="flex items-center gap-2 mt-3">
        <input type="checkbox" [(ngModel)]="form.troca_senha" id="changePass" />
        <label for="changePass" class="text-sm font-medium">Trocar senha?</label>
      </div>

    </div>
  `
})
export class UserViewDialogComponent {

  private usersService = inject(UsersService);

  user = inject(Z_MODAL_DATA);
  form = { ...this.user, troca_senha: false };

  async save() {
    const diff: any = {};

    for (const key of Object.keys(this.form)) {
      if (this.form[key] !== this.user[key]) {
        diff[key] = this.form[key];
      }
    }

    // força enviar troca_senha sempre
    diff.troca_senha = this.form.troca_senha;

    if (Object.keys(diff).length === 0) {
      toast.info("Nenhuma alteração realizada.");
      return false;
    }

    return new Promise<boolean>((resolve) => {
      this.usersService.updateUser(this.user.id, diff).subscribe({
        next: () => {
          toast.success("Usuário atualizado com sucesso!");
          resolve(true);
        },
        error: () => {
          toast.error("Erro ao atualizar usuário.");
          resolve(false);
        }
      });
    });
  }
}

